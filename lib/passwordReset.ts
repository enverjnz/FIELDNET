import { supabase } from './supabase';
import { getPasswordResetRedirectUrl } from './authRedirect';

export async function requestPasswordResetEmail(email: string): Promise<{ error?: string }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: 'E-Mail ist Pflicht.' };
  if (!/\S+@\S+\.\S+/.test(trimmed)) {
    return { error: 'Ungültige E-Mail-Adresse.' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) return { error: error.message };
  return {};
}

export async function updateAccountPassword(password: string): Promise<{ error?: string }> {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return { error: 'Das Passwort muss mindestens 8 Zeichen haben.' };
  }

  const { error } = await supabase.auth.updateUser({ password: trimmed });
  if (error) return { error: error.message };
  return {};
}
