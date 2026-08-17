import { supabase } from './supabase';
import type { TeamPostWithTeam } from './teamPosts';

const POST_SELECT = `
  id,
  team_id,
  author_id,
  title,
  content,
  image_url,
  category,
  created_at,
  teams:team_id (
    id,
    name,
    short_name,
    avatar_teamlogo
  )
`;

export async function fetchPostFavoriteStatus(postId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('post_favorites')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function togglePostFavorite(postId: string): Promise<boolean> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    throw new Error('Bitte melde dich an, um Beiträge zu favorisieren.');
  }

  const { data: existing, error: readErr } = await supabase
    .from('post_favorites')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (readErr) throw readErr;

  if (existing) {
    const { error } = await supabase
      .from('post_favorites')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('post_favorites')
    .insert({ post_id: postId, user_id: user.id });
  if (error) throw error;
  return true;
}

export async function fetchFavoritePostsForUser(): Promise<TeamPostWithTeam[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('post_favorites')
    .select(`
      created_at,
      posts:post_id (
        ${POST_SELECT}
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.posts as TeamPostWithTeam | null)
    .filter((post): post is TeamPostWithTeam => !!post?.id);
}
