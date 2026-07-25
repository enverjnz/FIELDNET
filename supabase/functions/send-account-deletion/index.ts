import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const REPORT_TO_EMAIL = Deno.env.get('REPORT_TO_EMAIL') ?? 'kontakt@fieldnet-app.de';
const REPORT_FROM_EMAIL = Deno.env.get('REPORT_FROM_EMAIL') ?? 'FIELDNET App <onboarding@resend.dev>';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const ALLOWED_REASONS = [
  'App zu kompliziert',
  'Kein Bedarf mehr',
  'Wechsel zu anderem Tool',
  'Sonstiges',
];

type RequestBody = {
  reason?: string;
  feedback?: string | null;
};

async function sendAccountDeletionEmail(params: {
  reason: string;
  feedback: string | null;
  userEmail: string | null;
  userId: string;
  profileName: string | null;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping email send.');
    return false;
  }

  const subject = 'Konto Löschung';
  const text = [
    'Ein FIELDNET-Nutzer hat sein Konto gelöscht.',
    '',
    `User-ID: ${params.userId}`,
    params.userEmail ? `E-Mail: ${params.userEmail}` : 'E-Mail: (nicht hinterlegt)',
    params.profileName ? `Profilname: ${params.profileName}` : null,
    '',
    `Grund: ${params.reason}`,
    params.feedback ? `Feedback: ${params.feedback}` : 'Feedback: (keines)',
    '',
    '---',
    `Gelöscht am ${new Date().toISOString()}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REPORT_FROM_EMAIL,
      to: [REPORT_TO_EMAIL],
      reply_to: params.userEmail ?? undefined,
      subject,
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
    const reason = body.reason?.trim() ?? '';
    const feedback = body.feedback?.trim() || null;

    if (!ALLOWED_REASONS.includes(reason)) {
      return new Response(JSON.stringify({ error: 'Ungültiger Löschgrund.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();

    const profileName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || null;

    const emailSent = await sendAccountDeletionEmail({
      reason,
      feedback,
      userEmail: user.email ?? null,
      userId: user.id,
      profileName,
    });

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-account-deletion error:', e);
    return new Response(JSON.stringify({ error: 'Interner Fehler.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
