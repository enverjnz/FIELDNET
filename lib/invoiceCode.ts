import { supabase } from './supabase';

export type VerwaltungRoute = 'dashboard' | 'wizard' | 'code';

export type VerwaltungState =
  | { route: 'dashboard'; teamId: string }
  | { route: 'wizard'; inviteCodeId: string }
  | { route: 'code' };

type InviteCodeRow = {
  id: string;
  code: string;
  is_used: boolean | null;
  used_by_user_id: string | null;
  team_id: string | null;
};

/** Determines which Vereinsverwaltung screen a coach should see. */
export async function getCoachVerwaltungState(userId: string): Promise<VerwaltungState> {
  const { data: managerRow } = await supabase
    .from('team_managers')
    .select('team_id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (managerRow?.team_id) {
    return { route: 'dashboard', teamId: managerRow.team_id };
  }

  const { data: pendingCoach } = await supabase
    .from('team_memberships')
    .select('id')
    .eq('player_id', userId)
    .eq('status', 'coach_pending')
    .limit(1);

  if (pendingCoach?.length) {
    throw new CoachPendingError();
  }

  const { data: redeemedCode } = await supabase
    .from('team_invite_codes')
    .select('id')
    .eq('used_by_user_id', userId)
    .is('team_id', null)
    .maybeSingle();

  if (redeemedCode?.id) {
    return { route: 'wizard', inviteCodeId: redeemedCode.id };
  }

  return { route: 'code' };
}

export class CoachPendingError extends Error {
  constructor() {
    super('COACH_PENDING');
    this.name = 'CoachPendingError';
  }
}

export type RedeemResult =
  | { ok: true; inviteCodeId: string; alreadyRedeemed: boolean }
  | { ok: false; error: string };

/** Validates and redeems a per-Verein invoice code (1 code = 1 new team). */
export async function verifyAndRedeemInvoiceCode(rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: 'Bitte gib deinen Rechnungscode ein.' };
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, error: 'Nicht eingeloggt.' };
  }

  const { data: row, error: fetchErr } = await supabase
    .from('team_invite_codes')
    .select('id, is_used, used_by_user_id, team_id')
    .eq('code', code)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: fetchErr.message };
  }

  if (!row) {
    return { ok: false, error: 'Code ungültig. Prüfe die Schreibweise auf deiner Rechnung.' };
  }

  const invite = row as InviteCodeRow;

  if (invite.team_id) {
    return { ok: false, error: 'Dieser Code wurde bereits für ein Team verwendet.' };
  }

  if (invite.used_by_user_id && invite.used_by_user_id !== user.id) {
    return { ok: false, error: 'Dieser Code wurde bereits von einem anderen Account eingelöst.' };
  }

  if (invite.used_by_user_id === user.id) {
    return { ok: true, inviteCodeId: invite.id, alreadyRedeemed: true };
  }

  if (invite.is_used && !invite.team_id) {
    return { ok: false, error: 'Code ungültig oder bereits vergeben.' };
  }

  const { error: updateErr } = await supabase
    .from('team_invite_codes')
    .update({ used_by_user_id: user.id })
    .eq('id', invite.id)
    .is('used_by_user_id', null);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  return { ok: true, inviteCodeId: invite.id, alreadyRedeemed: false };
}

/** Links a redeemed invoice code to the newly created team (finalizes 1-code-per-Verein). */
export async function linkInvoiceCodeToTeam(inviteCodeId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('team_invite_codes')
    .update({ team_id: teamId, is_used: true })
    .eq('id', inviteCodeId);

  if (error) throw error;
}
