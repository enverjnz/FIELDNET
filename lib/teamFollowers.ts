import { supabase } from './supabase';

export async function isUserFollowingTeam(userId: string, teamId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('followers')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function followTeam(userId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('followers')
    .insert({ user_id: userId, team_id: teamId });

  if (error) {
    if (error.code === '23505') return;
    throw error;
  }
}

export async function unfollowTeam(userId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('user_id', userId)
    .eq('team_id', teamId);

  if (error) throw error;
}

export async function isUserTeamManager(userId: string, teamId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('team_managers')
    .select('id')
    .eq('profile_id', userId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
