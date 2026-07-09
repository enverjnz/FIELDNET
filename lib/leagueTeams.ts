import { supabase } from './supabase';

export type Season = {
  id: number;
  year_label: string;
  is_current: boolean;
};

export type TeamLeagueAssignment = {
  leagueId: string;
  seasonId: number;
  leagueName: string;
  division: string;
  regionId: number;
  regionName: string;
  regionLabel: string;
  seasonLabel: string;
};

export type LeagueEnrollmentMode = 'current' | 'next';

export async function fetchSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('id, year_label, is_current')
    .order('year_label', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCurrentSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('id, year_label, is_current')
    .eq('is_current', true)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getNextSeason(): Promise<Season | null> {
  const seasons = await fetchSeasons();
  const chronological = [...seasons].sort((a, b) => a.year_label.localeCompare(b.year_label));
  const current = chronological.find((s) => s.is_current) ?? chronological[chronological.length - 1];
  if (!current) return null;
  const idx = chronological.findIndex((s) => s.id === current.id);
  return chronological[idx + 1] ?? null;
}

export async function fetchRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, country_unit, region_logo_url')
    .order('country_unit', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const ALLOWED_DIVISIONS = ['Herren', 'Damen', 'Flag'] as const;

export async function fetchLeaguesForRegionAllowed(regionId: number) {
  const { data, error } = await supabase
    .from('leagues')
    .select('id, name, division, region_id')
    .eq('region_id', regionId)
    .in('division', [...ALLOWED_DIVISIONS])
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeaguesForRegion(regionId: number, division: string) {
  const { data, error } = await supabase
    .from('leagues')
    .select('id, name, division, region_id')
    .eq('region_id', regionId)
    .eq('division', division)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTeamLeagueAssignment(
  teamId: string,
  seasonId?: number | null,
): Promise<TeamLeagueAssignment | null> {
  let targetSeasonId = seasonId;
  if (targetSeasonId == null) {
    const current = await getCurrentSeason();
    if (!current) return null;
    targetSeasonId = current.id;
  }

  const { data, error } = await supabase
    .from('league_teams')
    .select(`
      league_id,
      season_id,
      seasons:season_id(year_label),
      leagues:league_id(
        id, name, division, region_id,
        regions:region_id(id, name, country_unit)
      )
    `)
    .eq('team_id', teamId)
    .eq('season_id', targetSeasonId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.league_id) return null;

  const league = Array.isArray(data.leagues) ? data.leagues[0] : data.leagues;
  const region = league?.regions
    ? (Array.isArray(league.regions) ? league.regions[0] : league.regions)
    : null;
  const season = Array.isArray(data.seasons) ? data.seasons[0] : data.seasons;

  return {
    leagueId: data.league_id,
    seasonId: data.season_id,
    leagueName: league?.name ?? '',
    division: league?.division ?? 'Herren',
    regionId: league?.region_id ?? region?.id,
    regionName: region?.name ?? '',
    regionLabel: region?.country_unit || region?.name || '',
    seasonLabel: season?.year_label ?? '',
  };
}

export async function countTeamOpenGames(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('home_team_id', teamId)
    .or('status.eq.SCHEDULED,status.eq.scheduled,status.eq.LIVE,status.eq.live');
  if (error) throw error;
  return count ?? 0;
}

async function upsertLeagueTeamRow(teamId: string, leagueId: string, seasonId: number) {
  const { data: existing, error: readErr } = await supabase
    .from('league_teams')
    .select('team_id')
    .eq('team_id', teamId)
    .eq('season_id', seasonId)
    .maybeSingle();

  if (readErr) throw readErr;

  if (existing) {
    const { error } = await supabase
      .from('league_teams')
      .update({ league_id: leagueId })
      .eq('team_id', teamId)
      .eq('season_id', seasonId);
    if (error) throw error;
    return 'updated' as const;
  }

  const { error } = await supabase
    .from('league_teams')
    .insert({ team_id: teamId, league_id: leagueId, season_id: seasonId });
  if (error) throw error;
  return 'inserted' as const;
}

export async function saveTeamLeagueEnrollment(
  teamId: string,
  leagueId: string,
  mode: LeagueEnrollmentMode,
): Promise<{ seasonLabel: string; action: 'updated' | 'inserted' }> {
  if (mode === 'current') {
    const current = await getCurrentSeason();
    if (!current) throw new Error('Keine aktuelle Saison gefunden.');
    const action = await upsertLeagueTeamRow(teamId, leagueId, current.id);
    return { seasonLabel: current.year_label, action };
  }

  const next = await getNextSeason();
  if (!next) throw new Error('Keine kommende Saison gefunden. Bitte zuerst in Supabase anlegen.');
  const action = await upsertLeagueTeamRow(teamId, leagueId, next.id);
  return { seasonLabel: next.year_label, action };
}

export async function fetchLeagueTeamIds(leagueId: string, seasonId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('league_teams')
    .select('team_id')
    .eq('league_id', leagueId)
    .eq('season_id', seasonId);
  if (error) throw error;
  return (data ?? []).map((row) => row.team_id);
}
