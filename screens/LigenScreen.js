import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { Calendar, ListOrdered, ChevronDown, X, Check, MapPin } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { fetchLeagueTeamIds } from '../lib/leagueTeams';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

function FilterDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  loading = false,
  disabled = false,
  emptyText = 'Keine Einträge verfügbar.',
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.dropdownWrap}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownTrigger, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && !loading && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={B} style={{ flex: 1 }} />
        ) : (
          <View style={styles.dropdownTriggerInner}>
            {selected?.imageUrl ? (
              <Image source={{ uri: selected.imageUrl }} style={styles.dropdownLogo} resizeMode="contain" />
            ) : null}
            <Text
              style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}
              numberOfLines={1}
            >
              {selected?.label ?? placeholder}
            </Text>
          </View>
        )}
        <ChevronDown size={18} color={disabled ? '#C4CAD4' : MUTED} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <X size={22} color={B} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.modalEmpty}>{emptyText}</Text>
              ) : (
                options.map((option) => {
                  const active = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => { onChange(option.value); setOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.modalItemLeft}>
                        {option.imageUrl ? (
                          <Image source={{ uri: option.imageUrl }} style={styles.modalItemLogo} resizeMode="contain" />
                        ) : (
                          <View style={styles.modalItemLogoFallback}>
                            <Text style={styles.modalItemLogoLetter}>{option.label.charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={[styles.modalItemText, active && styles.modalItemTextActive]} numberOfLines={2}>
                          {option.label}
                        </Text>
                      </View>
                      {active && <Check size={18} color={R} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

  const [seasons, setSeasons] = useState([]);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);

  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  const [tableTeams, setTableTeams] = useState([]);
  const [scheduleGames, setScheduleGames] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSeasons = useCallback(async () => {
    setSeasonsLoading(true);
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('id, year_label, is_current')
        .order('year_label', { ascending: false });
      if (error) throw error;
      const list = data ?? [];
      setSeasons(list);
      if (list.length > 0) {
        const defaultSeason = list.find((s) => s.is_current) ?? list[0];
        setSelectedSeasonId((prev) => prev ?? defaultSeason.id);
      }
    } catch (e) {
      console.warn('LigenScreen seasons:', e?.message);
    } finally {
      setSeasonsLoading(false);
    }
  }, []);

  const loadRegions = useCallback(async () => {
    setRegionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, country_unit, region_logo_url')
        .order('country_unit', { ascending: true });
      if (error) throw error;
      setRegions(data ?? []);
      if ((data ?? []).length > 0) {
        setSelectedRegionId((prev) => prev ?? data[0].id);
      }
    } catch (e) {
      console.warn('LigenScreen regions:', e?.message);
    } finally {
      setRegionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeasons();
    loadRegions();
  }, [loadSeasons, loadRegions]);

  useEffect(() => {
    if (!selectedRegionId) {
      setLeagues([]);
      setSelectedLeagueId(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLeaguesLoading(true);
      setSelectedLeagueId(null);
      try {
        const { data, error } = await supabase
          .from('leagues')
          .select('id, name, division')
          .eq('region_id', selectedRegionId)
          .order('name', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        setLeagues(data ?? []);
        if ((data ?? []).length > 0) {
          setSelectedLeagueId(data[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('LigenScreen leagues:', e?.message);
          setLeagues([]);
        }
      } finally {
        if (!cancelled) setLeaguesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRegionId]);

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
    await Promise.all([loadSeasons(), loadRegions()]);
    await loadLeagueContent(true);
    setRefreshing(false);
  };

  const seasonOptions = seasons.map((s) => ({
    value: s.id,
    label: s.is_current ? `${s.year_label} (aktuell)` : s.year_label,
  }));

  const regionOptions = regions.map((r) => ({
    value: r.id,
    label: r.country_unit || r.name,
    imageUrl: r.region_logo_url,
  }));

  const leagueOptions = leagues.map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);
  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  return (
    <View style={styles.container}>
      {/* Filter: Saison + Region + Liga */}
      <View style={styles.filterSection}>
        <FilterDropdown
          label="SAISON"
          placeholder="Saison wählen…"
          options={seasonOptions}
          value={selectedSeasonId}
          onChange={(v) => setSelectedSeasonId(v)}
          loading={seasonsLoading}
          emptyText="Keine Saisons gefunden."
        />
        <FilterDropdown
          label="LANDESVERBAND"
          placeholder="Region wählen…"
          options={regionOptions}
          value={selectedRegionId}
          onChange={(v) => setSelectedRegionId(Number(v))}
          loading={regionsLoading}
          emptyText="Keine Regionen gefunden."
        />
        <FilterDropdown
          label="LIGA"
          placeholder={!selectedRegionId ? 'Zuerst Region wählen' : 'Liga wählen…'}
          options={leagueOptions}
          value={selectedLeagueId}
          onChange={(v) => setSelectedLeagueId(v)}
          loading={leaguesLoading}
          disabled={!selectedRegionId}
          emptyText="Keine Ligen in dieser Region."
        />
      </View>

      {(selectedSeason || selectedRegion || selectedLeague) && (
        <Text style={styles.filterSummary} numberOfLines={1}>
          {[
            selectedSeason?.year_label,
            selectedRegion?.country_unit || selectedRegion?.name,
            selectedLeague?.name,
          ].filter(Boolean).join(' · ')}
        </Text>
      )}

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
          <View style={styles.emptyBox}>
            <MapPin size={28} color={MUTED} />
            <Text style={styles.emptyTitle}>Filter wählen</Text>
            <Text style={styles.emptySub}>Wähle Saison, Landesverband und Liga.</Text>
          </View>
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

  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  filterSummary: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
  },

  dropdownWrap: { marginBottom: 2 },
  dropdownLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownDisabled: { opacity: 0.55 },
  dropdownTriggerInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownLogo: { width: 24, height: 24, borderRadius: 6 },
  dropdownText: { flex: 1, color: B, fontSize: 14, fontWeight: '700' },
  dropdownPlaceholder: { color: '#9CA3AF', fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: { color: B, fontSize: 16, fontWeight: '800' },
  modalList: { paddingHorizontal: 12 },
  modalEmpty: { color: MUTED, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  modalItemActive: { backgroundColor: BG },
  modalItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalItemLogo: { width: 32, height: 32, borderRadius: 8 },
  modalItemLogoFallback: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  modalItemLogoLetter: { color: B, fontSize: 14, fontWeight: '800' },
  modalItemText: { flex: 1, color: B, fontSize: 15, fontWeight: '600' },
  modalItemTextActive: { color: R, fontWeight: '800' },

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
