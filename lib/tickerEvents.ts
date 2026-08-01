import { supabase } from './supabase';

export type TickerEventType =
  | 'touchdown'
  | 'field_goal'
  | 'safety'
  | 'two_point_conversion'
  | 'extra_point'
  | 'interception'
  | 'sack'
  | 'fumble'
  | 'fumble_recovery'
  | 'timeout'
  | 'pick_six'
  | 'quarter_marker'
  | 'halftime'
  | 'game_started'
  | 'game_finished'
  | 'score_update';

export type QueuedTickerEvent = {
  eventType: TickerEventType;
  points: number;
  teamSide: 'home' | 'away';
  homeScore: number;
  awayScore: number;
  profileId?: string | null;
  quarter?: string | null;
};

export const EVENT_LABELS: Record<string, string> = {
  touchdown: 'TOUCHDOWN',
  field_goal: 'FIELD GOAL',
  safety: 'SAFETY',
  two_point_conversion: '2-PT CONVERSION',
  extra_point: 'PAT GOOD',
  interception: 'INTERCEPTION',
  sack: 'SACK',
  fumble: 'FUMBLE',
  fumble_recovery: 'FUMBLE-RECOVERY',
  timeout: 'TIMEOUT',
  pick_six: 'PICK-6',
  quarter_marker: 'QUARTER',
  halftime: 'HALBZEIT',
  game_started: 'SPIELSTART',
  game_finished: 'SPIELENDE (FT)',
  score_update: 'UPDATE',
};

export const QUARTER_EVENT_TYPES = new Set([
  'quarter_marker',
  'halftime',
  'game_started',
  'game_finished',
]);

/** Felder in profile_stats, die pro Ticker-Event um 1 erhöht werden. */
export const PROFILE_STAT_FIELDS: Partial<Record<TickerEventType, string[]>> = {
  touchdown: ['touchdowns'],
  field_goal: ['field_goals'],
  extra_point: ['extra_points'],
  two_point_conversion: ['two_point_conversions'],
  interception: ['interceptions'],
  sack: ['sacks'],
  fumble_recovery: ['fumble_recoveries'],
  pick_six: ['touchdowns', 'interceptions'],
};

export function applyProfileStatDeltas(
  deltas: Record<string, number>,
  eventType: string,
): void {
  const fields = PROFILE_STAT_FIELDS[eventType as TickerEventType];
  if (!fields) return;

  for (const field of fields) {
    deltas[field] = (deltas[field] ?? 0) + 1;
  }
}

export async function insertTickerEvents(
  gameId: number,
  events: QueuedTickerEvent[],
): Promise<void> {
  if (events.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt.');

  const rows = events.map((ev) => ({
    games_idgame: gameId,
    event_type: ev.eventType,
    points: ev.points,
    team_side: ev.teamSide,
    profile_id: ev.profileId ?? null,
    home_score: ev.homeScore,
    away_score: ev.awayScore,
    quarter: ev.quarter ?? null,
    created_by: user.id,
  }));

  const { error } = await supabase.from('ticker_events').insert(rows);
  if (error) throw error;
}

export type TickerEventRow = {
  id: number;
  games_idgame: number;
  event_type: string;
  points: number;
  team_side: string | null;
  profile_id: string | null;
  home_score: number;
  away_score: number;
  quarter: string | null;
  clock_time: string | null;
  description: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    jersey_number: string | null;
  } | null;
};

export async function loadGameTimeline(gameId: number): Promise<TickerEventRow[]> {
  const { data, error } = await supabase
    .from('ticker_events')
    .select(`
      id, games_idgame, event_type, points, team_side, profile_id,
      home_score, away_score, quarter, clock_time, description, created_at,
      profiles:profile_id(first_name, last_name, jersey_number)
    `)
    .eq('games_idgame', gameId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TickerEventRow[];
}

export function formatScore(home: number, away: number): string {
  return `${String(home).padStart(2, '0')} : ${String(away).padStart(2, '0')}`;
}

export function playerEventLabel(row: TickerEventRow): string | null {
  const p = row.profiles;
  if (!p) return null;
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
  const num = p.jersey_number ? `#${p.jersey_number} ` : '';
  return name ? `${num}${name}`.trim() : null;
}
