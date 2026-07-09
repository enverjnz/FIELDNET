import { supabase } from './supabase';

export type PostCommentProfile = {
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: PostCommentProfile | null;
};

const COMMENT_SELECT = `
  id,
  post_id,
  user_id,
  content,
  created_at
`;

async function fetchProfilesByUserIds(
  userIds: string[],
): Promise<Map<string, PostCommentProfile>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar')
    .in('id', uniqueIds);

  if (error) throw error;

  const map = new Map<string, PostCommentProfile>();
  for (const row of data ?? []) {
    map.set(row.id, {
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      avatar: row.avatar ?? null,
    });
  }
  return map;
}

async function attachProfiles(
  rows: Omit<PostComment, 'profiles'>[],
): Promise<PostComment[]> {
  const profileMap = await fetchProfilesByUserIds(rows.map((r) => r.user_id));
  return rows.map((row) => ({
    ...row,
    profiles: profileMap.get(row.user_id) ?? null,
  }));
}

export async function fetchCommentsForPost(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return attachProfiles((data ?? []) as Omit<PostComment, 'profiles'>[]);
}

export async function countCommentsForPost(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('post_comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;
  return count ?? 0;
}

export async function createPostComment(postId: string, content: string): Promise<PostComment> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Bitte gib einen Kommentar ein.');

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Bitte melde dich an, um zu kommentieren.');

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: trimmed,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) throw error;

  const [withProfile] = await attachProfiles([data as Omit<PostComment, 'profiles'>]);
  return withProfile;
}

export function formatCommentAuthor(comment: PostComment): string {
  const p = comment.profiles;
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
  return name || 'FIELDNET User';
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
