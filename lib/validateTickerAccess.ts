import { supabase } from './supabase';

type HomeTeam = {
  id: string;
  name: string;
  short_name: string | null;
  avatar_teamlogo: string | null;
};

type GameRow = {
  id: number;
  home_team_id: string | null;
  away_team_name: string | null;
  home_score: number;
  away_score: number;
  status: string | null;
  game_code: string | null;
  game_date: string | null;
  game_time: string | null;
  location: string | null;
  created_by: string | null;
  home_team: HomeTeam | HomeTeam[] | null;
};

export type TickerGame = {
  id: number;
  home_team_id: string;
  away_team_name: string | null;
  home_score: number;
  away_score: number;
  status: string | null;
  game_code: string | null;
  game_date: string | null;
  game_time: string | null;
  location: string | null;
  home_team?: HomeTeam | null;
};

const GAME_SELECT =
  'id, home_team_id, away_team_name, home_score, away_score, status, game_code, game_date, game_time, location, created_by, home_team:home_team_id(id, name, short_name, avatar_teamlogo)';

function toTickerGame(row: GameRow): TickerGame {
  const homeTeam = Array.isArray(row.home_team) ? row.home_team[0] ?? null : row.home_team;

  return {
    id: row.id,
    home_team_id: row.home_team_id ?? '',
    away_team_name: row.away_team_name,
    home_score: row.home_score,
    away_score: row.away_score,
    status: row.status,
    game_code: row.game_code,
    game_date: row.game_date,
    game_time: row.game_time,
    location: row.location,
    home_team: homeTeam,
  };
}

export async function validateTickerAccess(
  code: string,
): Promise<{ game?: TickerGame; error?: string }> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { error: 'Bitte gib einen Gameday-Code ein.' };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Nicht eingeloggt.' };
  }

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .ilike('game_code', trimmed)
    .maybeSingle();

  if (gameError) {
    return { error: gameError.message };
  }

  if (!game) {
    return { error: 'Ungültiger Gameday-Code. Bitte prüfe deine Eingabe.' };
  }

  if (game.created_by === user.id) {
    return { game: toTickerGame(game as GameRow) };
  }

  if (game.home_team_id) {
    const { data: manager } = await supabase
      .from('team_managers')
      .select('id')
      .eq('profile_id', user.id)
      .eq('team_id', game.home_team_id)
      .maybeSingle();

    if (manager) {
      return { game: toTickerGame(game as GameRow) };
    }

    const { data: membership } = await supabase
      .from('team_memberships')
      .select('id')
      .eq('player_id', user.id)
      .eq('team_id', game.home_team_id)
      .eq('status', 'approved')
      .maybeSingle();

    if (membership) {
      return { game: toTickerGame(game as GameRow) };
    }
  }

  return {
    error: 'Du bist kein berechtigtes Teammitglied für dieses Spiel.',
  };
}

export async function fetchTickerGameById(gameId: number): Promise<TickerGame | null> {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .eq('id', gameId)
    .maybeSingle();

  if (error || !data) return null;
  return toTickerGame(data as GameRow);
}
