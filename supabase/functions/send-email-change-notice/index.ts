import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPORT_FROM_EMAIL = Deno.env.get('REPORT_FROM_EMAIL') ?? 'FIELDNET App <onboarding@resend.dev>';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

type RequestBody = {
  newEmail?: string;
};

async function sendEmailChangeNotice(params: {
  oldEmail: string;
  newEmail: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping email send.');
    return false;
  }

  const subject = 'E-Mail-Änderung angefordert';
  const text = [
    'Hallo,',
    '',
    'für dein FIELDNET-Konto wurde eine Änderung der E-Mail-Adresse angefordert.',
    '',
    `Neue Adresse: ${params.newEmail}`,
    '',
    'Die neue Adresse wird erst aktiv, nachdem der Bestätigungslink in der E-Mail an die neue Adresse geöffnet wurde.',
    '',
    'Falls du das nicht warst, kontaktiere uns bitte umgehend unter kontakt@fieldnet-app.de.',
    '',
    '---',
    'FIELDNET',
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REPORT_FROM_EMAIL,
      to: [params.oldEmail],
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

    const oldEmail = (user.email ?? '').trim().toLowerCase();
    if (!oldEmail) {
      return new Response(JSON.stringify({ error: 'Keine aktuelle E-Mail hinterlegt.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    const newEmail = body.newEmail?.trim().toLowerCase() ?? '';
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      return new Response(JSON.stringify({ error: 'Ungültige neue E-Mail-Adresse.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (oldEmail === newEmail) {
      return new Response(JSON.stringify({ error: 'Neue Adresse entspricht der aktuellen.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailSent = await sendEmailChangeNotice({ oldEmail, newEmail });

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-email-change-notice error:', e);
    return new Response(JSON.stringify({ error: 'Interner Fehler.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
