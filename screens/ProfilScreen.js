import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TouchableOpacity, Image, ActivityIndicator,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import {
  User, Shield, Users, Ruler, Weight,
  Flag, Hash, Calendar, Pencil, Check, X, Camera,
  Briefcase, Award, Clock, Target, Search, UserPlus, Trophy, ChevronRight,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import TeamProfileScreen from './TeamProfileScreen';

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

function Initials({ firstName, lastName }) {
  const letters = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{letters}</Text>
    </View>
  );
}

function MembershipBadge({ status }) {
  const config = {
    pending:       { bg: '#2A1F00', border: '#FBBF24', text: '#FBBF24', label: 'Anfrage läuft'         },
    coach_pending: { bg: '#2A1F00', border: '#FBBF24', text: '#FBBF24', label: 'Trainer-Anfrage läuft' },
    approved:      { bg: '#E8EDF8', border: '#1A2F6E', text: '#1A2F6E', label: 'Mitglied'              },
    declined:      { bg: '#1F0A0A', border: '#FF4757', text: '#FF4757', label: 'Abgelehnt'             },
  }[status] ?? { bg: '#F0F4FF', border: '#D1D8F0', text: '#6B7280', label: status };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value || '–'}</Text>
    </View>
  );
}

function EditField({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={[styles.editInput, multiline && styles.editInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#4A5568"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const [profile, setProfile]         = useState(null);
  const [email, setEmail]             = useState('');
  const [memberships, setMemberships] = useState([]);
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
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setLoading(false); return; }

      setEmail(user.email ?? '');

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profErr && prof) setProfile(prof);

      const { data: mem } = await supabase
        .from('team_memberships')
        .select('status, teams(id, name, avatar_teamlogo)')
        .eq('player_id', user.id);

      if (mem) setMemberships(mem);

      const { data: managerRow } = await supabase
        .from('team_managers')
        .select('teams(id, name, short_name, town, avatar_teamlogo)')
        .eq('profile_id', user.id)
        .maybeSingle();

      setCoachTeam(managerRow?.teams ?? null);
    } catch (e) {
      console.warn('ProfilScreen fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

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

  // ── Edit helpers ────────────────────────────────────────────────────────────

  const startEditing = () => {
    setDraft({
      first_name:              profile.first_name              ?? '',
      last_name:               profile.last_name               ?? '',
      bio:                     profile.bio                     ?? '',
      avatar:                  profile.avatar                  ?? '',
      // Player
      position:                profile.position                ?? '',
      jersey_number:           profile.jersey_number           ?? '',
      age:                     profile.age    != null ? String(profile.age)    : '',
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

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');

      const { error } = await supabase.from('profiles').update({
        first_name:              draft.first_name.trim()              || null,
        last_name:               draft.last_name.trim()               || null,
        bio:                     draft.bio.trim()                     || null,
        avatar:                  draft.avatar                         || null,
        // Player
        position:                draft.position.trim()                || null,
        jersey_number:           draft.jersey_number.trim()           || null,
        age:                     draft.age    ? parseInt(draft.age, 10)    : null,
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
    } catch (err) {
      Alert.alert(
        'Speichern fehlgeschlagen',
        err?.message?.includes('Network request failed')
          ? 'Keine Verbindung. Bitte prüfe deine Internetverbindung.'
          : err?.message ?? 'Unbekannter Fehler.',
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
          <ActivityIndicator size="large" color="#1A2F6E" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.avatarPlaceholder}><User size={40} color="#1A2F6E" /></View>
          <Text style={styles.emptyTitle}>Kein Profil gefunden</Text>
          <Text style={styles.emptySubtitle}>Registriere dich, um dein Profil zu sehen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unbekannt';
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : '–';

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    if (teamProfileId) {
      return (
        <TeamProfileScreen
          teamId={teamProfileId}
          readOnly={!(profile.role === 'coach' && coachTeam?.id === teamProfileId)}
          onBack={() => setTeamProfileId(null)}
          onRequestJoin={
            profile.role !== 'coach'
              ? (team) => { joinTeam(team); setTeamProfileId(null); }
              : undefined
          }
        />
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B} colors={[B]} />}
        >

          {/* HEADER */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.editBtn} onPress={startEditing} activeOpacity={0.8}>
              <Pencil size={16} color="#1A2F6E" />
              <Text style={styles.editBtnText}>Bearbeiten</Text>
            </TouchableOpacity>

            {profile.avatar
              ? <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
              : <Initials firstName={profile.first_name} lastName={profile.last_name} />
            }

            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {profile.role === 'player' ? '🏈 Spieler' : profile.role === 'fan' ? '⭐ Fan' : '🎯 Coach'}
              </Text>
            </View>

            <Text style={styles.fullName}>{fullName}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          {/* TEAM */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>TEAM</Text>
            {profile.role !== 'coach' && (
              <TouchableOpacity style={styles.joinBtn} onPress={openTeamSearch} activeOpacity={0.8}>
                <UserPlus size={13} color={R} />
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
                    : <View style={styles.teamLogoPlaceholder}><Trophy size={18} color={B} /></View>
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
                  <ChevronRight size={18} color={MUTED} />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyTeamBtn}>
                  <View style={styles.emptyTeamIcon}>
                    <Trophy size={22} color={B} />
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
                  <Trophy size={22} color={B} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTeamTitle}>Noch kein Team</Text>
                  <Text style={styles.emptyTeamSub}>Tippe hier, um ein Team zu suchen und beizutreten</Text>
                </View>
                <Search size={16} color={MUTED} />
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
                    : <View style={styles.teamLogoPlaceholder}><Users size={18} color="#1A2F6E" /></View>
                  }
                  <Text style={styles.teamName} numberOfLines={1}>{m.teams?.name ?? '–'}</Text>
                  <MembershipBadge status={m.status} />
                  <ChevronRight size={18} color={MUTED} />
                </TouchableOpacity>
              ))
            )}
          </View>

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
                onBack={() => setProfileTeamId(null)}
                onRequestJoin={(team) => {
                  joinTeam(team);
                  setProfileTeamId(null);
                }}
              />
            ) : (
            <KeyboardAvoidingView
              style={{ flex: 1, backgroundColor: '#FFFFFF' }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Team suchen</Text>
                <TouchableOpacity onPress={() => setShowTeamSearch(false)} hitSlop={8}>
                  <X size={22} color={B} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.modalSearchBar}>
                <Search size={17} color={MUTED} />
                <TextInput
                  ref={searchRef}
                  style={styles.modalSearchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Teamname eingeben…"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {isSearching
                  ? <ActivityIndicator size="small" color={B} />
                  : searchQuery.length > 0
                    ? <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                        <X size={16} color={MUTED} />
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
                    <Search size={36} color={MUTED} style={{ marginBottom: 12 }} />
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
                        : <View style={styles.resultLogoPlaceholder}><Trophy size={16} color={B} /></View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{team.name}</Text>
                        <Text style={styles.resultMeta}>
                          {[team.town, team.short_name].filter(Boolean).join(' · ') || 'Kein Ort angegeben'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={MUTED} />
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
                <StatCard icon={<Shield size={18} color="#1A2F6E" />}   label="Position"      value={profile.position} />
                <StatCard icon={<Hash size={18} color="#1A2F6E" />}     label="Trikotnummer"  value={profile.jersey_number ? `#${profile.jersey_number}` : null} />
                <StatCard icon={<Calendar size={18} color="#1A2F6E" />} label="Alter"         value={profile.age ? `${profile.age} Jahre` : null} />
                <StatCard icon={<User size={18} color="#1A2F6E" />}     label="Geschlecht"    value={profile.gender} />
                <StatCard icon={<Ruler size={18} color="#1A2F6E" />}    label="Größe"         value={profile.height ? `${profile.height} cm` : null} />
                <StatCard icon={<Weight size={18} color="#1A2F6E" />}   label="Gewicht"       value={profile.weight ? `${profile.weight} kg` : null} />
                <StatCard icon={<Flag size={18} color="#1A2F6E" />}     label="Nationalität"  value={profile.nationality} />
              </View>
            </>
          )}

          {/* TRAINER STATS */}
          {profile.role === 'coach' && (
            <>
              <Text style={styles.sectionTitle}>TRAINERINFORMATIONEN</Text>
              <View style={styles.statsGrid}>
                <StatCard icon={<Briefcase size={18} color="#1A2F6E" />} label="Funktion"         value={profile.coaching_role} />
                <StatCard icon={<Target size={18} color="#1A2F6E" />}    label="Spezialisierung"  value={profile.coaching_specialization} />
                <StatCard icon={<Award size={18} color="#1A2F6E" />}     label="Lizenz"           value={profile.coaching_license} />
                <StatCard icon={<Clock size={18} color="#1A2F6E" />}     label="Erfahrung"        value={profile.coaching_experience != null ? `${profile.coaching_experience} Jahre` : null} />
              </View>
            </>
          )}

          {/* KONTO */}
          <Text style={styles.sectionTitle}>KONTO</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-Mail</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{email || '–'}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Mitglied seit</Text>
              <Text style={styles.infoValue}>{memberSince}</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* EDIT HEADER */}
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>Profil bearbeiten</Text>
          <TouchableOpacity onPress={cancelEditing} style={styles.cancelIcon} activeOpacity={0.7}>
            <X size={22} color="#1A2F6E" />
          </TouchableOpacity>
        </View>

        {/* AVATAR */}
        <View style={styles.avatarEditWrap}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarEditTouch}>
            {draft.avatar
              ? <Image source={{ uri: draft.avatar }} style={styles.avatarImg} />
              : <Initials firstName={draft.first_name} lastName={draft.last_name} />
            }
            <View style={styles.avatarEditOverlay}>
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarEditHint}>Foto ändern</Text>
        </View>

        {/* PERSÖNLICHE DATEN */}
        <Text style={styles.sectionTitle}>PERSÖNLICHE DATEN</Text>
        <View style={styles.editCard}>
          <EditField label="Vorname"  value={draft.first_name}  onChangeText={(v) => updateDraft('first_name', v)}  placeholder="Max" />
          <EditField label="Nachname" value={draft.last_name}   onChangeText={(v) => updateDraft('last_name', v)}   placeholder="Mustermann" />
          <EditField label="Bio"      value={draft.bio}         onChangeText={(v) => updateDraft('bio', v)}         placeholder="Erzähl etwas über dich…" multiline />
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

              <EditField label="Trikotnummer" value={draft.jersey_number} onChangeText={(v) => updateDraft('jersey_number', v)} placeholder="z.B. 12" keyboardType="numeric" />

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
                  <EditField label="Alter"     value={draft.age}    onChangeText={(v) => updateDraft('age', v)}    placeholder="z.B. 22"  keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Nationalität" value={draft.nationality} onChangeText={(v) => updateDraft('nationality', v)} placeholder="z.B. Deutsch" />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <EditField label="Gewicht (kg)" value={draft.weight} onChangeText={(v) => updateDraft('weight', v)} placeholder="z.B. 85"  keyboardType="decimal-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Größe (cm)"   value={draft.height} onChangeText={(v) => updateDraft('height', v)} placeholder="z.B. 182" keyboardType="decimal-pad" />
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
    </SafeAreaView>
  );
}

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:   { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  headerSection: { alignItems: 'center', marginBottom: 32 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end', marginBottom: 16,
    backgroundColor: BG, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: B,
  },
  editBtnText: { color: B, fontSize: 12, fontWeight: '800' },

  avatarImg: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: B, marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: BG, borderWidth: 2, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarInitials: { color: B, fontSize: 32, fontWeight: '900' },
  rolePill: {
    backgroundColor: BG, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1.5, borderColor: B, marginBottom: 10,
  },
  rolePillText: { color: B, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  fullName: { color: B, fontSize: 24, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  bio:      { color: MUTED, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 300 },

  sectionTitle: {
    color: MUTED, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.2, marginBottom: 10, marginTop: 4,
  },

  card: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 24, overflow: 'hidden',
  },
  emptyCardText: { color: '#9CA3AF', fontSize: 13, padding: 16, textAlign: 'center' },

  teamRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  teamRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  teamLogo:      { width: 36, height: 36, borderRadius: 8 },
  teamLogoPlaceholder: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#E8EDF8', justifyContent: 'center', alignItems: 'center',
  },
  teamName: { flex: 1, color: B, fontSize: 14, fontWeight: '700' },
  coachTeamBadge: {
    backgroundColor: '#E8EDF8', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  coachTeamBadgeText: { color: B, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  badge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '47%', backgroundColor: BG,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14, gap: 6,
  },
  statIcon:  { marginBottom: 2 },
  statLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue: { color: B, fontSize: 15, fontWeight: '800' },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  infoLabel: { color: MUTED, fontSize: 13, fontWeight: '600' },
  infoValue: { color: B, fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },

  emptyTitle:    { color: B, fontSize: 18, fontWeight: '800', marginTop: 8 },
  emptySubtitle: { color: MUTED, fontSize: 13, textAlign: 'center', maxWidth: 260 },

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, marginTop: 4,
  },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF0F2', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1.5, borderColor: '#FECDD3',
  },
  joinBtnText: { color: R, fontSize: 11, fontWeight: '800' },

  emptyTeamBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  emptyTeamIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTeamTitle: { color: B, fontSize: 14, fontWeight: '700' },
  emptyTeamSub:   { color: MUTED, fontSize: 11, marginTop: 2 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  modalTitle: { color: B, fontSize: 18, fontWeight: '900' },

  modalSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: BG, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, marginHorizontal: 16, marginVertical: 12,
  },
  modalSearchInput: {
    flex: 1, color: B, fontSize: 15, paddingVertical: 13,
  },
  modalResults: { paddingHorizontal: 16, paddingBottom: 40 },
  modalEmpty: {
    alignItems: 'center', paddingTop: 60,
  },
  modalEmptyText: { color: MUTED, fontSize: 14, textAlign: 'center' },

  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  resultLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: BG },
  resultLogoPlaceholder: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
  },
  resultName: { color: B, fontSize: 14, fontWeight: '700' },
  resultMeta: { color: MUTED, fontSize: 11, marginTop: 2 },
  joinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: B, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  joinPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  editTitle:  { color: B, fontSize: 22, fontWeight: '900' },
  cancelIcon: { padding: 4 },

  avatarEditWrap:  { alignItems: 'center', marginBottom: 28 },
  avatarEditTouch: { position: 'relative' },
  avatarEditOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: B, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  avatarEditHint: { color: MUTED, fontSize: 11, fontWeight: '600', marginTop: 8 },

  editCard: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 16, marginBottom: 24, gap: 4,
  },

  editField: { marginBottom: 14 },
  editLabel: {
    color: B, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  editInput: {
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    color: B, fontSize: 14, borderWidth: 1.5, borderColor: BORDER,
  },
  editInputMulti: { height: 80, textAlignVertical: 'top' },

  chipScroll: { marginBottom: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 8,
    borderWidth: 1.5, borderColor: BORDER,
  },
  chipActive:     { backgroundColor: B, borderColor: B },
  chipText:       { color: MUTED, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  genderRow:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
  genderChip: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
  },
  twoCol: { flexDirection: 'row', gap: 12 },

  saveRow:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: {
    flex: 1, backgroundColor: BG, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: BORDER,
  },
  btnCancelText: { color: B, fontSize: 15, fontWeight: '700' },
  btnSave: {
    flex: 2, backgroundColor: R, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  btnDisabled:  { opacity: 0.6 },
  btnSaveText:  { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
