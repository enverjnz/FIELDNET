import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
  Image, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { ArrowLeft, Users, Calendar, Zap, ChevronRight, MapPin, Hash, Copy, Check, Trash2, UserMinus, X } from 'lucide-react-native';
import { Clipboard } from 'react-native';
import { supabase } from '../lib/supabase';
import { acceptMembershipRequest, rejectMembershipRequest } from '../lib/teamMembership';
import TeamProfileScreen from './TeamProfileScreen';
import GameCreateScreen from './GameCreateScreen';
import TimelineScreen from './TimelineScreen';

const B      = '#1A2F6E';
const R      = '#C01830';
const BG     = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED  = '#6B7280';

const STATUS_CONFIG = {
  scheduled: { label: 'Geplant',    color: '#F59E0B', bg: '#FFFBEB' },
  live:      { label: 'LIVE',       color: '#10B981', bg: '#ECFDF5' },
  finished:  { label: 'Beendet',    color: MUTED,     bg: BG        },
  cancelled: { label: 'Abgesagt',   color: R,         bg: '#FFF0F2' },
};

export default function TeamDashboardScreen({ teamId, onBack, onOpenTicker, onOpenLiveTicker, onTeamLeft }) {
  const [team, setTeam]             = useState(null);
  const [games, setGames]           = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [deletingGameId, setDeletingGameId] = useState(null);
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [actingOnId, setActingOnId] = useState(null);
  const [activeScreen, setActiveScreen] = useState(null); // null | 'profile' | 'game' | 'timeline'
  const [timelineGameId, setTimelineGameId] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const copyCode = (code) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteGame = (game) => {
    const opponent = game.away_team_name ?? 'Unbekannt';
    const dateStr = game.game_date
      ? new Date(game.game_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;
    const label = dateStr ? `${opponent} (${dateStr})` : opponent;

    Alert.alert(
      'Spiel löschen',
      `"${label}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen', style: 'destructive',
          onPress: async () => {
            setDeletingGameId(game.id);
            try {
              await supabase.from('ticker_events').delete().eq('games_idgame', game.id);
              const { error } = await supabase.from('games').delete().eq('id', game.id);
              if (error) throw error;
              setGames((prev) => prev.filter((g) => g.id !== game.id));
            } catch (err) {
              Alert.alert('Fehler', err?.message ?? 'Spiel konnte nicht gelöscht werden.');
            } finally {
              setDeletingGameId(null);
            }
          },
        },
      ],
    );
  };

  const leaveTeam = () => {
    const teamName = team?.name ?? 'dieses Team';
    Alert.alert(
      'Team verlassen',
      `Möchtest du die Vereinsverwaltung für „${teamName}" wirklich verlassen? Du verlierst den Zugriff auf Kader und Spiele.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Verlassen',
          style: 'destructive',
          onPress: async () => {
            setLeavingTeam(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Nicht eingeloggt.');

              const { error: managerError } = await supabase
                .from('team_managers')
                .delete()
                .eq('profile_id', user.id)
                .eq('team_id', teamId);

              if (managerError) throw managerError;

              await supabase
                .from('team_memberships')
                .delete()
                .eq('player_id', user.id)
                .eq('team_id', teamId);

              Alert.alert('Erledigt', `Du hast ${teamName} verlassen.`);
              onTeamLeft?.();
              onBack();
            } catch (err) {
              Alert.alert('Fehler', err?.message ?? 'Team konnte nicht verlassen werden.');
            } finally {
              setLeavingTeam(false);
            }
          },
        },
      ],
    );
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: teamData }, { data: gamesData }, { data: requestsData }] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, short_name, town, avatar_teamlogo, leagues(name, league_logo_url)')
        .eq('id', teamId)
        .maybeSingle(),
      supabase
        .from('games')
        .select('id, game_date, game_time, location, is_home_game, away_team_name, home_score, away_score, status, game_code')
        .eq('home_team_id', teamId)
        .order('game_date', { ascending: true }),
      supabase
        .from('team_memberships')
        .select('id, status, player_id, profiles(id, first_name, last_name, avatar, coaching_role)')
        .eq('team_id', teamId)
        .in('status', ['pending', 'coach_pending']),
    ]);
    setTeam(teamData ?? null);
    setGames(gamesData ?? []);
    setPendingRequests(requestsData ?? []);
    setLoading(false);
  }, [teamId]);

  const handleAcceptRequest = async (member) => {
    setActingOnId(member.id);
    try {
      await acceptMembershipRequest(member.id, teamId, member.player_id, member.status);
      await loadData();
    } catch (err) {
      Alert.alert('Fehler', err?.message ?? 'Anfrage konnte nicht angenommen werden.');
    } finally {
      setActingOnId(null);
    }
  };

  const handleRejectRequest = (member) => {
    const p = member.profiles;
    const name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'Diese Person';
    const isCoach = member.status === 'coach_pending';

    Alert.alert(
      isCoach ? 'Trainer-Anfrage ablehnen' : 'Anfrage ablehnen',
      `${name} wirklich ablehnen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Ablehnen',
          style: 'destructive',
          onPress: async () => {
            setActingOnId(member.id);
            try {
              await rejectMembershipRequest(member.id);
              await loadData();
            } catch (err) {
              Alert.alert('Fehler', err?.message ?? 'Anfrage konnte nicht abgelehnt werden.');
            } finally {
              setActingOnId(null);
            }
          },
        },
      ],
    );
  };

  useEffect(() => { loadData(); }, [loadData]);

  // Sub-screens
  if (activeScreen === 'profile') {
    return (
      <TeamProfileScreen
        teamId={teamId}
        onBack={() => { setActiveScreen(null); loadData(); }}
      />
    );
  }

  if (activeScreen === 'game') {
    return (
      <GameCreateScreen
        teamId={teamId}
        onBack={() => { setActiveScreen(null); loadData(); }}
      />
    );
  }

  if (activeScreen === 'timeline' && timelineGameId) {
    return (
      <TimelineScreen
        gameId={timelineGameId}
        onBack={() => { setActiveScreen(null); setTimelineGameId(null); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={B} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B} colors={[B]} />}
      >

        {/* TEAM HEADER */}
        <TouchableOpacity
          style={styles.teamHeader}
          onPress={() => team && setActiveScreen('profile')}
          activeOpacity={team ? 0.85 : 1}
          disabled={!team}
        >
          {loading ? (
            <ActivityIndicator color={B} size="large" />
          ) : (
            <>
              {team?.avatar_teamlogo ? (
                <Image
                  source={{ uri: team.avatar_teamlogo }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.teamLogoPlaceholder}>
                  <Text style={styles.teamLogoInitials}>
                    {(team?.short_name || team?.name || '?').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.teamName}>{team?.name ?? 'Team wird geladen…'}</Text>
              {(team?.leagues?.name || team?.town) ? (
                <Text style={styles.teamMeta}>
                  {[team?.leagues?.name, team?.town].filter(Boolean).join('  ·  ')}
                </Text>
              ) : null}
            </>
          )}
        </TouchableOpacity>

        {pendingRequests.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>OFFENE ANFRAGEN</Text>
            {pendingRequests.map((member) => {
              const p = member.profiles;
              const name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'Unbekannt';
              const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
              const isCoach = member.status === 'coach_pending';
              const busy = actingOnId === member.id;

              return (
                <View key={member.id} style={styles.requestCard}>
                  {p?.avatar ? (
                    <Image source={{ uri: p.avatar }} style={styles.requestAvatar} />
                  ) : (
                    <View style={styles.requestAvatarPlaceholder}>
                      <Text style={styles.requestAvatarText}>{initials}</Text>
                    </View>
                  )}
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.requestMeta}>
                      {isCoach ? 'Co-Trainer-Anfrage' : 'Spieler-Anfrage'}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={B} size="small" />
                  ) : (
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.requestAcceptBtn}
                        onPress={() => handleAcceptRequest(member)}
                        hitSlop={6}
                      >
                        <Check size={16} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.requestRejectBtn}
                        onPress={() => handleRejectRequest(member)}
                        hitSlop={6}
                      >
                        <X size={16} color={R} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.sectionLabel}>VEREINSVERWALTUNG</Text>

        {/* TEAMPROFIL */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveScreen('profile')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: BG, overflow: 'hidden' }]}>
            {team?.avatar_teamlogo ? (
              <Image
                source={{ uri: team.avatar_teamlogo }}
                style={styles.actionTeamLogo}
                resizeMode="contain"
              />
            ) : (
              <Users size={26} color={B} />
            )}
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Team bearbeiten</Text>
            <Text style={styles.actionSub}>Teamdaten, Kontaktinfos & Kader verwalten</Text>
          </View>
          <ChevronRight size={20} color={MUTED} />
        </TouchableOpacity>

        {/* SPIEL ERSTELLEN */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveScreen('game')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FFF0F2' }]}>
            <Calendar size={26} color={R} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Spiel erstellen</Text>
            <Text style={styles.actionSub}>Neues Spiel anlegen & Ticker-Code generieren</Text>
          </View>
          <ChevronRight size={20} color={MUTED} />
        </TouchableOpacity>

        {/* TICKER STARTEN */}
        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardPrimary]}
          onPress={() => onOpenTicker && onOpenTicker()}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Zap size={26} color="#FFFFFF" />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: '#FFFFFF' }]}>Ticker starten</Text>
            <Text style={[styles.actionSub, { color: 'rgba(255,255,255,0.75)' }]}>
              Live-Ticker mit Game-Code öffnen
            </Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* SPIELE */}
        <View style={styles.gamesHeader}>
          <Text style={styles.sectionLabel}>SPIELE</Text>
          <TouchableOpacity onPress={() => setActiveScreen('game')} activeOpacity={0.75}>
            <Text style={styles.addGameLink}>+ Neues Spiel</Text>
          </TouchableOpacity>
        </View>

        {games.length === 0 ? (
          <View style={styles.emptyGames}>
            <Calendar size={28} color={MUTED} />
            <Text style={styles.emptyGamesText}>Noch keine Spiele erstellt</Text>
          </View>
        ) : (
          games.map((game) => {
            const statusNorm = (game.status ?? '').toLowerCase();
            const cfg      = STATUS_CONFIG[statusNorm] ?? STATUS_CONFIG.scheduled;
            const opponent = game.away_team_name ?? 'Unbekannt';
            const dateStr  = game.game_date
              ? new Date(game.game_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : null;
            const isLive   = statusNorm === 'live';
            const isDone   = statusNorm === 'finished';

            const cardContent = (
              <>
                <View style={styles.gameCardTop}>
                  <View style={[styles.gameBadge, { backgroundColor: cfg.bg }]}>
                    {isLive && <View style={styles.liveDot} />}
                    <Text style={[styles.gameBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteGameBtn}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      deleteGame(game);
                    }}
                    disabled={deletingGameId === game.id}
                    hitSlop={8}
                    activeOpacity={0.75}
                  >
                    {deletingGameId === game.id
                      ? <ActivityIndicator size="small" color={R} />
                      : <Trash2 size={18} color={R} />
                    }
                  </TouchableOpacity>
                </View>

                <View style={styles.gameTeamsRow}>
                  <Text style={styles.gameTeam} numberOfLines={1}>
                    {game.is_home_game ? team?.short_name ?? team?.name : opponent}
                  </Text>
                  {isDone || isLive ? (
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreText}>{game.home_score ?? 0} : {game.away_score ?? 0}</Text>
                    </View>
                  ) : (
                    <Text style={styles.vsText}>vs</Text>
                  )}
                  <Text style={[styles.gameTeam, { textAlign: 'right' }]} numberOfLines={1}>
                    {game.is_home_game ? opponent : team?.short_name ?? team?.name}
                  </Text>
                </View>

                <View style={styles.gameMeta}>
                  {dateStr ? (
                    <View style={styles.gameMetaItem}>
                      <Calendar size={12} color={MUTED} />
                      <Text style={styles.gameMetaText}>
                        {dateStr}{game.game_time ? `  ·  ${game.game_time} Uhr` : ''}
                      </Text>
                    </View>
                  ) : null}
                  {game.location ? (
                    <View style={styles.gameMetaItem}>
                      <MapPin size={12} color={MUTED} />
                      <Text style={styles.gameMetaText} numberOfLines={1}>{game.location}</Text>
                    </View>
                  ) : null}
                  {game.game_code ? (
                    <View style={styles.gameMetaItem}>
                      <Hash size={12} color={MUTED} />
                      <Text style={[styles.gameMetaText, { fontWeight: '700', color: B }]}>{game.game_code}</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          copyCode(game.game_code);
                        }}
                        hitSlop={8}
                        style={[styles.copyBtn, copiedCode === game.game_code && styles.copyBtnDone]}
                      >
                        {copiedCode === game.game_code
                          ? <Check size={11} color="#10B981" />
                          : <Copy size={11} color={B} />
                        }
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {isLive && onOpenLiveTicker ? (
                  <View style={styles.timelineLink}>
                    <Zap size={12} color={R} />
                    <Text style={styles.timelineLinkText}>Live-Ticker öffnen ➔</Text>
                  </View>
                ) : null}

                {isDone || isLive ? (
                  <TouchableOpacity
                    style={[styles.timelineLink, isLive && styles.timelineLinkSecondary]}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setTimelineGameId(game.id);
                      setActiveScreen('timeline');
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.timelineLinkText, isLive && styles.timelineLinkTextMuted]}>
                      Spielverlauf ansehen ➔
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            );

            if (isLive && onOpenLiveTicker) {
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[styles.gameCard, styles.gameCardLive]}
                  onPress={() => onOpenLiveTicker(game.id)}
                  activeOpacity={0.85}
                >
                  {cardContent}
                </TouchableOpacity>
              );
            }

            return (
              <View key={game.id} style={styles.gameCard}>
                {cardContent}
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={leaveTeam}
          activeOpacity={0.7}
          disabled={leavingTeam}
        >
          {leavingTeam ? (
            <ActivityIndicator size="small" color={MUTED} />
          ) : (
            <>
              <UserMinus size={14} color={MUTED} />
              <Text style={styles.leaveBtnText}>Team verlassen</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },

  teamHeader: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  teamLogo: {
    width: 120, height: 120, borderRadius: 24, marginBottom: 14,
    backgroundColor: BG,
  },
  teamLogoPlaceholder: {
    width: 120, height: 120, borderRadius: 24, marginBottom: 14,
    backgroundColor: B, justifyContent: 'center', alignItems: 'center',
    shadowColor: B, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  teamLogoInitials: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  teamName: {
    color: B, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 4,
  },
  teamMeta: {
    color: MUTED, fontSize: 13, fontWeight: '500', textAlign: 'center',
  },

  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.2, marginBottom: 14,
  },

  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: BG, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    padding: 18, marginBottom: 14,
  },
  actionCardPrimary: {
    backgroundColor: B, borderColor: B,
    shadowColor: B, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  actionTeamLogo: { width: 52, height: 52, borderRadius: 14 },
  actionText: { flex: 1 },
  actionTitle: { color: B, fontSize: 16, fontWeight: '800', marginBottom: 3 },
  actionSub:   { color: MUTED, fontSize: 12, lineHeight: 17 },

  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, marginTop: 28,
  },
  leaveBtnText: { color: MUTED, fontSize: 13, fontWeight: '600' },

  gamesHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 6, marginBottom: 12,
  },
  addGameLink: { color: R, fontSize: 13, fontWeight: '700' },

  emptyGames: {
    alignItems: 'center', paddingVertical: 28, gap: 10,
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  emptyGamesText: { color: MUTED, fontSize: 13 },

  gameCard: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 14, marginBottom: 10,
  },
  gameCardLive: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  gameCardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  deleteGameBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF0F2', borderWidth: 1, borderColor: '#FECDD3',
    justifyContent: 'center', alignItems: 'center',
  },
  gameBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981',
  },
  gameBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  gameTeamsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10, gap: 8,
  },
  gameTeam: { flex: 1, color: B, fontSize: 15, fontWeight: '800' },
  vsText:   { color: MUTED, fontSize: 13, fontWeight: '600', paddingHorizontal: 4 },
  scoreBox: {
    backgroundColor: B, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  scoreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  gameMeta:     { gap: 4 },
  gameMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gameMetaText: { color: MUTED, fontSize: 12 },
  copyBtn: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
  },
  copyBtnDone: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },

  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 8,
  },
  requestAvatar: { width: 44, height: 44, borderRadius: 12 },
  requestAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  requestAvatarText: { color: B, fontSize: 14, fontWeight: '800' },
  requestInfo: { flex: 1 },
  requestName: { color: B, fontSize: 15, fontWeight: '700' },
  requestMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
  requestAcceptBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
  },
  requestRejectBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FFF0F2', alignItems: 'center', justifyContent: 'center',
  },

  timelineLink: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineLinkSecondary: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0,
  },
  timelineLinkText: { color: R, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  timelineLinkTextMuted: { color: MUTED },
});
