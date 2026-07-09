import { supabase } from './supabase';

export const POST_CATEGORIES = [
  'News',
  'Spielbericht',
  'Trainings-Update',
  'Event',
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export type TeamPost = {
  id: string;
  team_id: string;
  author_id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
};

export type TeamPostWithTeam = TeamPost & {
  teams: {
    id: string;
    name: string;
    short_name: string | null;
    avatar_teamlogo: string | null;
  } | null;
};

const POST_SELECT = `
  id,
  team_id,
  author_id,
  title,
  content,
  image_url,
  category,
  created_at
`;

export async function fetchPostsForTeam(teamId: string): Promise<TeamPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TeamPost[];
}

export async function fetchLatestPosts(limit = 20): Promise<TeamPostWithTeam[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      ${POST_SELECT},
      teams:team_id (
        id,
        name,
        short_name,
        avatar_teamlogo
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const teams = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    return { ...row, teams: teams ?? null } as TeamPostWithTeam;
  });
}

export type CreateTeamPostInput = {
  teamId: string;
  title: string;
  content: string;
  category: PostCategory;
  imageUrl?: string | null;
};

export async function createTeamPost(input: CreateTeamPostInput): Promise<TeamPost> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Nicht eingeloggt.');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      team_id: input.teamId,
      author_id: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      image_url: input.imageUrl?.trim() || null,
    })
    .select(POST_SELECT)
    .single();

  if (error) throw error;
  return data as TeamPost;
}

export type UpdateTeamPostInput = {
  postId: string;
  title: string;
  content: string;
  category: PostCategory;
  imageUrl?: string | null;
};

export async function updateTeamPost(input: UpdateTeamPostInput): Promise<TeamPost> {
  const { data, error } = await supabase
    .from('posts')
    .update({
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      image_url: input.imageUrl?.trim() || null,
    })
    .eq('id', input.postId)
    .select(POST_SELECT)
    .single();

  if (error) throw error;
  return data as TeamPost;
}

export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
