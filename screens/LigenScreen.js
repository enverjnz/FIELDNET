import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Calendar, ListOrdered, MapPin } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { fetchLeagueTeamIds } from '../lib/leagueTeams';
import { useFilter } from '../context/FilterContext';
import { FilterEmptyPrompt } from '../components/MasterFilterBar';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

function teamStatsRow(team) {
  const stats = Array.isArray(team.team_stats) ? team.team_stats[0] : team.team_stats;
  return stats ?? null;
}

function sortTableTeams(teams) {
  return [...teams].sort((a, b) => {
    const sa = teamStatsRow(a);
    const sb = teamStatsRow(b);
    const winsA = sa?.wins ?? 0;
    const winsB = sb?.wins ?? 0;
    if (winsB !== winsA) return winsB - winsA;
    const diffA = (sa?.points_for ?? 0) - (sa?.points_against ?? 0);
    const diffB = (sb?.points_for ?? 0) - (sb?.points_against ?? 0);
    return diffB - diffA;
  });
}

function formatGameDate(isoDate) {
  if (!isoDate) return '–';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
}

export default function LigenScreen() {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const {
    selectedLeagueId,
    selectedSeasonId,
    isFilterReady,
    catalogLoading,
    refreshCatalog,
  } = useFilter();

  const [tableTeams, setTableTeams] = useState([]);
  const [scheduleGames, setScheduleGames] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeagueContent = useCallback(async (silent = false) => {
    if (!selectedLeagueId || !selectedSeasonId) {
      setTableTeams([]);
      setScheduleGames([]);
      return;
    }

    if (!silent) setContentLoading(true);
    setContentError(null);

    try {
      const teamIds = await fetchLeagueTeamIds(selectedLeagueId, selectedSeasonId);

      if (teamIds.length === 0) {
        setTableTeams([]);
        setScheduleGames([]);
        return;
      }

      const { data: teams, error: teamsErr } = await supabase
        .from('teams')
        .select(`
          id, name, short_name, town, avatar_teamlogo,
          team_stats(wins, losses, ties, points_for, points_against, games_played)
        `)
        .in('id', teamIds)
        .order('name', { ascending: true });

      if (teamsErr) throw teamsErr;

      const teamList = teams ?? [];
      setTableTeams(sortTableTeams(teamList));

      const { data: games, error: gamesErr } = await supabase
        .from('games')
        .select(`
          id, game_date, game_time, location, is_home_game,
          away_team_name, home_score, away_score, status,
          teams:home_team_id(name, short_name, avatar_teamlogo)
        `)
        .in('home_team_id', teamIds)
        .order('game_date', { ascending: true });

      if (gamesErr) throw gamesErr;
      setScheduleGames(games ?? []);
    } catch (e) {
      setContentError(e?.message ?? 'Daten konnten nicht geladen werden.');
      setTableTeams([]);
      setScheduleGames([]);
    } finally {
      if (!silent) setContentLoading(false);
    }
  }, [selectedLeagueId, selectedSeasonId]);

  useEffect(() => { loadLeagueContent(); }, [loadLeagueContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCatalog();
    await loadLeagueContent(true);
    setRefreshing(false);
  };

  if (!isFilterReady && !catalogLoading) {
    return (
      <View style={styles.container}>
        <FilterEmptyPrompt style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabelle / Spielplan */}
      <View style={styles.subTabContainer}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 0 && styles.activeSubTab]}
          onPress={() => setActiveSubTab(0)}
        >
          <ListOrdered size={16} color={activeSubTab === 0 ? R : MUTED} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 0 && styles.activeSubTabText]}>TABELLE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 1 && styles.activeSubTab]}
          onPress={() => setActiveSubTab(1)}
        >
          <Calendar size={16} color={activeSubTab === 1 ? R : MUTED} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 1 && styles.activeSubTabText]}>SPIELPLAN</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B} colors={[B]} />}
      >
        {!selectedLeagueId || !selectedSeasonId ? (
          catalogLoading ? (
            <ActivityIndicator color={B} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <MapPin size={28} color={MUTED} />
              <Text style={styles.emptyTitle}>Liga wählen</Text>
              <Text style={styles.emptySub}>Bitte wähle eine Liga aus, um zu starten.</Text>
            </View>
          )
        ) : contentLoading ? (
          <ActivityIndicator color={B} style={{ marginTop: 40 }} />
        ) : contentError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Fehler</Text>
            <Text style={styles.emptySub}>{contentError}</Text>
          </View>
        ) : activeSubTab === 0 ? (
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, { width: 30 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'left' }]}>TEAM</Text>
              <Text style={[styles.headerCell, { width: 30 }]}>W</Text>
              <Text style={[styles.headerCell, { width: 30 }]}>L</Text>
              <Text style={[styles.headerCell, { width: 55, textAlign: 'right' }]}>PF:PA</Text>
            </View>

            {tableTeams.length === 0 ? (
              <Text style={styles.noDataText}>Keine Teams in dieser Liga.</Text>
            ) : (
              tableTeams.map((team, index) => {
                const stats = teamStatsRow(team);
                const wins = stats?.wins ?? 0;
                const losses = stats?.losses ?? 0;
                const pf = stats?.points_for ?? 0;
                const pa = stats?.points_against ?? 0;
                const logoUrl = team.avatar_teamlogo || null;
                const rank = index + 1;

                return (
                  <View key={team.id} style={styles.tableRow}>
                    <Text style={[styles.rankText, rank <= 2 && styles.topRankText]}>{rank}</Text>
                    <View style={styles.teamInfoCell}>
                      {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.teamLogo} resizeMode="contain" />
                      ) : (
                        <View style={styles.logoPlaceholder}>
                          <Text style={styles.logoLetter}>
                            {(team.short_name || team.name || '?').slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamNameText} numberOfLines={1}>{team.name}</Text>
                        {team.town ? (
                          <Text style={styles.teamTownText} numberOfLines={1}>{team.town}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.statCell}>{wins}</Text>
                    <Text style={styles.statCell}>{losses}</Text>
                    <Text style={styles.ptsCell}>{pf}:{pa}</Text>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View>
            {scheduleGames.length === 0 ? (
              <Text style={styles.noDataText}>Keine Spiele im Spielplan.</Text>
            ) : (
              scheduleGames.map((game) => {
                const homeName = game.teams?.short_name || game.teams?.name || 'Heim';
                const awayName = game.away_team_name || 'Gast';
                const hasScore = game.status === 'live' || game.status === 'finished'
                  || game.status === 'LIVE' || game.status === 'FINISHED';

                return (
                  <View key={game.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleHeader}>
                      <Text style={styles.scheduleDate}>{formatGameDate(game.game_date)}</Text>
                      <Text style={styles.scheduleTime}>
                        {game.game_time ? `${game.game_time} UHR` : '–'}
                      </Text>
                    </View>
                    <View style={styles.scheduleMatchup}>
                      <Text style={styles.scheduleTeam}>{homeName}</Text>
                      {hasScore ? (
                        <Text style={styles.scheduleScore}>
                          {game.home_score ?? 0} : {game.away_score ?? 0}
                        </Text>
                      ) : (
                        <Text style={styles.scheduleVs}>vs</Text>
                      )}
                      <Text style={styles.scheduleTeam}>{awayName}</Text>
                    </View>
                    {game.location ? (
                      <Text style={styles.scheduleField}>📍 {game.location}</Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 150 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  subTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSubTab: { borderBottomWidth: 2, borderBottomColor: R },
  subTabText: { color: MUTED, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  activeSubTabText: { color: B },

  contentScroll: { flex: 1, paddingHorizontal: 16 },

  emptyBox: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: B, fontSize: 16, fontWeight: '800' },
  emptySub: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  noDataText: { color: MUTED, fontSize: 13, textAlign: 'center', marginTop: 24 },

  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: 'center',
  },
  headerCell: { color: MUTED, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  rankText: { color: MUTED, fontSize: 13, fontWeight: '700', width: 30, textAlign: 'center' },
  topRankText: { color: R },
  teamInfoCell: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 4, gap: 10 },
  teamLogo: { width: 28, height: 28, borderRadius: 8 },
  logoPlaceholder: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#E8EDF8', justifyContent: 'center', alignItems: 'center',
  },
  logoLetter: { color: B, fontSize: 11, fontWeight: '800' },
  teamNameText: { color: B, fontSize: 13, fontWeight: '700' },
  teamTownText: { color: MUTED, fontSize: 10, fontWeight: '600', marginTop: 1 },
  statCell: { color: MUTED, fontSize: 13, fontWeight: '600', width: 30, textAlign: 'center' },
  ptsCell: { color: B, fontSize: 12, fontWeight: '800', width: 55, textAlign: 'right' },

  scheduleCard: {
    backgroundColor: BG,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    marginBottom: 8,
  },
  scheduleDate: { color: MUTED, fontSize: 10, fontWeight: '800' },
  scheduleTime: { color: R, fontSize: 10, fontWeight: '800' },
  scheduleMatchup: { flexDirection: 'column', marginVertical: 4 },
  scheduleTeam: { color: B, fontSize: 14, fontWeight: '700' },
  scheduleVs: { color: MUTED, fontSize: 11, fontWeight: '600', fontStyle: 'italic', marginVertical: 2 },
  scheduleScore: { color: R, fontSize: 16, fontWeight: '900', marginVertical: 4 },
  scheduleField: { color: MUTED, fontSize: 11, fontWeight: '500', marginTop: 6 },
});
