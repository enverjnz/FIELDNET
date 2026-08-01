import { supabase } from './supabase';

export async function fetchManagedTeamIds(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('team_managers')
    .select('team_id')
    .eq('profile_id', user.id);

  if (error) {
    console.warn('fetchManagedTeamIds:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.team_id as string);
}

export function canManageTeamPost(
  postTeamId: string | null | undefined,
  managedTeamIds: string[],
): boolean {
  if (!postTeamId || managedTeamIds.length === 0) return false;
  return managedTeamIds.includes(postTeamId);
}
