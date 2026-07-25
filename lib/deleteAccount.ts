import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

async function parseFunctionError(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = await error.context.json();
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // ignore parse errors
  }
  return null;
}

async function trySendAccountDeletionEmail(payload: {
  reason: string;
  feedback?: string;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-account-deletion', {
      body: {
        reason: payload.reason,
        feedback: payload.feedback?.trim() || null,
      },
    });

    if (error) {
      const detail = await parseFunctionError(error);
      console.warn('Account deletion email:', detail ?? error.message);
      return false;
    }

    return Boolean(data?.emailSent);
  } catch (e) {
    console.warn('Account deletion email invoke failed:', (e as Error)?.message);
    return false;
  }
}

async function tryDeleteAuthUser(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('delete-auth-user');

    if (error) {
      const detail = await parseFunctionError(error);
      console.warn('Auth user delete fallback:', detail ?? error.message);
      return;
    }

    if (!data?.ok) {
      console.warn('Auth user delete fallback: unexpected response');
    }
  } catch (e) {
    console.warn('Auth user delete fallback failed:', (e as Error)?.message);
  }
}

async function saveDeletionFeedback(reason: string, feedback?: string): Promise<string | null> {
  const trimmedFeedback = feedback?.trim() || null;

  const { error: rpcError } = await supabase.rpc('submit_deletion_feedback', {
    p_reason: reason,
    p_feedback: trimmedFeedback,
  });

  if (!rpcError) return null;

  const { error: insertError } = await supabase.from('delete_profiles').insert({
    reason,
    feedback: trimmedFeedback,
  });

  if (insertError) {
    console.warn('Deletion feedback not saved:', insertError.message);
    return null;
  }

  return null;
}

export async function deleteAccount(
  reason: string,
  password: string,
  feedback?: string,
): Promise<{ error?: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Nicht eingeloggt.' };
  }

  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    return { error: 'Bitte gib dein Passwort ein.' };
  }

  if (!user.email) {
    return { error: 'Keine E-Mail hinterlegt — Passwort konnte nicht geprüft werden.' };
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: trimmedPassword,
  });

  if (passwordError) {
    const msg = passwordError.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return { error: 'Passwort ist falsch.' };
    }
    return { error: passwordError.message };
  }

  await saveDeletionFeedback(reason, feedback);
  await trySendAccountDeletionEmail({ reason, feedback });

  const { error: rpcError } = await supabase.rpc('delete_own_account');

  if (rpcError) {
    return {
      error:
        rpcError.message.includes('delete_own_account')
          ? 'Kontolöschung nicht eingerichtet. Bitte sql/delete_own_account.sql in Supabase ausführen.'
          : rpcError.message,
    };
  }

  await tryDeleteAuthUser();

  try {
    await supabase.auth.signOut();
  } catch {
    // Session ist nach Auth-Löschung oft bereits ungültig.
  }
  return {};
}
