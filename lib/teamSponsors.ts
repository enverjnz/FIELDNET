import { Linking, Alert } from 'react-native';
import { supabase } from './supabase';
import { isLocalImageUri, uploadSponsorLogo } from './uploadImage';

export type TeamSponsor = {
  id: string;
  team_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
};

export type TeamSponsorInput = {
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  sort_order?: number;
};

export async function fetchTeamSponsors(teamId: string): Promise<TeamSponsor[]> {
  const { data, error } = await supabase
    .from('team_sponsors')
    .select('id, team_id, name, logo_url, website_url, sort_order')
    .eq('team_id', teamId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TeamSponsor[];
}

export async function countTeamSponsors(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from('team_sponsors')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if (error) throw error;
  return count ?? 0;
}

async function resolveSponsorLogoUrl(
  teamId: string,
  sponsorId: string,
  uri: string | null | undefined,
): Promise<string | null> {
  if (!uri?.trim()) return null;
  if (isLocalImageUri(uri)) return uploadSponsorLogo(teamId, sponsorId, uri);
  return uri.trim();
}

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function openSponsorWebsite(url: string | null | undefined): Promise<void> {
  const normalized = normalizeWebsiteUrl(url ?? '');
  if (!normalized) {
    Alert.alert('Keine Webseite', 'Für diesen Sponsor ist keine URL hinterlegt.');
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(normalized);
    if (!canOpen) {
      Alert.alert('Fehler', 'Die Webseite konnte nicht geöffnet werden.');
      return;
    }
    await Linking.openURL(normalized);
  } catch {
    Alert.alert('Fehler', 'Die Webseite konnte nicht geöffnet werden.');
  }
}

export async function createTeamSponsor(
  teamId: string,
  input: TeamSponsorInput,
): Promise<TeamSponsor> {
  const name = input.name.trim();
  if (!name) throw new Error('Bitte einen Sponsorennamen eingeben.');

  const website = input.website_url?.trim()
    ? normalizeWebsiteUrl(input.website_url)
    : null;

  const { data, error } = await supabase
    .from('team_sponsors')
    .insert({
      team_id: teamId,
      name,
      logo_url: null,
      website_url: website,
      sort_order: input.sort_order ?? 0,
    })
    .select('id, team_id, name, logo_url, website_url, sort_order')
    .single();

  if (error || !data) throw error ?? new Error('Sponsor konnte nicht gespeichert werden.');

  const logoUrl = await resolveSponsorLogoUrl(teamId, data.id, input.logo_url);
  if (logoUrl !== data.logo_url) {
    const { data: updated, error: updateError } = await supabase
      .from('team_sponsors')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', data.id)
      .select('id, team_id, name, logo_url, website_url, sort_order')
      .single();

    if (updateError || !updated) throw updateError ?? new Error('Sponsor-Logo konnte nicht gespeichert werden.');
    return updated as TeamSponsor;
  }

  return data as TeamSponsor;
}

export async function updateTeamSponsor(
  teamId: string,
  sponsorId: string,
  input: TeamSponsorInput,
): Promise<TeamSponsor> {
  const name = input.name.trim();
  if (!name) throw new Error('Bitte einen Sponsorennamen eingeben.');

  const logoUrl = await resolveSponsorLogoUrl(teamId, sponsorId, input.logo_url);
  const website = input.website_url?.trim()
    ? normalizeWebsiteUrl(input.website_url)
    : null;

  const { data, error } = await supabase
    .from('team_sponsors')
    .update({
      name,
      logo_url: logoUrl,
      website_url: website,
      sort_order: input.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sponsorId)
    .eq('team_id', teamId)
    .select('id, team_id, name, logo_url, website_url, sort_order')
    .single();

  if (error || !data) throw error ?? new Error('Sponsor konnte nicht aktualisiert werden.');
  return data as TeamSponsor;
}

export async function deleteTeamSponsor(sponsorId: string): Promise<void> {
  const { error } = await supabase
    .from('team_sponsors')
    .delete()
    .eq('id', sponsorId);

  if (error) throw error;
}
