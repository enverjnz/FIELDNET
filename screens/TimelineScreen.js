import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import {
  loadGameTimeline,
  EVENT_LABELS,
  QUARTER_EVENT_TYPES,
  formatScore,
  playerEventLabel,
} from '../lib/tickerEvents';
import { useTheme } from '../context/ThemeContext';
import { createTimelineStyles } from '../theme/tickerCodeStyles';

export default function TimelineScreen({ gameId, onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createTimelineStyles(colors), [colors]);

  const [game, setGame] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: gameData, error: gameErr }, timeline] = await Promise.all([
          supabase
            .from('games')
            .select(`
              id, home_score, away_score, away_team_name, game_date, game_time, location, status,
              home_team:home_team_id(id, name, short_name)
            `)
            .eq('id', gameId)
            .maybeSingle(),
          loadGameTimeline(gameId),
        ]);

        if (gameErr) throw gameErr;
        if (!cancelled) {
          setGame(gameData ?? null);
          setEvents(timeline);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message ?? 'Spielverlauf konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [gameId]);

  const homeName = game?.home_team?.short_name ?? game?.home_team?.name ?? 'Heim';
  const awayName = game?.away_team_name ?? 'Gast';
  const homeScore = game?.home_score ?? 0;
  const awayScore = game?.away_score ?? 0;

  const dateStr = game?.game_date
    ? new Date(game.game_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={24} color={colors.accent} />
          <Text style={styles.backText}>Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spielverlauf</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.matchBar}>
        <Text style={styles.teamsText}>
          {homeName.toUpperCase()}{' '}
          <Text style={{ color: colors.accent }}>{homeScore} : {awayScore}</Text>{' '}
          {awayName.toUpperCase()}
        </Text>
        <Text style={styles.dateText}>
          {[dateStr, game?.game_time, game?.location].filter(Boolean).join(' · ') || 'Spieldetails'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.text} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : events.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Noch keine Ticker-Events für dieses Spiel.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.timelineWrapper}>
            <View style={styles.verticalLine} />

            {events.map((item) => {
              const isQuarter = QUARTER_EVENT_TYPES.has(item.event_type);
              const scoreStr = formatScore(item.home_score ?? 0, item.away_score ?? 0);
              const timeLabel = item.clock_time
                ?? new Date(item.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

              if (isQuarter) {
                const title = item.event_type === 'game_finished'
                  ? EVENT_LABELS.game_finished
                  : item.quarter
                    ? `${item.quarter}. QUARTER`
                    : EVENT_LABELS[item.event_type] ?? item.event_type.toUpperCase();

                return (
                  <View key={item.id} style={styles.quarterRow}>
                    <View style={styles.quarterBadge}>
                      <Text style={styles.quarterBadgeText}>{title}</Text>
                    </View>
                    <View style={styles.quarterInfo}>
                      <Text style={styles.quarterScore}>{scoreStr}</Text>
                    </View>
                  </View>
                );
              }

              const isHome = item.team_side === 'home';
              const teamLabel = isHome ? homeName : awayName;
              const eventName = EVENT_LABELS[item.event_type] ?? item.event_type.toUpperCase();
              const quarterPrefix = item.quarter ? `Q${item.quarter} · ` : '';
              const player = playerEventLabel(item);
              const pointsLabel = item.points > 0 ? `+${item.points}` : null;

              return (
                <View key={item.id} style={styles.eventRow}>
                  <View style={styles.timeWrapper}>
                    <Clock size={10} color={colors.textMuted} style={{ marginRight: 2 }} />
                    <Text style={styles.timeText}>{timeLabel}</Text>
                  </View>

                  <View style={[styles.dot, isHome ? styles.dotHome : styles.dotAway]}>
                    <View style={styles.innerDot} />
                  </View>

                  <View style={styles.eventCard}>
                    <View style={styles.eventCardHeader}>
                      <Text style={[styles.eventName, isHome ? styles.textHome : styles.textAway]}>
                        {quarterPrefix}{eventName} ({teamLabel})
                      </Text>
                      {pointsLabel ? <Text style={styles.pointsText}>{pointsLabel}</Text> : null}
                    </View>
                    {player ? <Text style={styles.playerText}>{player}</Text> : null}
                    <Text style={styles.currentScoreText}>Spielstand: {scoreStr}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
