import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X, User, Star, Users, Check, Search, UserPlus, Trophy, ChevronRight,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { unfollowTeam } from '../lib/teamFollowers';
import {
  formatDisplayDate,
  parseBirthDate,
} from '../lib/profileDates';
import { useTheme } from '../context/ThemeContext';
import TeamProfileScreen from './TeamProfileScreen';

type RoleKey = 'player' | 'fan' | 'coach';

type TeamRow = {
  id: string;
  name: string;
  short_name?: string | null;
  town?: string | null;
  avatar_teamlogo?: string | null;
};

type MembershipRow = {
  status: string;
  teams: TeamRow | null;
};

type Props = {
  onBack: () => void;
  onRoleChanged?: (role: RoleKey) => void;
  onTeamsChanged?: () => void;
};

const ROLES: Array<{
  key: RoleKey;
  label: string;
  description: string;
  Icon: typeof User;
}> = [
  {
    key: 'player',
    label: 'Spieler',
    description: 'Aktives Teammitglied mit Profil und Statistiken.',
    Icon: User,
  },
  {
    key: 'coach',
    label: 'Trainer / Coach',
    description: 'Teamleitung und Vereinsfunktionen.',
    Icon: Users,
  },
  {
    key: 'fan',
    label: 'Fan',
    description: 'Teams folgen und Community nutzen.',
    Icon: Star,
  },
];

function MembershipBadge({
  status,
  styles,
  isDark,
}: {
  status: string;
  styles: ReturnType<typeof createStyles>;
  isDark: boolean;
}) {
  const config = ({
    pending: { bg: '#2A1F00', border: '#FBBF24', text: '#FBBF24', label: 'Anfrage läuft' },
    coach_pending: { bg: '#2A1F00', border: '#FBBF24', text: '#FBBF24', label: 'Trainer-Anfrage läuft' },
    approved: isDark
      ? { bg: '#1A2336', border: '#5B7FD4', text: '#93B4FF', label: 'Mitglied' }
      : { bg: '#E8EDF8', border: '#1A2F6E', text: '#1A2F6E', label: 'Mitglied' },
    declined: { bg: '#1F0A0A', border: '#FF4757', text: '#FF4757', label: 'Abgelehnt' },
  } as Record<string, { bg: string; border: string; text: string; label: string }>)[status]
    ?? (isDark
      ? { bg: '#1A2336', border: '#2A3654', text: '#94A3B8', label: status }
      : { bg: '#F0F4FF', border: '#D1D8F0', text: '#6B7280', label: status });

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useTheme>['colors']) {
  const joinBorder = c.mode === 'dark' ? '#5A2030' : '#FECACA';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { color: c.text, fontSize: 22, fontWeight: '900' },
    scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
    sectionTitle: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      marginBottom: 24,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    infoRowBorder: { borderTopWidth: 1, borderTopColor: c.border },
    infoLabel: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
    infoValue: {
      color: c.text,
      fontSize: 13,
      fontWeight: '700',
      maxWidth: '60%',
      textAlign: 'right',
    },
    hint: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 12,
      marginTop: -4,
    },
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    roleCardFirst: { borderTopWidth: 0 },
    roleCardActive: {
      backgroundColor: c.surface,
    },
    roleIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleIconWrapActive: {
      backgroundColor: c.chipSelectedBg,
      borderColor: c.chipSelectedBg,
    },
    roleBody: { flex: 1 },
    roleLabel: { color: c.text, fontSize: 15, fontWeight: '800' },
    roleDesc: { color: c.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
    checkWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    joinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: c.signOutBg,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1.5,
      borderColor: joinBorder,
    },
    joinBtnText: { color: c.accent, fontSize: 11, fontWeight: '800' },

    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    teamRowWithAction: {
      paddingRight: 8,
      paddingVertical: 0,
      paddingHorizontal: 0,
      gap: 0,
    },
    teamRowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    teamRowBorder: { borderTopWidth: 1, borderTopColor: c.border },
    teamLogo: { width: 36, height: 36, borderRadius: 8 },
    teamLogoPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    teamName: { flex: 1, color: c.text, fontSize: 14, fontWeight: '700' },
    resultMeta: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    coachTeamBadge: {
      backgroundColor: c.surface,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    coachTeamBadgeText: { color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    followBadge: {
      backgroundColor: c.surface,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    followBadgeText: { color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    unfollowBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

    emptyTeamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
    },
    emptyTeamIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyTeamTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    emptyTeamSub: { color: c.textMuted, fontSize: 11, marginTop: 2 },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '900' },
    modalSearchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: 14,
      marginHorizontal: 16,
      marginVertical: 12,
    },
    modalSearchInput: {
      flex: 1,
      color: c.text,
      fontSize: 15,
      paddingVertical: 13,
    },
    modalResults: { paddingHorizontal: 16, paddingBottom: 40 },
    modalEmpty: { alignItems: 'center', paddingTop: 60 },
    modalEmptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    resultLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: c.card },
    resultLogoPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultName: { color: c.text, fontSize: 15, fontWeight: '700' },
  });
}

export default function AccountInfoScreen({ onBack, onRoleChanged, onTeamsChanged }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleKey>('player');
  const [birthDateLabel, setBirthDateLabel] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState('–');
  const [userId, setUserId] = useState<string | null>(null);

  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [followedTeams, setFollowedTeams] = useState<TeamRow[]>([]);
  const [coachTeam, setCoachTeam] = useState<TeamRow | null>(null);

  const [showTeamSearch, setShowTeamSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeamRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [profileTeamId, setProfileTeamId] = useState<string | null>(null);
  const [teamProfileId, setTeamProfileId] = useState<string | null>(null);

  const searchRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyTeamsChanged = useCallback(() => {
    onTeamsChanged?.();
  }, [onTeamsChanged]);

  const loadTeams = useCallback(async (uid: string, currentRole: RoleKey) => {
    if (currentRole === 'fan') {
      const { data: follows } = await supabase
        .from('followers')
        .select('team_id, teams(id, name, short_name, town, avatar_teamlogo)')
        .eq('user_id', uid);

      setFollowedTeams(
        (follows ?? [])
          .map((row: { teams?: TeamRow | TeamRow[] | null }) => {
            const t = row.teams;
            return Array.isArray(t) ? t[0] ?? null : t ?? null;
          })
          .filter(Boolean) as TeamRow[],
      );
      setMemberships([]);
      setCoachTeam(null);
      return;
    }

    setFollowedTeams([]);

    const { data: mem } = await supabase
      .from('team_memberships')
      .select('status, teams(id, name, avatar_teamlogo)')
      .eq('player_id', uid);

    setMemberships(
      (mem ?? []).map((row: { status: string; teams?: TeamRow | TeamRow[] | null }) => ({
        status: row.status,
        teams: Array.isArray(row.teams) ? row.teams[0] ?? null : row.teams ?? null,
      })),
    );

    const { data: managerRow } = await supabase
      .from('team_managers')
      .select('teams(id, name, short_name, town, avatar_teamlogo)')
      .eq('profile_id', uid)
      .maybeSingle();

    const team = managerRow?.teams;
    setCoachTeam(
      (Array.isArray(team) ? team[0] ?? null : team ?? null) as TeamRow | null,
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, birth_date, created_at')
        .eq('id', user.id)
        .maybeSingle();

      const nextRole = (profile?.role || user.user_metadata?.role || 'player') as RoleKey;
      const safeRole = (['player', 'fan', 'coach'].includes(nextRole) ? nextRole : 'player') as RoleKey;
      setRole(safeRole);

      if (profile?.birth_date) {
        setBirthDateLabel(formatDisplayDate(parseBirthDate(profile.birth_date)));
      } else {
        setBirthDateLabel(null);
      }

      setMemberSince(
        profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString('de-DE', {
              month: 'long',
              year: 'numeric',
            })
          : '–',
      );

      await loadTeams(user.id, safeRole);
    } catch (e) {
      console.warn('AccountInfoScreen:', (e as Error)?.message);
    } finally {
      setLoading(false);
    }
  }, [loadTeams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showTeamSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('teams')
        .select('id, name, short_name, town, avatar_teamlogo')
        .or(`name.ilike.%${searchQuery.trim()}%,short_name.ilike.%${searchQuery.trim()}%,town.ilike.%${searchQuery.trim()}%`)
        .limit(20);
      setSearchResults((data ?? []) as TeamRow[]);
      setIsSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, showTeamSearch]);

  const openTeamSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setProfileTeamId(null);
    setShowTeamSearch(true);
    setTimeout(() => searchRef.current?.focus(), 300);
  };

  const joinTeam = async (team: TeamRow) => {
    if (role === 'fan') return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');
      const { error } = await supabase.from('team_memberships').insert({
        player_id: user.id,
        team_id: team.id,
        status: 'pending',
      });
      if (error) {
        if (error.code === '23505') {
          Alert.alert('Bereits angefragt', `Du hast bereits eine Anfrage bei ${team.name}.`);
        } else {
          throw error;
        }
      } else {
        setShowTeamSearch(false);
        setProfileTeamId(null);
        Alert.alert('Anfrage gesendet', `Deine Beitrittsanfrage bei ${team.name} wurde gesendet.`);
        await loadTeams(user.id, role);
        notifyTeamsChanged();
      }
    } catch (err) {
      Alert.alert('Fehler', (err as Error)?.message ?? 'Unbekannter Fehler');
    }
  };

  const handleUnfollowTeam = async (team: TeamRow) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');
      await unfollowTeam(user.id, team.id);
      await loadTeams(user.id, role);
      notifyTeamsChanged();
    } catch (err) {
      Alert.alert('Fehler', (err as Error)?.message ?? 'Unbekannter Fehler');
    }
  };

  const changeRole = (next: RoleKey) => {
    if (next === role || saving) return;

    Alert.alert(
      'Rolle ändern?',
      `Zu „${ROLES.find((r) => r.key === next)?.label ?? next}“ wechseln?\n\nDeine Teamzugehörigkeiten bleiben erhalten.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Wechseln',
          onPress: async () => {
            setSaving(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Nicht eingeloggt.');

              const { error } = await supabase
                .from('profiles')
                .update({ role: next })
                .eq('id', user.id);

              if (error) throw error;

              await supabase.auth.updateUser({ data: { role: next } });

              setRole(next);
              await loadTeams(user.id, next);
              onRoleChanged?.(next);
              notifyTeamsChanged();
              Alert.alert('Gespeichert', 'Deine Rolle wurde aktualisiert.');
            } catch (e) {
              Alert.alert('Fehler', (e as Error)?.message ?? 'Rolle konnte nicht geändert werden.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  if (teamProfileId) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        <TeamProfileScreen
          teamId={teamProfileId}
          readOnly={!(role === 'coach' && coachTeam?.id === teamProfileId)}
          onBack={() => {
            setTeamProfileId(null);
            if (userId) loadTeams(userId, role);
            notifyTeamsChanged();
          }}
          onRequestJoin={
            role === 'player'
              ? (team: TeamRow) => {
                  joinTeam(team);
                  setTeamProfileId(null);
                }
              : undefined
          }
          onFollowChange={role === 'fan' ? () => {
            if (userId) loadTeams(userId, role);
            notifyTeamsChanged();
          } : undefined}
          onMembershipChange={() => {
            if (userId) loadTeams(userId, role);
            notifyTeamsChanged();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Kontoinformationen</Text>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>KONTO</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-Mail</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{email || '–'}</Text>
            </View>
            {birthDateLabel ? (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>Geburtsdatum</Text>
                <Text style={styles.infoValue}>{birthDateLabel}</Text>
              </View>
            ) : null}
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Mitglied seit</Text>
              <Text style={styles.infoValue}>{memberSince}</Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              {role === 'fan' ? 'GEFOLGTE TEAMS' : 'TEAMZUGEHÖRIGKEIT'}
            </Text>
            {role === 'player' && memberships.length === 0 && (
              <TouchableOpacity style={styles.joinBtn} onPress={openTeamSearch} activeOpacity={0.8}>
                <UserPlus size={13} color={colors.accent} />
                <Text style={styles.joinBtnText}>Team suchen</Text>
              </TouchableOpacity>
            )}
            {role === 'fan' && (
              <TouchableOpacity style={styles.joinBtn} onPress={openTeamSearch} activeOpacity={0.8}>
                <Star size={13} color={colors.accent} />
                <Text style={styles.joinBtnText}>Team folgen</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            {role === 'coach' ? (
              coachTeam ? (
                <TouchableOpacity
                  style={styles.teamRow}
                  onPress={() => setTeamProfileId(coachTeam.id)}
                  activeOpacity={0.75}
                >
                  {coachTeam.avatar_teamlogo
                    ? <Image source={{ uri: coachTeam.avatar_teamlogo }} style={styles.teamLogo} resizeMode="contain" />
                    : <View style={styles.teamLogoPlaceholder}><Trophy size={18} color={colors.text} /></View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName} numberOfLines={1}>{coachTeam.name}</Text>
                    <Text style={styles.resultMeta}>
                      {[coachTeam.town, coachTeam.short_name].filter(Boolean).join(' · ') || 'Coach-Team'}
                    </Text>
                  </View>
                  <View style={styles.coachTeamBadge}>
                    <Text style={styles.coachTeamBadgeText}>Coach</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyTeamBtn}>
                  <View style={styles.emptyTeamIcon}>
                    <Trophy size={22} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyTeamTitle}>Noch kein Team</Text>
                    <Text style={styles.emptyTeamSub}>Lege dein Team über die Vereinsverwaltung an</Text>
                  </View>
                </View>
              )
            ) : role === 'fan' ? (
              followedTeams.length === 0 ? (
                <TouchableOpacity style={styles.emptyTeamBtn} onPress={openTeamSearch} activeOpacity={0.8}>
                  <View style={styles.emptyTeamIcon}>
                    <Star size={22} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyTeamTitle}>Noch keine Teams</Text>
                    <Text style={styles.emptyTeamSub}>Tippe hier, um Teams zu suchen und zu folgen</Text>
                  </View>
                  <Search size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                followedTeams.map((team, i) => (
                  <View
                    key={team.id}
                    style={[styles.teamRow, styles.teamRowWithAction, i > 0 && styles.teamRowBorder]}
                  >
                    <TouchableOpacity
                      style={styles.teamRowMain}
                      onPress={() => setTeamProfileId(team.id)}
                      activeOpacity={0.75}
                    >
                      {team.avatar_teamlogo
                        ? <Image source={{ uri: team.avatar_teamlogo }} style={styles.teamLogo} resizeMode="contain" />
                        : <View style={styles.teamLogoPlaceholder}><Star size={18} color={colors.text} /></View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                        <Text style={styles.resultMeta}>
                          {[team.town, team.short_name].filter(Boolean).join(' · ') || 'Team'}
                        </Text>
                      </View>
                      <View style={styles.followBadge}>
                        <Text style={styles.followBadgeText}>Folge ich</Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUnfollowTeam(team)}
                      hitSlop={8}
                      style={styles.unfollowBtn}
                    >
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )
            ) : memberships.length === 0 ? (
              <TouchableOpacity style={styles.emptyTeamBtn} onPress={openTeamSearch} activeOpacity={0.8}>
                <View style={styles.emptyTeamIcon}>
                  <Trophy size={22} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTeamTitle}>Noch kein Team</Text>
                  <Text style={styles.emptyTeamSub}>Tippe hier, um ein Team zu suchen und beizutreten</Text>
                </View>
                <Search size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              memberships.map((m, i) => (
                <TouchableOpacity
                  key={`${m.teams?.id ?? i}-${m.status}`}
                  style={[styles.teamRow, i > 0 && styles.teamRowBorder]}
                  onPress={() => m.teams?.id && setTeamProfileId(m.teams.id)}
                  activeOpacity={0.75}
                >
                  {m.teams?.avatar_teamlogo
                    ? <Image source={{ uri: m.teams.avatar_teamlogo }} style={styles.teamLogo} />
                    : <View style={styles.teamLogoPlaceholder}><Users size={18} color={colors.text} /></View>
                  }
                  <Text style={styles.teamName} numberOfLines={1}>{m.teams?.name ?? '–'}</Text>
                  <MembershipBadge status={m.status} styles={styles} isDark={isDark} />
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>

          <Text style={styles.sectionTitle}>ROLLE</Text>
          <Text style={styles.hint}>
            Beim Rollenwechsel bleiben Teammitgliedschaften und bestehende Zuordnungen unverändert.
          </Text>
          <View style={styles.card}>
            {ROLES.map(({ key, label, description, Icon }, index) => {
              const active = role === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.roleCard,
                    index === 0 && styles.roleCardFirst,
                    active && styles.roleCardActive,
                  ]}
                  onPress={() => changeRole(key)}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
                    <Icon size={18} color={active ? '#FFFFFF' : colors.text} />
                  </View>
                  <View style={styles.roleBody}>
                    <Text style={styles.roleLabel}>{label}</Text>
                    <Text style={styles.roleDesc}>{description}</Text>
                  </View>
                  <View style={styles.checkWrap}>
                    {saving && active ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : active ? (
                      <Check size={18} color={colors.accent} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showTeamSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowTeamSearch(false); setProfileTeamId(null); }}
      >
        {profileTeamId ? (
          <TeamProfileScreen
            teamId={profileTeamId}
            readOnly
            onBack={() => {
              setProfileTeamId(null);
              if (role === 'fan' && userId) loadTeams(userId, role);
            }}
            onRequestJoin={
              role === 'player'
                ? (team: TeamRow) => {
                    joinTeam(team);
                    setProfileTeamId(null);
                  }
                : undefined
            }
            onFollowChange={role === 'fan' ? () => {
              if (userId) loadTeams(userId, role);
              notifyTeamsChanged();
            } : undefined}
            onMembershipChange={() => {
              if (userId) loadTeams(userId, role);
              notifyTeamsChanged();
            }}
          />
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {role === 'fan' ? 'Team folgen' : 'Team suchen'}
              </Text>
              <TouchableOpacity onPress={() => setShowTeamSearch(false)} hitSlop={8}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBar}>
              <Search size={17} color={colors.textMuted} />
              <TextInput
                ref={searchRef}
                style={styles.modalSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Teamname eingeben…"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                autoCorrect={false}
              />
              {isSearching
                ? <ActivityIndicator size="small" color={colors.text} />
                : searchQuery.length > 0
                  ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )
                  : null}
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.modalResults}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {searchQuery.trim() === '' ? (
                <View style={styles.modalEmpty}>
                  <Search size={36} color={colors.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.modalEmptyText}>Gib einen Teamnamen ein, um zu suchen</Text>
                </View>
              ) : searchResults.length === 0 && !isSearching ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>Kein Team gefunden für „{searchQuery}“</Text>
                </View>
              ) : (
                searchResults.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.resultRow}
                    onPress={() => setProfileTeamId(team.id)}
                    activeOpacity={0.75}
                  >
                    {team.avatar_teamlogo
                      ? <Image source={{ uri: team.avatar_teamlogo }} style={styles.resultLogo} resizeMode="contain" />
                      : <View style={styles.resultLogoPlaceholder}><Trophy size={16} color={colors.text} /></View>
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{team.name}</Text>
                      <Text style={styles.resultMeta}>
                        {[team.town, team.short_name].filter(Boolean).join(' · ') || 'Kein Ort angegeben'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
