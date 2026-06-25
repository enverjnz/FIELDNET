import { supabase } from './supabase';

export async function deleteAccount(
  reason: string,
  feedback?: string,
): Promise<{ error?: string }> {
  const { error: feedbackError } = await supabase.from('delete_profiles').insert({
    reason,
    feedback: feedback?.trim() || null,
  });

  if (feedbackError) {
    return { error: feedbackError.message };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Nicht eingeloggt.' };
  }

  const { error: rpcError } = await supabase.rpc('delete_own_account');

  if (rpcError) {
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  await supabase.auth.signOut();
  return {};
}
