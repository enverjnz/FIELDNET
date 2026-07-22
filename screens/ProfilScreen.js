import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, SafeAreaView, StatusBar,
  ScrollView, TouchableOpacity, Image, ActivityIndicator,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import {
  User, Shield, Users, Ruler, Weight,
  Flag, Hash, Calendar, Pencil, Check, X, Camera,
  Briefcase, Award, Clock, Target, Search, UserPlus, Trophy, ChevronRight, Images, Plus,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { fetchFollowedProfiles } from '../lib/profileFollowers';
import {
  formatDisplayDate, parseBirthDate, ageFromBirthDate, birthDateProfileFields,
} from '../lib/profileDates';
import { resolveProfileAvatarUrl } from '../lib/uploadImage';
import BirthDateField from '../components/BirthDateField';
import TeamProfileScreen from './TeamProfileScreen';
import PlayerProfileScreen from './PlayerProfileScreen';
import FullscreenImageModal from '../components/FullscreenImageModal';
import ProfileGallery from '../components/ProfileGallery';
import { useTheme } from '../context/ThemeContext';
import { createProfilStyles } from '../theme/profilStyles';

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P', 'LS'];
const GENDERS   = ['Männlich', 'Weiblich', 'Divers'];

const COACHING_ROLES = [
  'Head Coach', 'Offensive Coordinator', 'Defensive Coordinator',
  'Special Teams', 'Quarterback Coach', 'Line Coach', 'Assistenztrainer',
];
const LICENSES = ['Keine', 'Level 1', 'Level 2', 'GFL-Lizenz', 'DFB B-Lizenz', 'DFB A-Lizenz'];
const SPECIALIZATIONS = ['Offense', 'Defense', 'Special Teams', 'Allrounder'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Initials({ firstName, lastName, styles }) {
  const letters = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{letters}</Text>
    </View>
  );
}

function MembershipBadge({ status, styles, isDark }) {
  const config = {
    pending:       { bg: '#2A1F00', border: '#FBBF24', text: '#FBBF24', label: 'Anfrage läuft'         },
    coach_pending: { bg: '#2A1F00', border: '#FBBF24', text: '#FBBF24', label: 'Trainer-Anfrage läuft' },
    approved: isDark
      ? { bg: '#1A2336', border: '#5B7FD4', text: '#93B4FF', label: 'Mitglied' }
      : { bg: '#E8EDF8', border: '#1A2F6E', text: '#1A2F6E', label: 'Mitglied' },
    declined:      { bg: '#1F0A0A', border: '#FF4757', text: '#FF4757', label: 'Abgelehnt'             },
  }[status] ?? (isDark
    ? { bg: '#1A2336', border: '#2A3654', text: '#94A3B8', label: status }
    : { bg: '#F0F4FF', border: '#D1D8F0', text: '#6B7280', label: status });

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, styles }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value || '–'}</Text>
    </View>
  );
}

function EditField({ label, value, onChangeText, placeholder, keyboardType, multiline, styles, colors }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={[styles.editInput, multiline && styles.editInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfilScreen({ refreshKey = 0, onProfileSaved }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createProfilStyles(colors), [colors]);

  const [profile, setProfile]         = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [followedTeams, setFollowedTeams] = useState([]);
  const [followedProfiles, setFollowedProfiles] = useState([]);
  const [coachTeam, setCoachTeam]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [draft, setDraft]             = useState({});

  // Team search modal
  const [showTeamSearch, setShowTeamSearch]   = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchResults, setSearchResults]     = useState([]);
  const [isSearching, setIsSearching]         = useState(false);
  const [joiningTeamId, setJoiningTeamId]     = useState(null);
  const [profileTeamId, setProfileTeamId]     = useState(null);
  const [teamProfileId, setTeamProfileId]     = useState(null);
  const [viewedProfileId, setViewedProfileId] = useState(null);
  const [showFollowedList, setShowFollowedList] = useState(false);
  const [fullscreenAvatar, setFullscreenAvatar] = useState(null);
  const [profileTab, setProfileTab]           = useState('info'); // 'info' | 'gallery'
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        if (!silent) setLoading(false);
        return;
      }

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profErr) {
        console.warn('ProfilScreen profile error:', profErr.message);
      }
      setProfile(prof ?? null);

      try {
        const followed = await fetchFollowedProfiles(user.id);
        setFollowedProfiles(followed);
      } catch (e) {
        console.warn('ProfilScreen followed profiles:', e?.message);
        setFollowedProfiles([]);
      }

      if (prof?.role === 'fan') {
        const { data: follows } = await supabase
          .from('followers')
          .select('team_id, teams(id, name, short_name, town, avatar_teamlogo)')
          .eq('user_id', user.id);

        setFollowedTeams(
          (follows ?? [])
            .map((row) => row.teams)
            .filter(Boolean),
        );
        setMemberships([]);
        setCoachTeam(null);
      } else {
        setFollowedTeams([]);

        const { data: mem } = await supabase
          .from('team_memberships')
          .select('status, teams(id, name, avatar_teamlogo)')
          .eq('player_id', user.id);

        setMemberships(mem ?? []);

        const { data: managerRow } = await supabase
          .from('team_managers')
          .select('teams(id, name, short_name, town, avatar_teamlogo)')
          .eq('profile_id', user.id)
          .maybeSingle();

        setCoachTeam(managerRow?.teams ?? null);
      }
    } catch (e) {
      console.warn('ProfilScreen fetch error:', e?.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (refreshKey > 0) fetchProfile(true);
  }, [refreshKey, fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // ── Team search ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTeamSearch) return;
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('teams')
        .select('id, name, short_name, town, avatar_teamlogo')
        .or(`name.ilike.%${searchQuery.trim()}%,short_name.ilike.%${searchQuery.trim()}%,town.ilike.%${searchQuery.trim()}%`)
        .limit(20);
      setSearchResults(data ?? []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, showTeamSearch]);

  const openTeamSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setProfileTeamId(null);
    setShowTeamSearch(true);
    setTimeout(() => searchRef.current?.focus(), 300);
  };

  const joinTeam = async (team) => {
    if (profile?.role === 'fan') return;
    setJoiningTeamId(team.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('team_memberships').insert({
        player_id: user.id,
        team_id:   team.id,
        status:    'pending',
      });
      if (error) {
        if (error.code === '23505') {
          Alert.alert('Bereits angefragt', `Du hast bereits eine Anfrage bei ${team.name}.`);
        } else {
          throw error;
        }
      } else {
        setShowTeamSearch(false);
        Alert.alert('Anfrage gesendet', `Deine Beitrittsanfrage bei ${team.name} wurde gesendet.`);
        fetchProfile();
      }
    } catch (err) {
      Alert.alert('Fehler', err.message ?? 'Unbekannter Fehler');
    } finally {
      setJoiningTeamId(null);
    }
  };

  const FOLLOWED_PREVIEW_LIMIT = 4;

  const followedItems = useMemo(() => {
    const labelForRole = (role) => {
      if (role === 'fan') return 'Fan';
      if (role === 'coach') return 'Coach';
      return 'Spieler';
    };
    const teams = followedTeams.map((team) => ({
      key: `team-${team.id}`,
      type: 'team',
      id: team.id,
      name: team.name ?? 'Team',
      avatar: team.avatar_teamlogo ?? null,
      subtitle: [team.town, team.short_name].filter(Boolean).join(' · ') || 'Team',
    }));
    const people = followedProfiles.map((person) => {
      const name = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Unbekannt';
      return {
        key: `user-${person.id}`,
        type: 'profile',
        id: person.id,
        name,
        avatar: person.avatar ?? null,
        subtitle: [labelForRole(person.role), person.position].filter(Boolean).join(' · '),
      };
    });
    return [...teams, ...people];
  }, [followedTeams, followedProfiles]);

  const followedPreview = followedItems.slice(0, FOLLOWED_PREVIEW_LIMIT);

  // ── Edit helpers ────────────────────────────────────────────────────────────

  const startEditing = () => {
    setDraft({
      first_name:              profile.first_name              ?? '',
      last_name:               profile.last_name               ?? '',
      bio:                     profile.bio                     ?? '',
      avatar:                  profile.avatar                  ?? '',
      birthDate:               parseBirthDate(profile.birth_date),
      // Player
      position:                profile.position                ?? '',
      jersey_number:           profile.jersey_number           ?? '',
      gender:                  profile.gender                  ?? '',
      weight:                  profile.weight != null ? String(profile.weight) : '',
      height:                  profile.height != null ? String(profile.height) : '',
      nationality:             profile.nationality             ?? '',
      // Coach
      coaching_role:           profile.coaching_role           ?? '',
      coaching_license:        profile.coaching_license        ?? '',
      coaching_experience:     profile.coaching_experience != null ? String(profile.coaching_experience) : '',
      coaching_specialization: profile.coaching_specialization ?? '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const updateDraft = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const pickAvatar = async () => {
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
      updateDraft('avatar', result.assets[0].uri);
    }
  };

  const removeAvatar = () => {
    updateDraft('avatar', '');
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');

      let avatarUrl = null;
      if (draft.avatar?.trim()) {
        try {
          avatarUrl = await resolveProfileAvatarUrl(user.id, draft.avatar);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Unbekannter Upload-Fehler';
          throw new Error(
            msg.includes('row-level security') || msg.includes('row level security')
              ? 'Bild-Upload blockiert. Bitte sql/storage_policies.sql in Supabase ausführen.'
              : `Bild-Upload fehlgeschlagen: ${msg}`,
          );
        }
      }

      const { error } = await supabase.from('profiles').update({
        first_name:              draft.first_name.trim()              || null,
        last_name:               draft.last_name.trim()               || null,
        bio:                     draft.bio.trim()                     || null,
        avatar:                  avatarUrl,
        ...birthDateProfileFields(draft.birthDate),
        // Player
        position:                draft.position.trim()                || null,
        jersey_number:           draft.jersey_number.trim()           || null,
        gender:                  draft.gender.trim()                  || null,
        weight:                  draft.weight ? parseFloat(draft.weight)   : null,
        height:                  draft.height ? parseFloat(draft.height)   : null,
        nationality:             draft.nationality.trim()             || null,
        // Coach
        coaching_role:           draft.coaching_role?.trim()          || null,
        coaching_license:        draft.coaching_license?.trim()       || null,
        coaching_experience:     draft.coaching_experience ? parseInt(draft.coaching_experience, 10) : null,
        coaching_specialization: draft.coaching_specialization?.trim() || null,
      }).eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      onProfileSaved?.({
        avatar: avatarUrl,
        first_name: draft.first_name.trim() || null,
        last_name: draft.last_name.trim() || null,
      });
    } catch (err) {
      const msg = err?.message ?? 'Unbekannter Fehler.';
      Alert.alert(
        'Speichern fehlgeschlagen',
        msg.includes('row-level security') || msg.includes('row level security')
          ? 'Zugriff verweigert (RLS). Bitte sql/profile_team_rls.sql in Supabase ausführen.'
          : msg.includes('Network request failed')
            ? 'Keine Verbindung. Bitte prüfe deine Internetverbindung.'
            : msg,
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.avatarPlaceholder}><User size={48} color={colors.text} /></View>
          <Text style={styles.emptyTitle}>Kein Profil gefunden</Text>
          <Text style={styles.emptySubtitle}>Registriere dich, um dein Profil zu sehen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unbekannt';
  const displayAge = ageFromBirthDate(profile.birth_date) ?? (profile.age != null ? profile.age : null);
  const displayBirthDate = profile.birth_date
    ? formatDisplayDate(parseBirthDate(profile.birth_date))
    : null;

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    if (teamProfileId) {
      return (
        <TeamProfileScreen
          teamId={teamProfileId}
          readOnly={!(profile.role === 'coach' && coachTeam?.id === teamProfileId)}
          onBack={() => {
            setTeamProfileId(null);
            if (profile.role === 'fan') fetchProfile(true);
          }}
          onRequestJoin={
            profile.role === 'player'
              ? (team) => { joinTeam(team); setTeamProfileId(null); }
              : undefined
          }
          onFollowChange={profile.role === 'fan' ? () => fetchProfile(true) : undefined}
          onMembershipChange={() => fetchProfile(true)}
        />
      );
    }

    if (viewedProfileId) {
      return (
        <PlayerProfileScreen
          profileId={viewedProfileId}
          onBack={() => {
            setViewedProfileId(null);
            fetchProfile(true);
          }}
        />
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} colors={[colors.accent]} />}
        >

          {/* HEADER */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.editBtn} onPress={startEditing} activeOpacity={0.8}>
              <Pencil size={16} color={colors.text} />
              <Text style={styles.editBtnText}>Bearbeiten</Text>
            </TouchableOpacity>

            {profile.avatar ? (
              <TouchableOpacity
                onPress={() => setFullscreenAvatar(profile.avatar)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
              </TouchableOpacity>
            ) : (
              <Initials firstName={profile.first_name} lastName={profile.last_name} styles={styles} />
            )}

            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {profile.role === 'player' ? '🏈 Spieler' : profile.role === 'fan' ? '⭐ Fan' : '🎯 Coach'}
              </Text>
            </View>

            <Text style={styles.fullName}>{fullName}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          {/* TABS */}
          <View style={styles.profileTabs}>
            <TouchableOpacity
              style={[styles.profileTab, profileTab === 'info' && styles.profileTabActive]}
              onPress={() => setProfileTab('info')}
              activeOpacity={0.8}
            >
              <User size={16} color={profileTab === 'info' ? '#FFFFFF' : colors.textMuted} />
              <Text style={[styles.profileTabText, profileTab === 'info' && styles.profileTabTextActive]}>
                Profil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileTab, profileTab === 'gallery' && styles.profileTabActive]}
              onPress={() => setProfileTab('gallery')}
              activeOpacity={0.8}
            >
              <Images size={16} color={profileTab === 'gallery' ? '#FFFFFF' : colors.textMuted} />
              <Text style={[styles.profileTabText, profileTab === 'gallery' && styles.profileTabTextActive]}>
                Galerie
              </Text>
            </TouchableOpacity>
          </View>

          {profileTab === 'gallery' ? (
            <>
              <Text style={styles.sectionTitle}>GALERIE</Text>
              <ProfileGallery profileId={profile.id} canEdit />
            </>
          ) : (
          <>
          {/* TEAM */}
          {profile.role !== 'fan' ? (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>TEAM</Text>
                {profile.role === 'player' && memberships.length === 0 && (
                  <TouchableOpacity style={styles.joinBtn} onPress={openTeamSearch} activeOpacity={0.8}>
                    <UserPlus size={13} color={colors.accent} />
                    <Text style={styles.joinBtnText}>Team suchen</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.card}>
                {profile.role === 'coach' ? (
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
                      key={i}
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
            </>
          ) : null}

          {/* GEFOLGT */}
          <Text style={styles.sectionTitle}>GEFOLGT</Text>
          <View style={styles.card}>
            {followedItems.length === 0 ? (
              <View style={styles.emptyTeamBtn}>
                <View style={styles.emptyTeamIcon}>
                  <Users size={22} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTeamTitle}>Noch niemandem gefolgt</Text>
                  <Text style={styles.emptyTeamSub}>
                    {profile.role === 'fan'
                      ? 'Folge Teams und Nutzer, um sie hier zu sehen'
                      : 'Folge Nutzer, um sie hier zu sehen'}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.followedStackRow}
                onPress={() => setShowFollowedList(true)}
                activeOpacity={0.8}
              >
                <View style={styles.followedStack}>
                  {followedPreview.map((item, index) => {
                    const initial = (item.name ?? '?').slice(0, 1).toUpperCase();
                    return (
                      <View
                        key={item.key}
                        style={[
                          styles.followedAvatarWrap,
                          index > 0 && styles.followedAvatarOverlap,
                          { zIndex: followedPreview.length - index },
                        ]}
                      >
                        {item.avatar ? (
                          <Image
                            source={{ uri: item.avatar }}
                            style={styles.followedAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.followedAvatarPlaceholder}>
                            <Text style={styles.followedAvatarInitial}>{initial}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  <View
                    style={[
                      styles.followedPlus,
                      followedPreview.length > 0 && styles.followedAvatarOverlap,
                      { zIndex: followedPreview.length + 1 },
                    ]}
                  >
                    <Plus size={18} color={colors.text} />
                  </View>
                </View>
                {followedItems.length > FOLLOWED_PREVIEW_LIMIT ? (
                  <Text style={styles.followedCount}>
                    +{followedItems.length - FOLLOWED_PREVIEW_LIMIT}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
          </View>

          <Modal
            visible={showFollowedList}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFollowedList(false)}
          >
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Gefolgt</Text>
                <TouchableOpacity onPress={() => setShowFollowedList(false)} hitSlop={8}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalResults} showsVerticalScrollIndicator={false}>
                {followedItems.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>Noch niemandem gefolgt</Text>
                  </View>
                ) : (
                  <View style={styles.card}>
                    {followedItems.map((item, i) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.teamRow, i > 0 && styles.teamRowBorder]}
                        onPress={() => {
                          setShowFollowedList(false);
                          if (item.type === 'team') setTeamProfileId(item.id);
                          else setViewedProfileId(item.id);
                        }}
                        activeOpacity={0.75}
                      >
                        {item.avatar ? (
                          <Image
                            source={{ uri: item.avatar }}
                            style={styles.followedListAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.followedListAvatarPlaceholder}>
                            <Text style={styles.followedAvatarInitial}>
                              {(item.name ?? '?').slice(0, 1).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teamName} numberOfLines={1}>{item.name}</Text>
                          {item.subtitle ? (
                            <Text style={styles.resultMeta}>{item.subtitle}</Text>
                          ) : null}
                        </View>
                        <View style={styles.followBadge}>
                          <Text style={styles.followBadgeText}>
                            {item.type === 'team' ? 'Team' : 'Nutzer'}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </Modal>

          {/* TEAM SEARCH MODAL */}
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
                  if (profile.role === 'fan') fetchProfile(true);
                }}
                onRequestJoin={
                  profile.role === 'player'
                    ? (team) => {
                        joinTeam(team);
                        setProfileTeamId(null);
                      }
                    : undefined
                }
                onFollowChange={profile.role === 'fan' ? () => fetchProfile(true) : undefined}
                onMembershipChange={() => fetchProfile(true)}
              />
            ) : (
            <KeyboardAvoidingView
              style={{ flex: 1, backgroundColor: colors.background }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {profile.role === 'fan' ? 'Team folgen' : 'Team suchen'}
                </Text>
                <TouchableOpacity onPress={() => setShowTeamSearch(false)} hitSlop={8}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
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
                    ? <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                        <X size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    : null
                }
              </View>

              {/* Results */}
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
                    <Text style={styles.modalEmptyText}>Kein Team gefunden für „{searchQuery}"</Text>
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

          {/* SPIELER STATS */}
          {profile.role === 'player' && (
            <>
              <Text style={styles.sectionTitle}>SPIELERINFORMATIONEN</Text>
              <View style={styles.statsGrid}>
                <StatCard icon={<Shield size={18} color={colors.text} />}   label="Position"      value={profile.position} styles={styles} />
                <StatCard icon={<Hash size={18} color={colors.text} />}     label="Trikotnummer"  value={profile.jersey_number ? `#${profile.jersey_number}` : null} styles={styles} />
                <StatCard icon={<Calendar size={18} color={colors.text} />} label="Geburtsdatum"  value={displayBirthDate} styles={styles} />
                <StatCard icon={<Calendar size={18} color={colors.text} />} label="Alter"         value={displayAge != null ? `${displayAge} Jahre` : null} styles={styles} />
                <StatCard icon={<User size={18} color={colors.text} />}     label="Geschlecht"    value={profile.gender} styles={styles} />
                <StatCard icon={<Ruler size={18} color={colors.text} />}    label="Größe"         value={profile.height ? `${profile.height} cm` : null} styles={styles} />
                <StatCard icon={<Weight size={18} color={colors.text} />}   label="Gewicht"       value={profile.weight ? `${profile.weight} kg` : null} styles={styles} />
                <StatCard icon={<Flag size={18} color={colors.text} />}     label="Nationalität"  value={profile.nationality} styles={styles} />
              </View>
            </>
          )}

          {/* TRAINER STATS */}
          {profile.role === 'coach' && (
            <>
              <Text style={styles.sectionTitle}>TRAINERINFORMATIONEN</Text>
              <View style={styles.statsGrid}>
                <StatCard icon={<Briefcase size={18} color={colors.text} />} label="Funktion"         value={profile.coaching_role} styles={styles} />
                <StatCard icon={<Target size={18} color={colors.text} />}    label="Spezialisierung"  value={profile.coaching_specialization} styles={styles} />
                <StatCard icon={<Award size={18} color={colors.text} />}     label="Lizenz"           value={profile.coaching_license} styles={styles} />
                <StatCard icon={<Clock size={18} color={colors.text} />}     label="Erfahrung"        value={profile.coaching_experience != null ? `${profile.coaching_experience} Jahre` : null} styles={styles} />
              </View>
            </>
          )}
          </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <FullscreenImageModal
          uri={fullscreenAvatar}
          onClose={() => setFullscreenAvatar(null)}
        />
      </SafeAreaView>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* EDIT HEADER */}
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>Profil bearbeiten</Text>
          <TouchableOpacity onPress={cancelEditing} style={styles.cancelIcon} activeOpacity={0.7}>
            <X size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* AVATAR */}
        <View style={styles.avatarEditWrap}>
          <View style={styles.avatarEditTouch}>
            {draft.avatar ? (
              <>
                <TouchableOpacity
                  onPress={() => setFullscreenAvatar(draft.avatar)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: draft.avatar }} style={styles.avatarImg} />
                </TouchableOpacity>
                <TouchableOpacity onPress={pickAvatar} style={styles.avatarEditOverlay} activeOpacity={0.8}>
                  <Camera size={22} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
                <Initials firstName={draft.first_name} lastName={draft.last_name} styles={styles} />
                <View style={styles.avatarEditOverlay}>
                  <Camera size={22} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.avatarEditHint}>Foto ändern</Text>
          {!!draft.avatar && (
            <TouchableOpacity onPress={removeAvatar} style={styles.removeAvatarBtn} activeOpacity={0.7}>
              <Text style={styles.removeAvatarText}>Bild entfernen</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PERSÖNLICHE DATEN */}
        <Text style={styles.sectionTitle}>PERSÖNLICHE DATEN</Text>
        <View style={styles.editCard}>
          <EditField label="Vorname"  value={draft.first_name}  onChangeText={(v) => updateDraft('first_name', v)}  placeholder="Max" styles={styles} colors={colors} />
          <EditField label="Nachname" value={draft.last_name}   onChangeText={(v) => updateDraft('last_name', v)}   placeholder="Mustermann" styles={styles} colors={colors} />
          <EditField label="Bio"      value={draft.bio}         onChangeText={(v) => updateDraft('bio', v)}         placeholder="Erzähl etwas über dich…" multiline styles={styles} colors={colors} />
          <BirthDateField
            value={draft.birthDate ?? null}
            onChange={(birthDate) => updateDraft('birthDate', birthDate)}
          />
        </View>

        {/* SPIELERINFORMATIONEN */}
        {profile.role === 'player' && (
          <>
            <Text style={styles.sectionTitle}>SPIELERINFORMATIONEN</Text>
            <View style={styles.editCard}>

              {/* Position chips */}
              <Text style={styles.editLabel}>POSITION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.chip, draft.position === pos && styles.chipActive]}
                    onPress={() => updateDraft('position', draft.position === pos ? '' : pos)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, draft.position === pos && styles.chipTextActive]}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <EditField label="Trikotnummer" value={draft.jersey_number} onChangeText={(v) => updateDraft('jersey_number', v)} placeholder="z.B. 12" keyboardType="numeric" styles={styles} colors={colors} />

              {/* Gender chips */}
              <Text style={styles.editLabel}>GESCHLECHT</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, draft.gender === g && styles.chipActive]}
                    onPress={() => updateDraft('gender', draft.gender === g ? '' : g)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, draft.gender === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <EditField label="Nationalität" value={draft.nationality} onChangeText={(v) => updateDraft('nationality', v)} placeholder="z.B. Deutsch" styles={styles} colors={colors} />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <EditField label="Gewicht (kg)" value={draft.weight} onChangeText={(v) => updateDraft('weight', v)} placeholder="z.B. 85"  keyboardType="decimal-pad" styles={styles} colors={colors} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Größe (cm)"   value={draft.height} onChangeText={(v) => updateDraft('height', v)} placeholder="z.B. 182" keyboardType="decimal-pad" styles={styles} colors={colors} />
                </View>
              </View>

            </View>
          </>
        )}

        {/* TRAINERINFORMATIONEN */}
        {profile.role === 'coach' && (
          <>
            <Text style={styles.sectionTitle}>TRAINERINFORMATIONEN</Text>
            <View style={styles.editCard}>

              {/* Coaching Role chips */}
              <Text style={styles.editLabel}>FUNKTION IM TEAM</Text>
              <View style={styles.chipGrid}>
                {COACHING_ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.chip, draft.coaching_role === role && styles.chipActive]}
                    onPress={() => updateDraft('coaching_role', draft.coaching_role === role ? '' : role)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, draft.coaching_role === role && styles.chipTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Specialization chips */}
              <Text style={styles.editLabel}>SPEZIALISIERUNG</Text>
              <View style={styles.chipGrid}>
                {SPECIALIZATIONS.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.chip, draft.coaching_specialization === spec && styles.chipActive]}
                    onPress={() => updateDraft('coaching_specialization', draft.coaching_specialization === spec ? '' : spec)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, draft.coaching_specialization === spec && styles.chipTextActive]}>{spec}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* License chips */}
              <Text style={styles.editLabel}>LIZENZ / QUALIFIKATION</Text>
              <View style={styles.chipGrid}>
                {LICENSES.map((lic) => (
                  <TouchableOpacity
                    key={lic}
                    style={[styles.chip, draft.coaching_license === lic && styles.chipActive]}
                    onPress={() => updateDraft('coaching_license', draft.coaching_license === lic ? '' : lic)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, draft.coaching_license === lic && styles.chipTextActive]}>{lic}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <EditField
                label="Coaching-Erfahrung (Jahre)"
                value={draft.coaching_experience}
                onChangeText={(v) => updateDraft('coaching_experience', v)}
                placeholder="z.B. 5"
                keyboardType="numeric"
                styles={styles}
                colors={colors}
              />

            </View>
          </>
        )}

        {/* SAVE / CANCEL */}
        <View style={styles.saveRow}>
          <TouchableOpacity style={styles.btnCancel} onPress={cancelEditing} activeOpacity={0.85} disabled={saving}>
            <Text style={styles.btnCancelText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSave, saving && styles.btnDisabled]}
            onPress={saveProfile}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" />
              : <><Check size={16} color="#FFFFFF" /><Text style={styles.btnSaveText}>Speichern</Text></>
            }
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FullscreenImageModal
        uri={fullscreenAvatar}
        onClose={() => setFullscreenAvatar(null)}
      />
    </SafeAreaView>
  );
}
