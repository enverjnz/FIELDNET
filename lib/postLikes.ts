import { supabase } from './supabase';

export type PostLikeSummary = {
  count: number;
  liked: boolean;
};

export async function fetchPostLikeSummary(postId: string): Promise<PostLikeSummary> {
  const { data: { user } } = await supabase.auth.getUser();

  const countQuery = supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  const likedQuery = user
    ? supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()
    : null;

  const [countResult, likedResult] = await Promise.all([
    countQuery,
    likedQuery ?? Promise.resolve({ data: null, error: null }),
  ]);

  if (countResult.error) throw countResult.error;
  if (likedResult.error) throw likedResult.error;

  return {
    count: countResult.count ?? 0,
    liked: !!likedResult.data,
  };
}

export async function togglePostLike(postId: string): Promise<PostLikeSummary> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Bitte melde dich an, um Beiträge zu liken.');

  const { data: existing, error: readErr } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (readErr) throw readErr;

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });
    if (error) throw error;
  }

  return fetchPostLikeSummary(postId);
}
