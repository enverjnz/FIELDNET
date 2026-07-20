import { supabase } from './supabase';

export async function isUserFollowingProfile(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profile_followers')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function followProfile(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (followerId === followingId) return;

  const { error } = await supabase
    .from('profile_followers')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    if (error.code === '23505') return;
    throw error;
  }
}

export async function unfollowProfile(
  followerId: string,
  followingId: string,
): Promise<void> {
  const { error } = await supabase
    .from('profile_followers')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function fetchFollowedProfiles(followerId: string) {
  const { data, error } = await supabase
    .from('profile_followers')
    .select('following_id, profiles:following_id(id, first_name, last_name, role, avatar, position)')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? [])
    .map((row: { profiles?: unknown }) => row.profiles)
    .filter(Boolean);
}
