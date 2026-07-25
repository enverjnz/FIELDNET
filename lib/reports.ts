import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const REPORT_TYPES = ['profile', 'comment', 'message'] as const;
export type ReportedType = (typeof REPORT_TYPES)[number];

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Belästigung',
  inappropriate: 'Unangemessener Inhalt',
  other: 'Sonstiges',
};

export type SubmitReportInput = {
  reportedType: ReportedType;
  targetId: string;
  reason: ReportReason;
  details?: string | null;
};

export type SubmitReportResult = {
  reportId: string;
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

async function trySendReportNotification(payload: {
  reportId: string;
  reportedType: ReportedType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  createdAt: string | null;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-report-notification', {
      body: payload,
    });

    if (error) {
      const detail = await parseFunctionError(error);
      console.warn('Report notification email:', detail ?? error.message);
      return false;
    }

    return Boolean(data?.emailSent);
  } catch (e) {
    console.warn('Report notification invoke failed:', (e as Error)?.message);
    return false;
  }
}

export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Bitte melde dich an, um etwas zu melden.');
  }

  const reportedType = input.reportedType;
  const targetId = input.targetId?.trim() ?? '';
  const reason = input.reason;
  const details = input.details?.trim() || null;

  if (!REPORT_TYPES.includes(reportedType)) {
    throw new Error('Ungültiger Meldetyp.');
  }

  if (!REPORT_REASONS.includes(reason)) {
    throw new Error('Ungültiger Meldegrund.');
  }

  if (!targetId) {
    throw new Error('Ziel der Meldung fehlt.');
  }

  if (reason === 'other' && (!details || details.length < 5)) {
    throw new Error('Bitte beschreibe kurz den Grund (mindestens 5 Zeichen).');
  }

  if (details && details.length > 2000) {
    throw new Error('Die Beschreibung ist zu lang (max. 2000 Zeichen).');
  }

  const { data: row, error: insertError } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_type: reportedType,
      target_id: targetId,
      reason,
      details,
      status: 'pending',
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    if (
      insertError.message.includes('reports')
      && (insertError.message.includes('does not exist') || insertError.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/reports.sql in Supabase ausführen.',
      );
    }
    throw new Error(insertError.message || 'Meldung konnte nicht gespeichert werden.');
  }

  const reportId = row.id as string;
  const createdAt = (row.created_at as string | null) ?? new Date().toISOString();

  const emailSent = await trySendReportNotification({
    reportId,
    reportedType,
    targetId,
    reason,
    details,
    createdAt,
  });

  return { reportId, emailSent, stored: true };
}
