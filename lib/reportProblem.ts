import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const PROBLEM_CATEGORIES = [
  'Fehler in der App',
  'Liga-Daten falsch',
  'Account / Login',
  'Sonstiges',
] as const;

export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

export type SubmitProblemReportResult = {
  emailSent: boolean;
  stored: boolean;
};

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

async function trySendReportEmail(payload: {
  category: string;
  message: string;
  userEmail: string | null;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-problem-report', {
      body: payload,
    });

    if (error) {
      const detail = await parseFunctionError(error);
      console.warn('Problem report email:', detail ?? error.message);
      return false;
    }

    return Boolean(data?.emailSent);
  } catch (e) {
    console.warn('Problem report email invoke failed:', (e as Error)?.message);
    return false;
  }
}

export async function submitProblemReport(
  category: ProblemCategory,
  message: string,
): Promise<SubmitProblemReportResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Bitte melde dich an, um ein Problem zu melden.');
  }

  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Bitte beschreibe das Problem.');
  }

  if (trimmed.length < 10) {
    throw new Error('Bitte gib etwas mehr Details an (mindestens 10 Zeichen).');
  }

  const { error: insertError } = await supabase.from('problem_reports').insert({
    user_id: user.id,
    category,
    message: trimmed,
  });

  if (insertError) {
    if (
      insertError.message.includes('problem_reports')
      && (insertError.message.includes('does not exist') || insertError.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/problem_reports.sql in Supabase ausführen.',
      );
    }
    throw new Error(insertError.message || 'Meldung konnte nicht gespeichert werden.');
  }

  const emailSent = await trySendReportEmail({
    category,
    message: trimmed,
    userEmail: user.email ?? null,
  });

  return { emailSent, stored: true };
}
