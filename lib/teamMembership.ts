import { supabase } from './supabase';

export async function acceptMembershipRequest(
  membershipId: string,
  teamId: string,
  playerId: string,
  currentStatus: string,
): Promise<void> {
  if (currentStatus === 'coach_pending') {
    const { error: mgrErr } = await supabase.from('team_managers').insert({
      profile_id: playerId,
      team_id: teamId,
    });
    if (mgrErr && mgrErr.code !== '23505') throw mgrErr;

    await supabase.from('profiles').update({ role: 'coach' }).eq('id', playerId);
  }

  const { error } = await supabase
    .from('team_memberships')
    .update({ status: 'approved' })
    .eq('id', membershipId);

  if (error) throw error;
}

export async function rejectMembershipRequest(membershipId: string): Promise<void> {
  const { error } = await supabase
    .from('team_memberships')
    .update({ status: 'declined' })
    .eq('id', membershipId);

  if (error) throw error;
}
