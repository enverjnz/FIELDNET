import { fetchLeagueTeamIds } from './leagueTeams';
import { supabase } from './supabase';
import type { TeamPostWithTeam } from './teamPosts';

export type LeagueGameResult = {
  id: number;
  game_date: string | null;
  game_time: string | null;
  location: string | null;
  away_team_name: string | null;
  away_team_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
  teams: {
    name: string;
    short_name: string | null;
    avatar_teamlogo: string | null;
  } | null;
};

function buildTeamLogoLookup(
  teams: { name: string; short_name: string | null; avatar_teamlogo: string | null }[],
): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const team of teams) {
    const logo = team.avatar_teamlogo ?? null;
    const nameKey = team.name?.trim().toLowerCase();
    const shortKey = team.short_name?.trim().toLowerCase();
    if (nameKey) map.set(nameKey, logo);
    if (shortKey) map.set(shortKey, logo);
  }
  return map;
}

function resolveTeamLogo(
  teamName: string | null | undefined,
  lookup: Map<string, string | null>,
): string | null {
  const key = teamName?.trim().toLowerCase();
  if (!key) return null;
  return lookup.get(key) ?? null;
}

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

export async function fetchLatestPostsForLeague(
  leagueId: string,
  seasonId: number,
  limit = 15,
): Promise<TeamPostWithTeam[]> {
  const teamIds = await fetchLeagueTeamIds(leagueId, seasonId);
  if (teamIds.length === 0) return [];

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
    .in('team_id', teamIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const teams = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    return { ...row, teams: teams ?? null } as TeamPostWithTeam;
  });
}

export async function fetchLatestLeagueGames(
  leagueId: string,
  seasonId: number,
  limit = 5,
): Promise<LeagueGameResult[]> {
  const teamIds = await fetchLeagueTeamIds(leagueId, seasonId);
  if (teamIds.length === 0) return [];

  const [{ data, error }, { data: leagueTeams, error: teamsError }] = await Promise.all([
    supabase
      .from('games')
      .select(`
        id, game_date, game_time, location,
        away_team_name, home_score, away_score, status,
        teams:home_team_id(name, short_name, avatar_teamlogo)
      `)
      .in('home_team_id', teamIds)
      .or('status.eq.finished,status.eq.FINISHED,status.eq.live,status.eq.LIVE')
      .order('game_date', { ascending: false })
      .limit(limit),
    supabase
      .from('teams')
      .select('name, short_name, avatar_teamlogo')
      .in('id', teamIds),
  ]);

  if (error) throw error;
  if (teamsError) throw teamsError;

  const logoLookup = buildTeamLogoLookup(leagueTeams ?? []);

  return (data ?? []).map((row) => {
    const teams = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    return {
      ...row,
      teams: teams ?? null,
      away_team_logo: resolveTeamLogo(row.away_team_name, logoLookup),
    } as LeagueGameResult;
  });
}

export function formatGameResultDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '–';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }).toUpperCase();
}
