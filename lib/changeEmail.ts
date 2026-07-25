import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getEmailRedirectUrl } from './authRedirect';

async function trySendEmailChangeNotice(newEmail: string): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email-change-notice', {
      body: { newEmail },
    });

    if (error) {
      let detail: string | null = null;
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json();
          if (typeof body?.error === 'string') detail = body.error;
        } catch {
          // ignore parse errors
        }
      }
      console.warn('Email change notice:', detail ?? error.message);
    }
  } catch (e) {
    console.warn('Email change notice invoke failed:', (e as Error)?.message);
  }
}

export async function requestEmailChange(newEmail: string): Promise<{ error?: string }> {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed) return { error: 'E-Mail ist Pflicht.' };
  if (!/\S+@\S+\.\S+/.test(trimmed)) {
    return { error: 'Ungültige E-Mail-Adresse.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Nicht angemeldet.' };

  const current = (user.email ?? '').trim().toLowerCase();
  if (current && current === trimmed) {
    return { error: 'Das ist bereits deine aktuelle E-Mail-Adresse.' };
  }

  const { error } = await supabase.auth.updateUser(
    { email: trimmed },
    { emailRedirectTo: getEmailRedirectUrl() },
  );

  if (error) return { error: error.message };

  await trySendEmailChangeNotice(trimmed);
  return {};
}
