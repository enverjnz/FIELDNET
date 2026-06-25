import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
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

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

export default function TimelineScreen({ gameId, onBack }) {
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
          <ChevronLeft size={24} color={R} />
          <Text style={styles.backText}>Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spielverlauf</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.matchBar}>
        <Text style={styles.teamsText}>
          {homeName.toUpperCase()}{' '}
          <Text style={{ color: R }}>{homeScore} : {awayScore}</Text>{' '}
          {awayName.toUpperCase()}
        </Text>
        <Text style={styles.dateText}>
          {[dateStr, game?.game_time, game?.location].filter(Boolean).join(' · ') || 'Spieldetails'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={B} style={{ marginTop: 40 }} />
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
                    <Clock size={10} color={MUTED} style={{ marginRight: 2 }} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#FFFFFF',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backText: { color: R, fontSize: 14, fontWeight: '600', marginLeft: 2 },
  headerTitle: { color: B, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  matchBar: {
    backgroundColor: BG, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  teamsText: { color: B, fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  dateText: { color: MUTED, fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center', paddingHorizontal: 16 },
  scrollContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  timelineWrapper: { position: 'relative', width: '100%' },
  verticalLine: {
    position: 'absolute', left: 60, top: 10, bottom: 10,
    width: 2, backgroundColor: BORDER,
  },
  quarterRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  quarterBadge: {
    backgroundColor: B, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, minWidth: 85, alignItems: 'center', zIndex: 2,
  },
  quarterBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  quarterInfo: { marginLeft: 16 },
  quarterScore: { color: B, fontSize: 13, fontWeight: '800' },
  eventRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, paddingLeft: 4 },
  timeWrapper: { width: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 11 },
  timeText: { color: MUTED, fontSize: 11, fontWeight: '700' },
  dot: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  dotHome: { backgroundColor: R },
  dotAway: { backgroundColor: B },
  innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  eventCard: {
    flex: 1, backgroundColor: BG, borderColor: BORDER,
    borderWidth: 1, borderRadius: 12, padding: 12, marginLeft: 16,
  },
  eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eventName: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
  textHome: { color: R },
  textAway: { color: B },
  pointsText: {
    color: '#FFFFFF', fontSize: 12, fontWeight: '800',
    backgroundColor: B, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  playerText: { color: B, fontSize: 13, fontWeight: '600', marginTop: 4 },
  currentScoreText: { color: MUTED, fontSize: 11, fontWeight: '500', marginTop: 6 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center' },
  errorText: { color: R, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
});
