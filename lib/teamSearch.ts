import { supabase } from './supabase';

export type TeamSearchResult = {
  id: string;
  name: string;
  short_name: string | null;
  town: string | null;
  avatar_teamlogo: string | null;
  leagues: {
    name: string | null;
    league_logo_url: string | null;
  } | null;
};

export async function searchTeams(query: string, limit = 10): Promise<{
  teams: TeamSearchResult[];
  error: string | null;
}> {
  const q = query.trim();
  if (q.length < 2) {
    return { teams: [], error: null };
  }

  const { data, error } = await supabase
    .from('teams')
    .select('id, name, short_name, town, avatar_teamlogo, leagues:leagues_idleague(name, league_logo_url)')
    .or(`name.ilike.%${q}%,short_name.ilike.%${q}%,town.ilike.%${q}%`)
    .limit(limit);

  if (error) {
    return { teams: [], error: error.message };
  }

  const teams = (data ?? []).map((row) => {
    const league = Array.isArray(row.leagues) ? row.leagues[0] : row.leagues;
    return {
      ...row,
      leagues: league ?? null,
    };
  }) as TeamSearchResult[];

  return { teams, error: null };
}

export function teamSearchMeta(team: TeamSearchResult): string {
  return [team.town, team.leagues?.name, team.short_name].filter(Boolean).join(' · ');
}

export function teamSearchLogoUrl(team: TeamSearchResult): string | null {
  return team.avatar_teamlogo || team.leagues?.league_logo_url || null;
}
