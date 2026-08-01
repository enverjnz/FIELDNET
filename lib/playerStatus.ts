import { supabase } from './supabase';

export async function fetchPlayerInjuredStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_injured')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('fetchPlayerInjuredStatus:', error.message);
    return false;
  }

  return Boolean(data?.is_injured);
}

export async function setPlayerInjuredStatus(isInjured: boolean): Promise<void> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Nicht eingeloggt.');

  const { error } = await supabase
    .from('profiles')
    .update({ is_injured: isInjured })
    .eq('id', user.id);

  if (error) throw error;
}
