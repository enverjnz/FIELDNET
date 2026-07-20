import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, Image, Modal, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Edit2, Save, X, Users, Phone,
  Mail, Globe, AtSign, MapPin, Clock, Trophy,
  Check, Trash2, ChevronDown, Calendar, Camera,
  UserPlus, UserMinus, Newspaper,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { resolveTeamLogoUrl } from '../lib/uploadImage';
import { acceptMembershipRequest, rejectMembershipRequest } from '../lib/teamMembership';
import {
  followTeam,
  unfollowTeam,
  isUserFollowingTeam,
  isUserTeamManager,
} from '../lib/teamFollowers';
import {
  fetchRegions,
  fetchLeaguesForRegion,
  getTeamLeagueAssignment,
  getNextSeason,
  saveTeamLeagueEnrollment,
  countTeamOpenGames,
} from '../lib/leagueTeams';
import { fetchPostsForTeam } from '../lib/teamPosts';
import PostCard from '../components/PostCard';
import PostCreateScreen from './PostCreateScreen';
import FullscreenImageModal from '../components/FullscreenImageModal';
import TimelineScreen from './TimelineScreen';
import { useTheme } from '../context/ThemeContext';
import { createTeamProfileStyles } from '../theme/teamProfileStyles';

const GREEN = '#10B981';

// ─── Helper ──────────────────────────────────────────────────────────────────

function getStatusLabels(colors) {
  return {
    pending:       { label: 'Ausstehend',  color: '#F59E0B' },
    approved:      { label: 'Aktiv',       color: GREEN     },
    coach_pending: { label: 'Trainer',     color: colors.text },
    declined:      { label: 'Abgelehnt',   color: '#EF4444' },
  };
}

const GAME_STATUS = {
  scheduled: { label: 'GEPLANT',  short: '–' },
  SCHEDULED: { label: 'GEPLANT',  short: '–' },
  live:      { label: 'LIVE',     short: 'LIVE' },
  LIVE:      { label: 'LIVE',     short: 'LIVE' },
  finished:  { label: 'BEENDET',  short: 'FT' },
  FINISHED:  { label: 'BEENDET',  short: 'FT' },
  cancelled: { label: 'ABGESAGT', short: '–' },
  CANCELLED: { label: 'ABGESAGT', short: '–' },
};

function InfoRow({ icon, label, value, styles }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function TeamLogoSmall({ uri, label, styles }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.scoreTeamLogo} resizeMode="contain" />;
  }
  return (
    <View style={styles.scoreTeamLogoPlaceholder}>
      <Text style={styles.scoreTeamLogoText}>{(label ?? '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

function GameScoreCard({ game, team, onPress, styles, colors }) {
  const homeName = game.is_home_game
    ? (team?.short_name ?? team?.name ?? 'Heim')
    : (game.away_team_name ?? 'Gast');
  const awayName = game.is_home_game
    ? (game.away_team_name ?? 'Gast')
    : (team?.short_name ?? team?.name ?? 'Heim');

  const homeScore = game.home_score ?? 0;
  const awayScore = game.away_score ?? 0;
  const statusNorm = (game.status ?? '').toLowerCase();
  const hasScore = statusNorm === 'live' || statusNorm === 'finished';
  const homeWins = hasScore && homeScore > awayScore;
  const awayWins = hasScore && awayScore > homeScore;
  const canOpenTimeline = hasScore && onPress;

  const dateStr = game.game_date
    ? new Date(game.game_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
  const statusCfg = GAME_STATUS[game.status] ?? GAME_STATUS[statusNorm] ?? GAME_STATUS.scheduled;
  const headerLine = [dateStr, game.game_time ? `${game.game_time} Uhr` : null].filter(Boolean).join(' · ')
    || statusCfg.label;

  const card = (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreLeague} numberOfLines={1}>{headerLine}</Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreTeamContainer}>
          <TeamLogoSmall
            uri={game.is_home_game ? team?.avatar_teamlogo : null}
            label={homeName}
            styles={styles}
          />
          <Text style={[styles.scoreTeamName, homeWins && styles.scoreWinnerName]} numberOfLines={1}>
            {homeName}
          </Text>
        </View>
        {hasScore ? (
          <Text style={[styles.scoreTeamScore, homeWins && styles.scoreWinnerScore]}>
            {String(homeScore).padStart(2, '0')}
          </Text>
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreTeamContainer}>
          <TeamLogoSmall
            uri={!game.is_home_game ? team?.avatar_teamlogo : null}
            label={awayName}
            styles={styles}
          />
          <Text style={[styles.scoreTeamName, awayWins && styles.scoreWinnerName]} numberOfLines={1}>
            {awayName}
          </Text>
        </View>
        {hasScore ? (
          <Text style={[styles.scoreTeamScore, awayWins && styles.scoreWinnerScore]}>
            {String(awayScore).padStart(2, '0')}
          </Text>
        ) : null}
      </View>

      <View style={styles.scoreCardFooter}>
        <Text style={styles.scoreStatusTag}>{statusCfg.short}</Text>
        {canOpenTimeline ? (
          <Text style={styles.scoreTimelineLink}>SPIELVERLAUF ➔</Text>
        ) : null}
      </View>

      {game.location ? (
        <View style={styles.scoreLocationRow}>
          <MapPin size={11} color={colors.textMuted} />
          <Text style={styles.scoreLocationText} numberOfLines={1}>{game.location}</Text>
        </View>
      ) : null}
    </View>
  );

  if (canOpenTimeline) {
    return (
      <TouchableOpacity onPress={() => onPress(game)} activeOpacity={0.85}>
        {card}
      </TouchableOpacity>
    );
  }

  return card;
}

function EditField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, styles, colors }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function LeagueSelect({
  label = 'LIGA',
  value,
  onChange,
  options,
  loading,
  error,
  disabled = false,
  placeholder = 'Liga auswählen…',
  styles,
  colors,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.leagueTrigger, error && styles.leagueTriggerError, disabled && styles.leagueTriggerDisabled]}
        onPress={() => !loading && !disabled && setOpen(true)}
        activeOpacity={0.8}
        disabled={loading || disabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} style={{ flex: 1 }} />
        ) : (
          <Text style={[styles.leagueTriggerText, !selected && styles.leaguePlaceholder]} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
        )}
        <ChevronDown size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {!!error && <Text style={styles.leagueError}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.leagueOverlay}>
          <TouchableOpacity style={styles.leagueBackdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.leagueSheet}>
            <View style={styles.leagueSheetHeader}>
              <Text style={styles.leagueSheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.leagueList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.leagueEmpty}>Keine Ligen verfügbar.</Text>
              ) : (
                options.map((option) => {
                  const active = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.leagueItem, active && styles.leagueItemActive]}
                      onPress={() => { onChange(option.value); setOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.leagueItemText, active && styles.leagueItemTextActive]}>
                        {option.label}
                      </Text>
                      {active && <Check size={18} color={colors.accent} />}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamProfileScreen({ teamId, onBack, readOnly = false, onRequestJoin, onFollowChange, onMembershipChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createTeamProfileStyles(colors), [colors]);
  const statusLabels = useMemo(() => getStatusLabels(colors), [colors]);

  const [team, setTeam]       = useState(null);
  const [kader, setKader]     = useState([]);
  const [games, setGames]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]     = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [leaguesError, setLeaguesError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [leagueAssignment, setLeagueAssignment] = useState(null);
  const [nextSeasonLabel, setNextSeasonLabel] = useState(null);
  const [leagueDraft, setLeagueDraft] = useState({
    regionId: null,
    leagueId: null,
    enrollMode: 'current',
  });
  const [leagueSaving, setLeagueSaving] = useState(false);
  const [leagueSuccess, setLeagueSuccess] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [timelineGameId, setTimelineGameId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowButton, setShowFollowButton] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followMessage, setFollowMessage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [leavingTeam, setLeavingTeam] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!leagueSuccess) return undefined;
    const timer = setTimeout(() => setLeagueSuccess(null), 3200);
    return () => clearTimeout(timer);
  }, [leagueSuccess]);

  useEffect(() => {
    if (!followMessage) return undefined;
    const timer = setTimeout(() => setFollowMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [followMessage]);

  useEffect(() => { loadData(); }, [teamId, readOnly]);

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;
    (async () => {
      setRegionsLoading(true);
      try {
        const list = await fetchRegions();
        if (!cancelled) setRegions(list);
      } catch (e) {
        if (!cancelled) console.warn('TeamProfile regions:', e?.message);
      } finally {
        if (!cancelled) setRegionsLoading(false);
      }
    })();

    (async () => {
      try {
        const next = await getNextSeason();
        if (!cancelled) setNextSeasonLabel(next?.year_label ?? null);
      } catch {
        if (!cancelled) setNextSeasonLabel(null);
      }
    })();

    return () => { cancelled = true; };
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing || !leagueDraft.regionId) {
      setLeagues([]);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLeaguesLoading(true);
      setLeaguesError(null);
      try {
        const division = leagueAssignment?.division ?? 'Herren';
        const list = await fetchLeaguesForRegion(leagueDraft.regionId, division);
        if (cancelled) return;
        const currentId = leagueDraft.leagueId;
        if (currentId && leagueAssignment?.leagueName && !list.some((l) => l.id === currentId)) {
          setLeagues([{ id: currentId, name: leagueAssignment.leagueName }, ...list]);
        } else {
          setLeagues(list);
        }
      } catch (e) {
        if (!cancelled) {
          setLeaguesError(e?.message ?? 'Ligen konnten nicht geladen werden.');
          setLeagues([]);
        }
      } finally {
        if (!cancelled) setLeaguesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isEditing, leagueDraft.regionId, leagueAssignment?.division, leagueAssignment?.leagueName, leagueDraft.leagueId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: teamData }, { data: kaderData }, { data: gamesData }, { data: statsData }] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, short_name, town, founding_year, avatar_teamlogo, training_location, training_times, website, tel, email, instagram, primary_colour, secondary_colour')
        .eq('id', teamId)
        .maybeSingle(),
      supabase
        .from('team_memberships')
        .select('id, status, player_id, profiles(id, first_name, last_name, position, jersey_number, avatar, age, nationality)')
        .eq('team_id', teamId),
      supabase
        .from('games')
        .select('id, game_date, game_time, location, is_home_game, away_team_name, home_score, away_score, status')
        .eq('home_team_id', teamId)
        .order('game_date', { ascending: false }),
      supabase
        .from('team_stats')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle(),
    ]);

    let assignment = null;
    try {
      assignment = await getTeamLeagueAssignment(teamId);
    } catch (e) {
      console.warn('TeamProfile league assignment:', e?.message);
    }

    setTeam(teamData ?? null);
    setLeagueAssignment(assignment);
    setKader(kaderData ?? []);
    setGames(gamesData ?? []);
    setTeamStats(statsData ?? null);
    await loadFollowState();
    await loadPosts();
    setLoading(false);
  };

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const list = await fetchPostsForTeam(teamId);
      setPosts(list);
    } catch (e) {
      console.warn('TeamProfile posts:', e?.message);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadFollowState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserId(null);
        setIsFollowing(false);
        setShowFollowButton(false);
        return;
      }

      setCurrentUserId(user.id);
      const isManager = !readOnly ? true : await isUserTeamManager(user.id, teamId);
      const canFollow = !isManager;

      setShowFollowButton(canFollow);
      if (canFollow) {
        const following = await isUserFollowingTeam(user.id, teamId);
        setIsFollowing(following);
      } else {
        setIsFollowing(false);
      }
    } catch (e) {
      console.warn('TeamProfile follow state:', e?.message);
      setShowFollowButton(false);
      setIsFollowing(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId || followBusy || !showFollowButton) return;

    setFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowTeam(currentUserId, teamId);
        setIsFollowing(false);
        setFollowMessage('Du folgst diesem Team nicht mehr.');
      } else {
        await followTeam(currentUserId, teamId);
        setIsFollowing(true);
        const teamLabel = team?.short_name ?? team?.name ?? 'dem Team';
        setFollowMessage(`Du folgst jetzt ${teamLabel}.`);
      }
      onFollowChange?.();
    } catch (err) {
      Alert.alert('Fehler', err?.message ?? 'Aktion konnte nicht ausgeführt werden.');
    } finally {
      setFollowBusy(false);
    }
  };

  const startEditing = () => {
    if (!team) return;
    setDraft({
      name:              team.name              ?? '',
      short_name:        team.short_name        ?? '',
      town:              team.town              ?? '',
      founding_year:     team.founding_year     ? String(team.founding_year) : '',
      training_location: team.training_location ?? '',
      training_times:    team.training_times    ?? '',
      website:           team.website           ?? '',
      tel:               team.tel               ?? '',
      email:             team.email             ?? '',
      instagram:         team.instagram         ?? '',
      avatar_teamlogo:   team.avatar_teamlogo   ?? '',
    });
    setLeagueDraft({
      regionId: leagueAssignment?.regionId ?? null,
      leagueId: leagueAssignment?.leagueId ?? null,
      enrollMode: 'current',
    });
    setLeagueSuccess(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft({});
    setLeagueDraft({ regionId: null, leagueId: null, enrollMode: 'current' });
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung fehlt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setDraft((p) => ({ ...p, avatar_teamlogo: result.assets[0].uri }));
    }
  };

  const saveProfile = async () => {
    if (!draft.name?.trim()) {
      Alert.alert('Fehler', 'Teamname ist Pflichtfeld.');
      return;
    }
    setSaving(true);
    try {
      let logoUrl = null;
      if (draft.avatar_teamlogo?.trim()) {
        try {
          logoUrl = await resolveTeamLogoUrl(teamId, draft.avatar_teamlogo);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Unbekannter Upload-Fehler';
          throw new Error(
            msg.includes('row-level security') || msg.includes('row level security')
              ? 'Logo-Upload blockiert. Bitte sql/storage_policies.sql in Supabase ausführen.'
              : `Logo-Upload fehlgeschlagen: ${msg}`,
          );
        }
      }

      const { error } = await supabase
        .from('teams')
        .update({
          name:              draft.name.trim(),
          short_name:        draft.short_name.trim()        || null,
          town:              draft.town.trim()              || null,
          founding_year:     draft.founding_year ? parseInt(draft.founding_year, 10) : null,
          training_location: draft.training_location.trim() || null,
          training_times:    draft.training_times.trim()    || null,
          website:           draft.website.trim()           || null,
          tel:               draft.tel.trim()               || null,
          email:             draft.email.trim()             || null,
          instagram:         draft.instagram.trim()         || null,
          avatar_teamlogo:   logoUrl,
        })
        .eq('id', teamId);

      if (error) throw error;

      Alert.alert('Gespeichert', 'Teamprofil wurde aktualisiert.');
      setIsEditing(false);
      loadData();
    } catch (error) {
      const msg = error?.message ?? 'Speichern fehlgeschlagen.';
      Alert.alert(
        'Fehler',
        msg.includes('row-level security') || msg.includes('row level security')
          ? 'Zugriff verweigert (RLS). Bitte sql/profile_team_rls.sql in Supabase ausführen.'
          : msg,
      );
    } finally {
      setSaving(false);
    }
  };

  const saveLeagueAssignment = async () => {
    if (!leagueDraft.regionId) {
      Alert.alert('Fehler', 'Bitte wähle einen Landesverband.');
      return;
    }
    if (!leagueDraft.leagueId) {
      Alert.alert('Fehler', 'Bitte wähle eine Liga.');
      return;
    }

    const leagueChanged = leagueDraft.leagueId !== leagueAssignment?.leagueId
      || leagueDraft.regionId !== leagueAssignment?.regionId;

    if (leagueDraft.enrollMode === 'current' && !leagueChanged) {
      Alert.alert('Hinweis', 'Es wurden keine Änderungen vorgenommen.');
      return;
    }

    const proceedSave = async () => {
      setLeagueSaving(true);
      try {
        await saveTeamLeagueEnrollment(
          teamId,
          leagueDraft.leagueId,
          leagueDraft.enrollMode,
        );
        setLeagueSuccess('Liga erfolgreich aktualisiert!');
        if (leagueDraft.enrollMode === 'current') {
          const assignment = await getTeamLeagueAssignment(teamId);
          setLeagueAssignment(assignment);
          setLeagueDraft({
            regionId: assignment?.regionId ?? leagueDraft.regionId,
            leagueId: assignment?.leagueId ?? leagueDraft.leagueId,
            enrollMode: 'current',
          });
        }
      } catch (error) {
        const msg = error?.message ?? 'Speichern fehlgeschlagen.';
        Alert.alert(
          'Fehler',
          msg.includes('row-level security') || msg.includes('row level security')
            ? 'Zugriff verweigert (RLS). Bitte sql/league_teams_rls.sql in Supabase ausführen.'
            : msg,
        );
      } finally {
        setLeagueSaving(false);
      }
    };

    if (leagueDraft.enrollMode === 'current' && leagueChanged) {
      try {
        const openGames = await countTeamOpenGames(teamId);
        if (openGames > 0) {
          Alert.alert(
            'Liga wechseln',
            `Dein Team hat ${openGames} geplante oder laufende Spiele. Diese bleiben bestehen, erscheinen aber in der Tabelle der neuen Liga erst nach dem Wechsel.`,
            [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Trotzdem speichern', onPress: proceedSave },
            ],
          );
          return;
        }
      } catch {
        // continue without blocking
      }
    }

    await proceedSave();
  };

  const removePlayer = (membershipId, playerName) => {
    Alert.alert(
      'Spieler entfernen',
      `${playerName} wirklich aus dem Kader entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen', style: 'destructive',
          onPress: async () => {
            await supabase.from('team_memberships').delete().eq('id', membershipId);
            loadData();
          },
        },
      ],
    );
  };

  const myMembership = useMemo(() => {
    if (!currentUserId) return null;
    return kader.find((m) => m.player_id === currentUserId) ?? null;
  }, [kader, currentUserId]);

  const isTeamMember = Boolean(
    myMembership && (myMembership.status === 'approved' || myMembership.status === 'pending' || myMembership.status === 'coach_pending'),
  );

  const leaveTeam = () => {
    if (!myMembership || !team || leavingTeam) return;
    const teamName = team.name ?? 'dieses Team';
    Alert.alert(
      'Team verlassen',
      myMembership.status === 'approved'
        ? `Möchtest du ${teamName} wirklich verlassen?`
        : `Möchtest du deine Anfrage bei ${teamName} wirklich zurückziehen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: myMembership.status === 'approved' ? 'Verlassen' : 'Zurückziehen',
          style: 'destructive',
          onPress: async () => {
            setLeavingTeam(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Nicht eingeloggt.');

              const { error } = await supabase
                .from('team_memberships')
                .delete()
                .eq('id', myMembership.id)
                .eq('player_id', user.id);

              if (error) throw error;
              Alert.alert(
                'Erledigt',
                myMembership.status === 'approved'
                  ? `Du hast ${teamName} verlassen.`
                  : `Deine Anfrage bei ${teamName} wurde zurückgezogen.`,
              );
              await loadData();
              onMembershipChange?.();
            } catch (err) {
              Alert.alert('Fehler', err?.message ?? 'Aktion fehlgeschlagen.');
            } finally {
              setLeavingTeam(false);
            }
          },
        },
      ],
    );
  };

  const acceptMember = async (member) => {
    try {
      await acceptMembershipRequest(member.id, teamId, member.player_id, member.status);
      loadData();
    } catch (error) {
      console.warn('acceptMember error:', JSON.stringify(error));
      Alert.alert('Fehler', error?.message ?? 'Anfrage konnte nicht angenommen werden.');
    }
  };

  const rejectMember = (member) => {
    const name = member.profiles
      ? [member.profiles.first_name, member.profiles.last_name].filter(Boolean).join(' ')
      : 'Diese Person';
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
            try {
              await rejectMembershipRequest(member.id);
              loadData();
            } catch (error) {
              Alert.alert('Fehler', error?.message ?? 'Anfrage konnte nicht abgelehnt werden.');
            }
          },
        },
      ],
    );
  };

  if (editingPost) {
    return (
      <PostCreateScreen
        teamId={teamId}
        post={editingPost}
        onBack={() => setEditingPost(null)}
        onSuccess={() => {
          setEditingPost(null);
          loadData();
        }}
      />
    );
  }

  if (timelineGameId) {
    return (
      <TimelineScreen
        gameId={timelineGameId}
        onBack={() => setTimelineGameId(null)}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={colors.text} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </TouchableOpacity>
        <ActivityIndicator color={colors.text} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={isEditing ? cancelEditing : onBack} activeOpacity={0.75}>
          <ArrowLeft size={20} color={colors.text} />
          <Text style={styles.backBtnText}>{isEditing ? 'Abbrechen' : 'Zurück'}</Text>
        </TouchableOpacity>

        {isEditing ? (
          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Speichern</Text>
                </>
            }
          </TouchableOpacity>
        ) : !readOnly ? (
          <TouchableOpacity style={styles.editBtn} onPress={startEditing} activeOpacity={0.85}>
            <Edit2 size={16} color={colors.text} />
            <Text style={styles.editBtnText}>Bearbeiten</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={!isEditing ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} colors={[colors.text]} /> : undefined}
      >
        {!!(leagueSuccess || followMessage) && (
          <View style={styles.successToast}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.successToastText}>{leagueSuccess || followMessage}</Text>
          </View>
        )}
        {/* TEAM LOGO */}
        <View style={styles.logoSection}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.logoPicker} onPress={pickLogo} activeOpacity={0.85}>
                {draft.avatar_teamlogo ? (
                  <Image
                    source={{ uri: draft.avatar_teamlogo }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.teamLogoPlaceholder}>
                    <Camera size={28} color="#FFFFFF" />
                    <Text style={styles.logoPickerHint}>Logo hochladen</Text>
                  </View>
                )}
              </TouchableOpacity>
              {!!draft.avatar_teamlogo && (
                <TouchableOpacity
                  onPress={() => setDraft((p) => ({ ...p, avatar_teamlogo: '' }))}
                  style={styles.removeLogoBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeLogoText}>Bild entfernen</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (team?.avatar_teamlogo ? (
            <TouchableOpacity
              onPress={() => setFullscreenImage(team.avatar_teamlogo)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: team.avatar_teamlogo }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.teamLogoPlaceholder}>
              <Trophy size={44} color="#FFFFFF" />
            </View>
          ))}
        </View>

        {showFollowButton && !isEditing && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnOutline]}
            onPress={toggleFollow}
            disabled={followBusy}
            activeOpacity={0.85}
          >
            {followBusy ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.text : '#FFFFFF'} />
            ) : (
              <>
                {isFollowing
                  ? <UserMinus size={18} color={colors.text} />
                  : <UserPlus size={18} color="#FFFFFF" />
                }
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextOutline]}>
                  {isFollowing ? 'Entfolgen' : 'Folgen'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ALLGEMEINE INFOS */}
        <Text style={styles.sectionTitle}>ALLGEMEINE INFOS</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <EditField label="TEAMNAME *" value={draft.name} onChangeText={(v) => setDraft(p => ({ ...p, name: v }))} placeholder="z. B. Nürnberg Rams" styles={styles} colors={colors} />
              <EditField label="KURZNAME" value={draft.short_name} onChangeText={(v) => setDraft(p => ({ ...p, short_name: v }))} placeholder="z. B. RAMS" styles={styles} colors={colors} />
              <EditField label="STADT" value={draft.town} onChangeText={(v) => setDraft(p => ({ ...p, town: v }))} placeholder="z. B. Nürnberg" styles={styles} colors={colors} />
              <EditField label="GRÜNDUNGSJAHR" value={draft.founding_year} onChangeText={(v) => setDraft(p => ({ ...p, founding_year: v }))} placeholder="z. B. 2005" keyboardType="numeric" styles={styles} colors={colors} />
            </>
          ) : (
            <>
              <InfoRow icon={<Trophy size={16} color={colors.text} />} label="Teamname" value={team?.name} styles={styles} />
              <InfoRow icon={<Trophy size={16} color={colors.text} />} label="Kurzname" value={team?.short_name} styles={styles} />
              <InfoRow icon={<MapPin size={16} color={colors.text} />} label="Stadt" value={team?.town} styles={styles} />
              <InfoRow icon={<Clock size={16} color={colors.text} />} label="Gründungsjahr" value={team?.founding_year ? String(team.founding_year) : null} styles={styles} />
            </>
          )}
        </View>

        {/* LIGA & VERBAND */}
        <Text style={styles.sectionTitle}>LIGA & VERBAND VERWALTEN</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <Text style={styles.leagueSectionHint}>
                {leagueAssignment?.division
                  ? `Sparte: ${leagueAssignment.division}`
                  : 'Sparte: Herren'}
                {leagueAssignment?.seasonLabel ? ` · Saison ${leagueAssignment.seasonLabel}` : ''}
              </Text>

              <LeagueSelect
                label="REGION / LANDESVERBAND"
                value={leagueDraft.regionId}
                onChange={(id) => setLeagueDraft((p) => ({
                  ...p,
                  regionId: id,
                  leagueId: id === p.regionId ? p.leagueId : null,
                }))}
                options={regions.map((r) => ({
                  value: r.id,
                  label: r.country_unit || r.name,
                }))}
                loading={regionsLoading}
                placeholder="Landesverband wählen…"
                styles={styles}
                colors={colors}
              />

              <LeagueSelect
                label="LIGA"
                value={leagueDraft.leagueId}
                onChange={(id) => setLeagueDraft((p) => ({ ...p, leagueId: id }))}
                options={leagues.map((l) => ({ value: l.id, label: l.name }))}
                loading={leaguesLoading}
                error={leaguesError}
                disabled={!leagueDraft.regionId}
                placeholder={leagueDraft.regionId ? 'Liga wählen…' : 'Zuerst Region wählen'}
                styles={styles}
                colors={colors}
              />

              <View style={styles.enrollModeWrap}>
                <Text style={styles.fieldLabel}>SPEICHERMODUS</Text>
                <TouchableOpacity
                  style={[styles.enrollModeOption, leagueDraft.enrollMode === 'current' && styles.enrollModeOptionActive]}
                  onPress={() => setLeagueDraft((p) => ({ ...p, enrollMode: 'current' }))}
                  activeOpacity={0.8}
                >
                  <View style={[styles.enrollRadio, leagueDraft.enrollMode === 'current' && styles.enrollRadioActive]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enrollModeTitle}>Liga für aktuelle Saison korrigieren</Text>
                    <Text style={styles.enrollModeSub}>Ändert die Zuordnung sofort für die laufende Saison.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.enrollModeOption,
                    leagueDraft.enrollMode === 'next' && styles.enrollModeOptionActive,
                    !nextSeasonLabel && styles.enrollModeOptionDisabled,
                  ]}
                  onPress={() => nextSeasonLabel && setLeagueDraft((p) => ({ ...p, enrollMode: 'next' }))}
                  activeOpacity={nextSeasonLabel ? 0.8 : 1}
                  disabled={!nextSeasonLabel}
                >
                  <View style={[styles.enrollRadio, leagueDraft.enrollMode === 'next' && styles.enrollRadioActive]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enrollModeTitle}>
                      Für neue Saison einschreiben
                      {nextSeasonLabel ? ` (${nextSeasonLabel})` : ''}
                    </Text>
                    <Text style={styles.enrollModeSub}>
                      {nextSeasonLabel
                        ? 'Behält die historische Zuordnung der aktuellen Saison bei.'
                        : 'Keine kommende Saison in der Datenbank hinterlegt.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.leagueSaveBtn, leagueSaving && styles.leagueSaveBtnDisabled]}
                onPress={saveLeagueAssignment}
                disabled={leagueSaving}
                activeOpacity={0.85}
              >
                {leagueSaving
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.leagueSaveBtnText}>Liga speichern</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <InfoRow icon={<MapPin size={16} color={colors.text} />} label="Landesverband" value={leagueAssignment?.regionLabel || '–'} styles={styles} />
              <InfoRow icon={<Trophy size={16} color={colors.text} />} label="Liga" value={leagueAssignment?.leagueName || '–'} styles={styles} />
              <InfoRow icon={<Calendar size={16} color={colors.text} />} label="Saison" value={leagueAssignment?.seasonLabel || '–'} styles={styles} />
              {leagueAssignment?.division ? (
                <InfoRow icon={<Users size={16} color={colors.text} />} label="Sparte" value={leagueAssignment.division} styles={styles} />
              ) : null}
            </>
          )}
        </View>

        {/* BEITRÄGE */}
        {!isEditing && (
          <>
            <View style={styles.kaderHeader}>
              <Text style={styles.sectionTitle}>BEITRÄGE</Text>
              <Text style={styles.kaderCount}>{posts.length} News</Text>
            </View>
            {postsLoading ? (
              <ActivityIndicator color={colors.text} style={{ marginVertical: 20 }} />
            ) : posts.length === 0 ? (
              <View style={styles.emptyGames}>
                <Newspaper size={28} color={colors.textMuted} />
                <Text style={styles.emptyGamesText}>Noch keine Beiträge veröffentlicht</Text>
              </View>
            ) : (
              <View style={{ marginBottom: 18 }}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    team={team}
                    onEdit={!readOnly && !isEditing ? (p) => setEditingPost(p) : undefined}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* TRAINING */}
        <Text style={styles.sectionTitle}>TRAINING</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <EditField label="TRAININGSORT" value={draft.training_location} onChangeText={(v) => setDraft(p => ({ ...p, training_location: v }))} placeholder="z. B. Sportpark Nord" styles={styles} colors={colors} />
              <EditField label="TRAININGSZEITEN" value={draft.training_times} onChangeText={(v) => setDraft(p => ({ ...p, training_times: v }))} placeholder="z. B. Di & Do 19:00 Uhr" multiline styles={styles} colors={colors} />
            </>
          ) : (
            <>
              <InfoRow icon={<MapPin size={16} color={colors.text} />} label="Trainingsort" value={team?.training_location} styles={styles} />
              <InfoRow icon={<Clock size={16} color={colors.text} />} label="Trainingszeiten" value={team?.training_times} styles={styles} />
            </>
          )}
        </View>

        {/* KONTAKT */}
        <Text style={styles.sectionTitle}>KONTAKT</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <EditField label="TELEFON" value={draft.tel} onChangeText={(v) => setDraft(p => ({ ...p, tel: v }))} placeholder="+49 123 456789" keyboardType="phone-pad" styles={styles} colors={colors} />
              <EditField label="E-MAIL" value={draft.email} onChangeText={(v) => setDraft(p => ({ ...p, email: v }))} placeholder="info@meinteam.de" keyboardType="email-address" styles={styles} colors={colors} />
              <EditField label="WEBSEITE" value={draft.website} onChangeText={(v) => setDraft(p => ({ ...p, website: v }))} placeholder="https://meinteam.de" autoCapitalize="none" styles={styles} colors={colors} />
              <EditField label="INSTAGRAM" value={draft.instagram} onChangeText={(v) => setDraft(p => ({ ...p, instagram: v }))} placeholder="@meinteam" autoCapitalize="none" styles={styles} colors={colors} />
            </>
          ) : (
            <>
              <InfoRow icon={<Phone size={16} color={colors.text} />} label="Telefon" value={team?.tel} styles={styles} />
              <InfoRow icon={<Mail size={16} color={colors.text} />} label="E-Mail" value={team?.email} styles={styles} />
              <InfoRow icon={<Globe size={16} color={colors.text} />} label="Webseite" value={team?.website} styles={styles} />
              <InfoRow icon={<AtSign size={16} color={colors.text} />} label="Instagram" value={team?.instagram} styles={styles} />
            </>
          )}
        </View>

        {/* BILANZ */}
        {!isEditing && teamStats && (teamStats.games_played > 0 || teamStats.wins > 0 || teamStats.losses > 0) && (
          <>
            <Text style={styles.sectionTitle}>BILANZ</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <Text style={styles.statTileValue}>{teamStats.games_played ?? 0}</Text>
                <Text style={styles.statTileLabel}>Spiele</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={[styles.statTileValue, { color: GREEN }]}>{teamStats.wins ?? 0}</Text>
                <Text style={styles.statTileLabel}>Siege</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={[styles.statTileValue, { color: colors.accent }]}>{teamStats.losses ?? 0}</Text>
                <Text style={styles.statTileLabel}>Niederlagen</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statTileValue}>{teamStats.ties ?? 0}</Text>
                <Text style={styles.statTileLabel}>Unentsch.</Text>
              </View>
            </View>
          </>
        )}

        {/* SPIELE – Karussell */}
        {!isEditing && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 6 }]}>SPIELE</Text>
            {games.length === 0 ? (
              <View style={styles.emptyGames}>
                <Calendar size={28} color={colors.textMuted} />
                <Text style={styles.emptyGamesText}>Noch keine Spiele erstellt</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.gamesCarousel}
                contentContainerStyle={styles.gamesCarouselContent}
              >
                {games.map((game) => (
                  <GameScoreCard
                    key={game.id}
                    game={game}
                    team={team}
                    onPress={(g) => setTimelineGameId(g.id)}
                    styles={styles}
                    colors={colors}
                  />
                ))}
                <View style={{ width: 6 }} />
              </ScrollView>
            )}
          </>
        )}

        {/* KADER */}
        <View style={styles.kaderHeader}>
          <Text style={styles.sectionTitle}>KADER</Text>
          <Text style={styles.kaderCount}>{(readOnly ? kader.filter((m) => m.status === 'approved') : kader).length} Mitglieder</Text>
        </View>

        {(() => {
          const visibleKader = readOnly
            ? kader.filter((m) => m.status === 'approved')
            : kader.filter((m) => m.status !== 'declined');
          return visibleKader.length === 0 ? (
          <View style={styles.emptyKader}>
            <Users size={28} color={colors.textMuted} />
            <Text style={styles.emptyKaderText}>Noch keine Spieler im Kader</Text>
          </View>
        ) : (
          visibleKader.map((member) => {
            const p      = member.profiles;
            const name   = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'Unbekannt';
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const status = statusLabels[member.status] ?? { label: member.status, color: colors.textMuted };
            return (
              <View key={member.id} style={styles.playerRow}>
                {p?.avatar ? (
                  <TouchableOpacity
                    onPress={() => setFullscreenImage(p.avatar)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: p.avatar }} style={styles.playerAvatarImg} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setSelectedPlayer({ ...p, name, status: member.status })}
                    activeOpacity={0.75}
                  >
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>{initials}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Name + Meta — klickbar */}
                <TouchableOpacity style={styles.playerInfo} onPress={() => setSelectedPlayer({ ...p, name, status: member.status })} activeOpacity={0.75}>
                  <Text style={styles.playerName}>{name}</Text>
                  <Text style={styles.playerMeta}>
                    {member.status === 'coach_pending'
                      ? 'Co-Trainer-Anfrage'
                      : [p?.position, p?.jersey_number ? `#${p.jersey_number}` : null].filter(Boolean).join('  ·  ') || 'Keine Position'}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.statusBadge, { borderColor: status.color }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>

                {(member.status === 'pending' || member.status === 'coach_pending') && !readOnly && (
                  <>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => acceptMember(member)}
                      hitSlop={6}
                    >
                      <Check size={16} color={GREEN} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => rejectMember(member)}
                      hitSlop={6}
                    >
                      <X size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </>
                )}
                {!readOnly && member.status === 'approved' && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removePlayer(member.id, name)}
                    hitSlop={6}
                  >
                    <Trash2 size={16} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        );
        })()}

        {readOnly && team && isTeamMember && (
          <TouchableOpacity
            style={styles.leaveTeamBtn}
            onPress={leaveTeam}
            disabled={leavingTeam}
            activeOpacity={0.75}
          >
            {leavingTeam ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <Text style={styles.leaveTeamBtnText}>− Team verlassen</Text>
            )}
          </TouchableOpacity>
        )}

        {readOnly && onRequestJoin && team && !isTeamMember && (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => onRequestJoin(team)}
            activeOpacity={0.85}
          >
            <Users size={18} color="#FFFFFF" />
            <Text style={styles.joinBtnText}>Beitrittsanfrage senden</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* SPIELER PROFIL MODAL */}
      <Modal
        visible={!!selectedPlayer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        {selectedPlayer && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Spielerprofil</Text>
              <TouchableOpacity onPress={() => setSelectedPlayer(null)} hitSlop={8}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View style={styles.modalAvatarWrap}>
                {selectedPlayer.avatar ? (
                  <TouchableOpacity
                    onPress={() => setFullscreenImage(selectedPlayer.avatar)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: selectedPlayer.avatar }} style={styles.modalAvatarImg} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarInitials}>
                      {selectedPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.modalName}>{selectedPlayer.name}</Text>
                {selectedPlayer.position && (
                  <View style={styles.modalPosPill}>
                    <Text style={styles.modalPosPillText}>{selectedPlayer.position}</Text>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={styles.modalStatsGrid}>
                {selectedPlayer.jersey_number && (
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatLabel}>TRIKOTNUMMER</Text>
                    <Text style={styles.modalStatValue}>#{selectedPlayer.jersey_number}</Text>
                  </View>
                )}
                {selectedPlayer.age && (
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatLabel}>ALTER</Text>
                    <Text style={styles.modalStatValue}>{selectedPlayer.age} J.</Text>
                  </View>
                )}
                {selectedPlayer.nationality && (
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatLabel}>NATIONALITÄT</Text>
                    <Text style={styles.modalStatValue}>{selectedPlayer.nationality}</Text>
                  </View>
                )}
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatLabel}>STATUS</Text>
                  <Text style={[styles.modalStatValue, { color: statusLabels[selectedPlayer.status]?.color ?? colors.textMuted }]}>
                    {statusLabels[selectedPlayer.status]?.label ?? selectedPlayer.status}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      <FullscreenImageModal
        uri={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </SafeAreaView>
  );
}
