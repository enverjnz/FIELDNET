import { supabase } from './supabase';
import { unfollowProfile } from './profileFollowers';

export type BlockedProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: string | null;
  blocked_at: string | null;
};

export async function fetchBlockedProfiles(blockerId: string): Promise<BlockedProfile[]> {
  if (!blockerId) return [];

  const { data: blocks, error } = await supabase
    .from('profile_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', blockerId)
    .order('created_at', { ascending: false });

  if (error) {
    if (
      error.message.includes('profile_blocks')
      && (error.message.includes('does not exist') || error.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/profile_blocks.sql in Supabase ausführen.',
      );
    }
    throw error;
  }

  const rows = blocks ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.blocked_id as string).filter(Boolean);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar, role')
    .in('id', ids);

  if (profilesError) throw profilesError;

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  return rows
    .map((row) => {
      const profile = byId.get(row.blocked_id as string);
      if (!profile) {
        return {
          id: row.blocked_id as string,
          first_name: null,
          last_name: null,
          avatar: null,
          role: null,
          blocked_at: row.created_at ?? null,
        } satisfies BlockedProfile;
      }
      return {
        id: profile.id as string,
        first_name: (profile.first_name as string | null) ?? null,
        last_name: (profile.last_name as string | null) ?? null,
        avatar: (profile.avatar as string | null) ?? null,
        role: (profile.role as string | null) ?? null,
        blocked_at: row.created_at ?? null,
      } satisfies BlockedProfile;
    });
}

export async function isProfileBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  if (!blockerId || !blockedId || blockerId === blockedId) return false;

  const { data, error } = await supabase
    .from('profile_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes('profile_blocks')
      && (error.message.includes('does not exist') || error.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/profile_blocks.sql in Supabase ausführen.',
      );
    }
    throw error;
  }

  return !!data;
}

/** True if either user has blocked the other. */
export async function isBlockBetweenUsers(
  userA: string,
  userB: string,
): Promise<boolean> {
  if (!userA || !userB || userA === userB) return false;

  const [forward, reverse] = await Promise.all([
    isProfileBlocked(userA, userB),
    isProfileBlocked(userB, userA),
  ]);

  return forward || reverse;
}

export async function blockProfile(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (!blockerId || !blockedId) {
    throw new Error('Blockieren nicht möglich.');
  }
  if (blockerId === blockedId) {
    throw new Error('Du kannst dich nicht selbst blockieren.');
  }

  const { error } = await supabase.from('profile_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    if (error.code === '23505') return;
    if (
      error.message.includes('profile_blocks')
      && (error.message.includes('does not exist') || error.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/profile_blocks.sql in Supabase ausführen.',
      );
    }
    throw new Error(error.message || 'Blockieren fehlgeschlagen.');
  }

  // Follow-Beziehungen in beide Richtungen entfernen (best effort).
  try {
    await unfollowProfile(blockerId, blockedId);
  } catch {
    // ignore
  }
  try {
    await unfollowProfile(blockedId, blockerId);
  } catch {
    // ignore — RLS may prevent removing the other user's follow
  }
}

export async function unblockProfile(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from('profile_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) {
    if (
      error.message.includes('profile_blocks')
      && (error.message.includes('does not exist') || error.code === '42P01')
    ) {
      throw new Error(
        'Die Datenbank-Tabelle fehlt noch. Bitte sql/profile_blocks.sql in Supabase ausführen.',
      );
    }
    throw new Error(error.message || 'Entblocken fehlgeschlagen.');
  }
}
