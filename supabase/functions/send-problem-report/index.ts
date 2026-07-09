import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const REPORT_TO_EMAIL = Deno.env.get('REPORT_TO_EMAIL') ?? 'kontakt@fieldnet-app.de';
const REPORT_FROM_EMAIL = Deno.env.get('REPORT_FROM_EMAIL') ?? 'FIELDNET App <onboarding@resend.dev>';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const ALLOWED_CATEGORIES = [
  'Fehler in der App',
  'Liga-Daten falsch',
  'Account / Login',
  'Sonstiges',
];

type RequestBody = {
  category?: string;
  message?: string;
  userEmail?: string | null;
};

async function sendReportEmail(params: {
  category: string;
  message: string;
  userEmail: string | null;
  userId: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping email send.');
    return false;
  }

  const subject = `[FIELDNET Problem] ${params.category}`;
  const text = [
    'Neue Problemmeldung über die FIELDNET App',
    '',
    `Kategorie: ${params.category}`,
    `User-ID: ${params.userId}`,
    params.userEmail ? `E-Mail: ${params.userEmail}` : 'E-Mail: (nicht hinterlegt)',
    '',
    'Beschreibung:',
    params.message,
    '',
    '---',
    `Gesendet am ${new Date().toISOString()}`,
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
    const category = body.category?.trim() ?? '';
    const message = body.message?.trim() ?? '';

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({ error: 'Ungültige Kategorie.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!message || message.length < 10) {
      return new Response(JSON.stringify({ error: 'Nachricht zu kurz.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailSent = await sendReportEmail({
      category,
      message,
      userEmail: body.userEmail ?? user.email ?? null,
      userId: user.id,
    });

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-problem-report error:', e);
    return new Response(JSON.stringify({ error: 'Interner Fehler.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
