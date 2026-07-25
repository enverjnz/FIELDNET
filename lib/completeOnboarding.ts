import { supabase } from './supabase';
import { isEmailConfirmed } from './authRedirect';
import { birthDateProfileFields } from './profileDates';
import { resolveProfileAvatarUrl } from './uploadImage';
import { followTeam } from './teamFollowers';
import {
  clearPendingOnboarding,
  loadPendingOnboarding,
  reviveOnboardingData,
} from './pendingOnboarding';
import type { OnboardingData } from '../screens/onboarding/PlayerOnboardingFlow';

export async function completeOnboardingForUser(
  userId: string,
  data: OnboardingData,
): Promise<void> {
  const avatarUrl = await resolveProfileAvatarUrl(userId, data.avatarUri);

  if (data.role === 'player') {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      role: 'player',
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      bio: data.bio.trim(),
      avatar: avatarUrl,
      ...birthDateProfileFields(data.birthDate),
      position: data.position.trim(),
      jersey_number: data.jerseyNumber.trim(),
      gender: data.gender.trim(),
      weight: data.weight ? parseFloat(data.weight) : null,
      height: data.height ? parseFloat(data.height) : null,
      nationality: data.nationality.trim(),
    });
    if (profileError) throw profileError;

    if (data.selectedTeamId) {
      const { error: membershipError } = await supabase.from('team_memberships').insert({
        player_id: userId,
        team_id: data.selectedTeamId,
        status: 'pending',
      });
      if (membershipError) throw membershipError;
    }
    return;
  }

  if (data.role === 'fan') {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      role: 'fan',
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      bio: data.bio.trim(),
      avatar: avatarUrl,
      ...birthDateProfileFields(data.birthDate),
      favourite_team_id: data.followedTeams[0]?.id ?? null,
    });
    if (profileError) throw profileError;

    for (const team of data.followedTeams) {
      await followTeam(userId, team.id);
    }
    return;
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'coach',
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    bio: data.bio.trim(),
    avatar: avatarUrl,
    ...birthDateProfileFields(data.birthDate),
    coaching_role: data.coachingRole.trim() || null,
    coaching_license: data.coachingLicense.trim() || null,
    coaching_experience: data.coachingExperience
      ? parseInt(data.coachingExperience, 10)
      : null,
    coaching_specialization: data.coachingSpecialization.trim() || null,
  });
  if (profileError) throw profileError;

  if (data.selectedTeamId) {
    const { error: membershipError } = await supabase.from('team_memberships').insert({
      player_id: userId,
      team_id: data.selectedTeamId,
      status: 'coach_pending',
    });
    if (membershipError) throw membershipError;
  }
}

export type FinishPendingResult = {
  completed: boolean;
  role?: OnboardingData['role'];
};

export async function finishPendingOnboardingIfNeeded(): Promise<FinishPendingResult> {
  const pending = await loadPendingOnboarding();
  if (!pending) return { completed: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isEmailConfirmed(user)) {
    return { completed: false };
  }

  const data = reviveOnboardingData(pending.data);
  await completeOnboardingForUser(user.id, data);
  await clearPendingOnboarding();

  return { completed: true, role: data.role };
}
