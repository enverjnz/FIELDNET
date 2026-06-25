import { supabase } from './supabase';
import type { TickerEventType } from './tickerEvents';
import { insertTickerEvents } from './tickerEvents';

type GameRow = {
  id: number;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team_id: string | null;
};

type TickerEventAgg = {
  event_type: string;
  profile_id: string | null;
};

const PROFILE_STAT_FIELD: Partial<Record<TickerEventType, string>> = {
  touchdown: 'touchdowns',
  field_goal: 'field_goals',
  extra_point: 'extra_points',
  two_point_conversion: 'two_point_conversions',
  interception: 'interceptions',
  sack: 'sacks',
};

async function ensureTeamStats(teamId: string) {
  const { data: existing } = await supabase
    .from('team_stats')
    .select('id')
    .eq('team_id', teamId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from('team_stats').insert({ team_id: teamId });
}

async function ensureProfileStats(profileId: string) {
  const { data: existing } = await supabase
    .from('profile_stats')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from('profile_stats').insert({ profile_id: profileId });
}

export async function ensureTeamStatsForTeam(teamId: string): Promise<void> {
  await ensureTeamStats(teamId);
}

export async function finishGame(
  gameId: number,
  homeScore: number,
  awayScore: number,
  pendingEvents: Parameters<typeof insertTickerEvents>[1] = [],
  quarter?: string | null,
): Promise<void> {
  const { data: game, error: gameErr } = await supabase
    .from('games')
    .select('id, status, home_score, away_score, home_team_id')
    .eq('id', gameId)
    .maybeSingle();

  if (gameErr || !game) throw gameErr ?? new Error('Spiel nicht gefunden.');

  const g = game as GameRow;
  const normalized = (g.status ?? '').toLowerCase();
  if (normalized === 'finished') {
    throw new Error('Dieses Spiel ist bereits beendet.');
  }

  if (pendingEvents.length > 0) {
    await insertTickerEvents(gameId, pendingEvents);
  }

  const { error: gameUpdateErr } = await supabase
    .from('games')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'finished',
    })
    .eq('id', gameId);

  if (gameUpdateErr) throw gameUpdateErr;

  await insertTickerEvents(gameId, [{
    eventType: 'game_finished',
    points: 0,
    teamSide: 'home',
    homeScore,
    awayScore,
    quarter: quarter ?? null,
  }]);

  if (!g.home_team_id) return;

  await ensureTeamStats(g.home_team_id);

  const { data: teamStatsRow } = await supabase
    .from('team_stats')
    .select('*')
    .eq('team_id', g.home_team_id)
    .maybeSingle();

  const home = homeScore;
  const away = awayScore;
  const isWin = home > away;
  const isLoss = home < away;
  const isTie = home === away;

  const teamUpdate = {
    games_played: (teamStatsRow?.games_played ?? 0) + 1,
    wins: (teamStatsRow?.wins ?? 0) + (isWin ? 1 : 0),
    losses: (teamStatsRow?.losses ?? 0) + (isLoss ? 1 : 0),
    ties: (teamStatsRow?.ties ?? 0) + (isTie ? 1 : 0),
    points_for: (teamStatsRow?.points_for ?? 0) + home,
    points_against: (teamStatsRow?.points_against ?? 0) + away,
  };

  if (teamStatsRow?.id) {
    await supabase.from('team_stats').update(teamUpdate).eq('id', teamStatsRow.id);
  } else {
    await supabase.from('team_stats').insert({ team_id: g.home_team_id, ...teamUpdate });
  }

  const { data: events } = await supabase
    .from('ticker_events')
    .select('event_type, profile_id')
    .eq('games_idgame', gameId);

  const skipTypes = new Set(['game_finished', 'game_started', 'quarter_marker', 'halftime']);
  const agg = ((events ?? []) as TickerEventAgg[]).filter((e) => !skipTypes.has(e.event_type));
  const profileIds = new Set(
    agg.map((e) => e.profile_id).filter(Boolean) as string[],
  );

  for (const profileId of profileIds) {
    await ensureProfileStats(profileId);

    const { data: psRow } = await supabase
      .from('profile_stats')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    const deltas: Record<string, number> = {
      games_played: 1,
    };

    for (const ev of agg.filter((e) => e.profile_id === profileId)) {
      const field = PROFILE_STAT_FIELD[ev.event_type as TickerEventType];
      if (field) {
        deltas[field] = (deltas[field] ?? 0) + 1;
      }
    }

    const updatePayload: Record<string, number> = {};
    for (const [key, delta] of Object.entries(deltas)) {
      updatePayload[key] = (psRow?.[key as keyof typeof psRow] as number ?? 0) + delta;
    }

    if (psRow?.id) {
      await supabase.from('profile_stats').update(updatePayload).eq('id', psRow.id);
    } else {
      await supabase.from('profile_stats').insert({ profile_id: profileId, ...updatePayload });
    }
  }
}
