import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const FEEDBACK_CATEGORIES = [
  '💡 Verbesserungsvorschlag',
  '❓ Allgemeine Frage',
  '🙌 Lob / Sonstiges',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type SubmitFeedbackReportResult = {
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

async function trySendFeedbackEmail(payload: {
  category: string;
  message: string;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-feedback-report', {
      body: payload,
    });

    if (error) {
      const detail = await parseFunctionError(error);
      console.warn('Feedback report email:', detail ?? error.message);
      return false;
    }

    return Boolean(data?.emailSent);
  } catch (e) {
    console.warn('Feedback report email invoke failed:', (e as Error)?.message);
    return false;
  }
}

export async function submitFeedbackReport(
  category: FeedbackCategory,
  message: string,
): Promise<SubmitFeedbackReportResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Bitte melde dich an, um Feedback zu senden.');
  }

  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Bitte schreib uns deine Nachricht.');
  }

  if (trimmed.length < 10) {
    throw new Error('Bitte gib etwas mehr Details an (mindestens 10 Zeichen).');
  }

  const { error: insertError } = await supabase.from('feedback_reports').insert({
    user_id: user.id,
    category,
    message: trimmed,
  });

  if (insertError) {
    if (
      insertError.message.includes('feedback_reports')
      && (insertError.message.includes('does not exist') || insertError.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/feedback_reports.sql in Supabase ausführen.',
      );
    }
    throw new Error(insertError.message || 'Feedback konnte nicht gespeichert werden.');
  }

  const emailSent = await trySendFeedbackEmail({
    category,
    message: trimmed,
  });

  return { emailSent, stored: true };
}
