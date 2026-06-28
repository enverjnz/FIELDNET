import { supabase } from './supabase';

async function saveDeletionFeedback(reason: string, feedback?: string): Promise<string | null> {
  const trimmedFeedback = feedback?.trim() || null;

  const { error: rpcError } = await supabase.rpc('submit_deletion_feedback', {
    p_reason: reason,
    p_feedback: trimmedFeedback,
  });

  if (!rpcError) return null;

  const { error: insertError } = await supabase.from('delete_profiles').insert({
    reason,
    feedback: trimmedFeedback,
  });

  if (insertError) {
    console.warn('Deletion feedback not saved:', insertError.message);
    return null;
  }

  return null;
}

export async function deleteAccount(
  reason: string,
  feedback?: string,
): Promise<{ error?: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Nicht eingeloggt.' };
  }

  await saveDeletionFeedback(reason, feedback);

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
