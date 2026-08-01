import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import type { EmailOtpType, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const AUTH_CONFIRM_PATH = 'auth/confirm';
export const AUTH_RESET_PATH = 'auth/reset-password';
export const AUTH_REDIRECT_SCHEME_URL = `fieldnet://${AUTH_CONFIRM_PATH}`;

function buildAuthRedirectUrl(path: string): string {
  const fromLinking = Linking.createURL(path);

  if (fromLinking.startsWith('exp://') || fromLinking.startsWith('fieldnet://')) {
    return fromLinking;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `exp://${hostUri}/--/${path}`;
  }

  return `fieldnet://${path}`;
}

export function getEmailRedirectUrl(): string {
  return buildAuthRedirectUrl(AUTH_CONFIRM_PATH);
}

export function getPasswordResetRedirectUrl(): string {
  return buildAuthRedirectUrl(AUTH_RESET_PATH);
}

export function isAuthRedirectUrl(url: string): boolean {
  return isAuthConfirmUrl(url) || isPasswordResetUrl(url);
}

export function isPasswordResetUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('auth/reset-password') || lower.includes('type=recovery');
}

export function isAuthConfirmUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('auth/confirm')
    || lower.includes('access_token=')
    || lower.includes('token_hash=')
    || lower.includes('type=signup')
    || lower.includes('type=email')
    || lower.includes('type=email_change')
    || lower.includes('error_code=')
  );
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const collect = (segment: string | undefined) => {
    if (!segment) return;
    new URLSearchParams(segment).forEach((value, key) => {
      params[key] = value;
    });
  };

  const [beforeHash, hashPart] = url.split('#');
  collect(hashPart);
  collect(beforeHash.split('?')[1]);

  return params;
}

function decodeParam(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value.replace(/\+/g, ' ');
  }
}

function mapRedirectError(params: Record<string, string>): string | null {
  const code = params.error_code ?? params.error;
  if (!code) return null;

  if (code === 'otp_expired') {
    return 'Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere eine neue E-Mail an.';
  }

  return decodeParam(params.error_description) ?? 'Authentifizierung fehlgeschlagen.';
}

function resolveOtpType(type: string | undefined): EmailOtpType {
  if (
    type === 'signup'
    || type === 'email'
    || type === 'recovery'
    || type === 'email_change'
    || type === 'invite'
    || type === 'magiclink'
  ) {
    return type;
  }
  return 'email';
}

export async function handleAuthRedirectUrl(
  url: string,
): Promise<{
  error?: string;
  sessionCreated: boolean;
  passwordRecovery?: boolean;
  emailChange?: boolean;
}> {
  if (!url || !isAuthRedirectUrl(url)) {
    return { sessionCreated: false };
  }

  const params = parseUrlParams(url);
  const redirectError = mapRedirectError(params);
  if (redirectError) {
    return { error: redirectError, sessionCreated: false };
  }

  const isRecovery = params.type === 'recovery' || isPasswordResetUrl(url);
  const isEmailChange = params.type === 'email_change';
  const tokenHash = params.token_hash;
  const type = params.type;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: resolveOtpType(type),
    });
    if (error) {
      if (error.message.toLowerCase().includes('expired')) {
        return {
          error: isRecovery
            ? 'Der Link ist abgelaufen. Bitte fordere eine neue E-Mail an.'
            : 'Der Bestätigungslink ist abgelaufen. Bitte fordere eine neue E-Mail an.',
          sessionCreated: false,
        };
      }
      return { error: error.message, sessionCreated: false };
    }
    return {
      sessionCreated: true,
      passwordRecovery: isRecovery,
      emailChange: isEmailChange,
    };
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { error: error.message, sessionCreated: false };
    return {
      sessionCreated: true,
      passwordRecovery: isRecovery,
      emailChange: isEmailChange,
    };
  }

  return { sessionCreated: false };
}

export function isEmailConfirmed(user: User | null | undefined): boolean {
  return !!user?.email_confirmed_at;
}

export async function verifySignupEmailCode(
  email: string,
  token: string,
): Promise<{ error?: string }> {
  const trimmedEmail = email.trim();
  const trimmedToken = token.trim().replace(/\s/g, '');

  if (!trimmedEmail) return { error: 'E-Mail fehlt.' };
  if (!/^\d{6}$/.test(trimmedToken)) {
    return { error: 'Bitte gib den 6-stelligen Code aus der E-Mail ein.' };
  }

  const { error } = await supabase.auth.verifyOtp({
    email: trimmedEmail,
    token: trimmedToken,
    type: 'signup',
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes('expired')) {
      return { error: 'Der Code ist abgelaufen. Bitte fordere einen neuen an.' };
    }
    if (lower.includes('invalid') || lower.includes('token')) {
      return { error: 'Der Code ist ungültig. Bitte prüfe deine Eingabe.' };
    }
    return { error: error.message };
  }

  return {};
}

export async function resendSignupConfirmation(email: string): Promise<{ error?: string }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: 'E-Mail fehlt.' };

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmed,
  });

  if (error) return { error: error.message };
  return {};
}
