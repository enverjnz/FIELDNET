import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPORT_TO_EMAIL = Deno.env.get('REPORT_TO_EMAIL') ?? 'kontakt@fieldnet-app.de';
const REPORT_FROM_EMAIL = Deno.env.get('REPORT_FROM_EMAIL') ?? 'FIELDNET App <onboarding@resend.dev>';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const ALLOWED_TYPES = ['profile', 'comment', 'message'] as const;
const ALLOWED_REASONS = ['spam', 'harassment', 'inappropriate', 'other'] as const;

type ReportedType = (typeof ALLOWED_TYPES)[number];
type ReportReason = (typeof ALLOWED_REASONS)[number];

type RequestBody = {
  reportId?: string;
  reportedType?: string;
  targetId?: string;
  reason?: string;
  details?: string | null;
  createdAt?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function typeLabel(type: ReportedType): string {
  if (type === 'profile') return 'Profil';
  if (type === 'message') return 'Forum-Nachricht';
  return 'Kommentar';
}

function reasonLabel(reason: ReportReason): string {
  switch (reason) {
    case 'spam':
      return 'Spam';
    case 'harassment':
      return 'Belästigung / Harassment';
    case 'inappropriate':
      return 'Unangemessen';
    case 'other':
      return 'Sonstiges';
    default:
      return reason;
  }
}

async function sendReportNotificationEmail(params: {
  reportId: string | null;
  reportedType: ReportedType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  reporterId: string;
  reporterEmail: string | null;
  createdAt: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping email send.');
    return false;
  }

  const subject = `[FIELDNET Meldung] ${typeLabel(params.reportedType)} · ${reasonLabel(params.reason)}`;
  const detailsBlock = params.details?.trim()
    ? escapeHtml(params.details.trim())
    : '<em>(keine Angaben)</em>';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 16px;">Neue Nutzer-Meldung</h2>
      <p style="margin: 0 0 20px; color: #444;">
        Es wurde Inhalt in der FIELDNET App gemeldet (Report &amp; Moderation).
      </p>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Typ</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(typeLabel(params.reportedType))} (${escapeHtml(params.reportedType)})</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Grund</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(reasonLabel(params.reason))} (${escapeHtml(params.reason)})</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Details</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${detailsBlock}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Target-ID</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 13px;">${escapeHtml(params.targetId)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Reporter-ID</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 13px;">${escapeHtml(params.reporterId)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Reporter-E-Mail</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${params.reporterEmail ? escapeHtml(params.reporterEmail) : '<em>(nicht hinterlegt)</em>'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Report-ID</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 13px;">${params.reportId ? escapeHtml(params.reportId) : '<em>(keine)</em>'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Timestamp</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(params.createdAt)}</td>
        </tr>
      </table>
      <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px;">
        Bitte die Meldung im Supabase-Dashboard unter <code>public.reports</code> prüfen.
      </p>
    </div>
  `.trim();

  const text = [
    'Neue Nutzer-Meldung über die FIELDNET App',
    '',
    `Typ: ${typeLabel(params.reportedType)} (${params.reportedType})`,
    `Grund: ${reasonLabel(params.reason)} (${params.reason})`,
    `Details: ${params.details?.trim() || '(keine Angaben)'}`,
    `Target-ID: ${params.targetId}`,
    `Reporter-ID: ${params.reporterId}`,
    params.reporterEmail ? `Reporter-E-Mail: ${params.reporterEmail}` : 'Reporter-E-Mail: (nicht hinterlegt)',
    params.reportId ? `Report-ID: ${params.reportId}` : 'Report-ID: (keine)',
    `Timestamp: ${params.createdAt}`,
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REPORT_FROM_EMAIL,
      to: [REPORT_TO_EMAIL],
      reply_to: params.reporterEmail ?? undefined,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Resend error:', errText);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    const reportedType = body.reportedType?.trim() ?? '';
    const targetId = body.targetId?.trim() ?? '';
    const reason = body.reason?.trim() ?? '';
    const details = body.details?.trim() || null;
    const reportId = body.reportId?.trim() || null;
    const createdAt = body.createdAt?.trim() || new Date().toISOString();

    if (!ALLOWED_TYPES.includes(reportedType as ReportedType)) {
      return new Response(JSON.stringify({ error: 'Ungültiger Meldetyp.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_REASONS.includes(reason as ReportReason)) {
      return new Response(JSON.stringify({ error: 'Ungültiger Meldegrund.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!targetId || !/^[0-9a-f-]{36}$/i.test(targetId)) {
      return new Response(JSON.stringify({ error: 'Ungültige Target-ID.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailSent = await sendReportNotificationEmail({
      reportId,
      reportedType: reportedType as ReportedType,
      targetId,
      reason: reason as ReportReason,
      details,
      reporterId: user.id,
      reporterEmail: user.email ?? null,
      createdAt,
    });

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-report-notification error:', e);
    return new Response(JSON.stringify({ error: 'Interner Fehler.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
