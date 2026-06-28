import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable,
  StyleSheet, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Alert, Linking, Image,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import {
  Trophy, Hash, Search, Check, X,
  ExternalLink, ArrowLeft, Users, Camera, MapPin, Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { searchTeams, teamSearchMeta, teamSearchLogoUrl } from '../lib/teamSearch';
import { resolveTeamLogoUrl } from '../lib/uploadImage';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORT_URL = 'https://www.instagram.com/fieldnet.de/';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const COLOR_PRESETS = [
  { label: 'FIELDNET Blau', value: '#1A2F6E' },
  { label: 'FIELDNET Rot', value: '#C01830' },
  { label: 'Schwarz', value: '#111827' },
  { label: 'Weiß', value: '#FFFFFF' },
  { label: 'Grün', value: '#059669' },
  { label: 'Gold', value: '#D97706' },
];

function formatTrainingTimes(days, start, end) {
  if (!days.length && !start.trim()) return null;
  const dayPart = days.join(' & ');
  const timePart = start.trim()
    ? (end.trim() ? `${start.trim()}–${end.trim()} Uhr` : `${start.trim()} Uhr`)
    : '';
  return [dayPart, timePart].filter(Boolean).join(' · ') || null;
}

function normalizeHex(value) {
  const v = value.trim();
  if (!v) return '';
  return v.startsWith('#') ? v : `#${v}`;
}

function isValidHex(value) {
  if (!value.trim()) return true;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(normalizeHex(value));
}

function resetTeamDetails(setters) {
  setters.setAvatarUri(null);
  setters.setPrimaryColour('#1A2F6E');
  setters.setSecondaryColour('#C01830');
  setters.setFoundingYear('');
  setters.setTrainingLocation('');
  setters.setTrainingDays([]);
  setters.setTrainingStart('');
  setters.setTrainingEnd('');
  setters.setExistingTrainingTimes?.(null);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TeamCreationScreen({ onSuccess, onBack }) {
  // ── Team search ──────────────────────────────────────────────────────────────
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [searchError, setSearchError]   = useState(null);
  const [selectedTeamId, setSelectedTeamId]     = useState(null);
  const [selectedTeamName, setSelectedTeamName] = useState(null);
  const [selectedTeamTown, setSelectedTeamTown] = useState(null);

  // ── Invite code ──────────────────────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState('');

  // ── Team details ─────────────────────────────────────────────────────────────
  const [avatarUri, setAvatarUri]               = useState(null);
  const [primaryColour, setPrimaryColour]     = useState('#1A2F6E');
  const [secondaryColour, setSecondaryColour]   = useState('#C01830');
  const [foundingYear, setFoundingYear]         = useState('');
  const [trainingLocation, setTrainingLocation] = useState('');
  const [trainingDays, setTrainingDays]         = useState([]);
  const [trainingStart, setTrainingStart]       = useState('');
  const [trainingEnd, setTrainingEnd]           = useState('');
  const [existingTrainingTimes, setExistingTrainingTimes] = useState(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [errors, setErrors]             = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const teamInputRef = useRef(null);

  // ── Team search handler ──────────────────────────────────────────────────────
  const searchTeamsHandler = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }

    setIsSearching(true);
    setSearchError(null);
    const { teams, error } = await searchTeams(text.trim(), 12);
    if (error) {
      setSearchError(error);
      setResults([]);
    } else {
      setResults(teams);
    }
    setIsSearching(false);
  };

  const selectTeam = async (team) => {
    setSelectedTeamId(team.id);
    setSelectedTeamName(team.name);
    setSelectedTeamTown(team.town);
    setQuery(team.name);
    setResults([]);
    setErrors((prev) => ({ ...prev, selectedTeam: undefined }));

    const { data: fullTeam } = await supabase
      .from('teams')
      .select('avatar_teamlogo, primary_colour, secondary_colour, founding_year, training_location, training_times')
      .eq('id', team.id)
      .maybeSingle();

    if (fullTeam) {
      setAvatarUri(fullTeam.avatar_teamlogo ?? null);
      setPrimaryColour(fullTeam.primary_colour || '#1A2F6E');
      setSecondaryColour(fullTeam.secondary_colour || '#C01830');
      setFoundingYear(fullTeam.founding_year ? String(fullTeam.founding_year) : '');
      setTrainingLocation(fullTeam.training_location ?? '');
      setTrainingDays([]);
      setTrainingStart('');
      setTrainingEnd('');
      setExistingTrainingTimes(fullTeam.training_times ?? null);
    }
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
      setAvatarUri(result.assets[0].uri);
    }
  };

  const toggleTrainingDay = (day) => {
    setExistingTrainingTimes(null);
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const trainingPreview = formatTrainingTimes(trainingDays, trainingStart, trainingEnd)
    || existingTrainingTimes
    || null;

  const clearTeam = () => {
    setSelectedTeamId(null);
    setSelectedTeamName(null);
    setSelectedTeamTown(null);
    setQuery('');
    setResults([]);
    resetTeamDetails({
      setAvatarUri, setPrimaryColour, setSecondaryColour, setFoundingYear,
      setTrainingLocation, setTrainingDays, setTrainingStart, setTrainingEnd,
      setExistingTrainingTimes,
    });
    teamInputRef.current?.focus();
  };

  const clearQuery = () => {
    if (selectedTeamId) {
      clearTeam();
      return;
    }
    setQuery('');
    setResults([]);
    setSearchError(null);
    teamInputRef.current?.focus();
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!selectedTeamId)    e.selectedTeam = 'Bitte ein Team auswählen.';
    if (!inviteCode.trim()) e.inviteCode   = 'Einladungscode ist Pflicht.';
    if (!isValidHex(primaryColour))   e.primaryColour   = 'Ungültiger Hex-Farbcode.';
    if (!isValidHex(secondaryColour)) e.secondaryColour = 'Ungültiger Hex-Farbcode.';
    if (foundingYear.trim() && Number.isNaN(parseInt(foundingYear, 10))) {
      e.foundingYear = 'Bitte eine gültige Jahreszahl eingeben.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleClaim = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Nicht eingeloggt.');

      // ── Step 1: Code prüfen ──────────────────────────────────────────────────
      const { data: codeRow, error: codeErr } = await supabase
        .from('team_invite_codes')
        .select('id, is_used')
        .eq('code', inviteCode.trim().toUpperCase())
        .maybeSingle();

      if (codeErr)          throw codeErr;
      if (!codeRow)         throw new Error('Code ungültig oder bereits vergeben.');
      if (codeRow.is_used)  throw new Error('Code ungültig oder bereits vergeben.');

      const hasStructuredTraining = trainingDays.length > 0 || trainingStart.trim() || trainingEnd.trim();
      const trainingTimes = hasStructuredTraining
        ? formatTrainingTimes(trainingDays, trainingStart, trainingEnd)
        : (existingTrainingTimes || null);

      // ── Step 2: Manager verknüpfen (vor Logo-Upload wegen Storage-RLS) ───────
      const { error: managerErr } = await supabase
        .from('team_managers')
        .insert({ profile_id: user.id, team_id: selectedTeamId });
      if (managerErr) throw managerErr;

      const logoUrl = await resolveTeamLogoUrl(selectedTeamId, avatarUri);

      const { error: teamUpdateErr } = await supabase
        .from('teams')
        .update({
          avatar_teamlogo:   logoUrl,
          primary_colour:    normalizeHex(primaryColour) || null,
          secondary_colour:  normalizeHex(secondaryColour) || null,
          founding_year:     foundingYear.trim() ? parseInt(foundingYear, 10) : null,
          training_location: trainingLocation.trim() || null,
          training_times:    trainingTimes,
        })
        .eq('id', selectedTeamId);
      if (teamUpdateErr) throw teamUpdateErr;

      // ── Step 3: Code entwerten ───────────────────────────────────────────────
      const { error: codeUpdateErr } = await supabase
        .from('team_invite_codes')
        .update({ is_used: true, used_by_user_id: user.id })
        .eq('id', codeRow.id);
      if (codeUpdateErr) throw codeUpdateErr;

      // ── Fertig ───────────────────────────────────────────────────────────────
      Alert.alert(
        '🏈 Team übernommen!',
        `Du bist jetzt Vereinsverwalter von "${selectedTeamName}".`,
        [{ text: "Los geht's →", onPress: onSuccess }],
      );
    } catch (err) {
      const msg = err?.message?.includes('Network request failed')
        ? 'Keine Verbindung. Bitte prüfe deine Internetverbindung.'
        : err?.message ?? 'Unbekannter Fehler. Bitte versuche es erneut.';
      Alert.alert('Fehler', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={B} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconWrap}>
            <Trophy size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>
            Bereit, dein Team{'\n'}anzuführen?
          </Text>
          <Text style={styles.headerSubtitle}>
            Suche dein Team und bestätige deine Trainer-Rolle mit deinem persönlichen{' '}
            <Text style={styles.highlight}>Einladungscode</Text>.
          </Text>
        </View>

        {/* ── TEAM SUCHE ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DEIN TEAM</Text>
        <View style={styles.formCard}>

          {/* Search input */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>TEAMNAME *</Text>
            <Pressable
              style={[
                styles.searchRow,
                !!errors.selectedTeam && !selectedTeamId && styles.searchRowError,
              ]}
              onPress={() => teamInputRef.current?.focus()}
            >
              <Search size={18} color={selectedTeamId ? B : MUTED} style={styles.searchIcon} />
              <TextInput
                ref={teamInputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={searchTeamsHandler}
                placeholder="z. B. Nürnberg Rams…"
                placeholderTextColor="#4A5568"
                editable={!selectedTeamId}
                autoCorrect={false}
                returnKeyType="search"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {isSearching && <ActivityIndicator size="small" color={B} style={{ marginRight: 8 }} />}
              {(query.length > 0 || !!selectedTeamId) && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    clearQuery();
                  }}
                  hitSlop={10}
                >
                  <X size={18} color={MUTED} />
                </TouchableOpacity>
              )}
            </Pressable>
            {!!errors.selectedTeam && !selectedTeamId && (
              <Text style={styles.fieldError}>{errors.selectedTeam}</Text>
            )}
            {!!searchError && <Text style={styles.fieldError}>{searchError}</Text>}
          </View>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <View style={styles.dropdown}>
              {results.map((team, i) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.dropdownItem,
                    i < results.length - 1 && styles.dropdownItemBorder,
                  ]}
                  onPress={() => selectTeam(team)}
                  activeOpacity={0.75}
                >
                  {teamSearchLogoUrl(team)
                    ? <Image source={{ uri: teamSearchLogoUrl(team) }} style={styles.leagueLogo} resizeMode="contain" />
                    : <View style={styles.dropdownIcon}><Users size={16} color={B} /></View>
                  }
                  <View style={styles.dropdownText}>
                    <Text style={styles.dropdownName}>{team.name}</Text>
                    <Text style={styles.dropdownMeta}>
                      {teamSearchMeta(team) || 'Kein Ort angegeben'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected team badge */}
          {!!selectedTeamId && (
            <View style={styles.selectedBadge}>
              <Check size={16} color={B} />
              <View style={styles.selectedBadgeText}>
                <Text style={styles.selectedName}>{selectedTeamName}</Text>
                {selectedTeamTown
                  ? <Text style={styles.selectedMeta}>{selectedTeamTown}</Text>
                  : null}
              </View>
            </View>
          )}

          {!selectedTeamId && query.length === 0 && (
            <Text style={styles.searchHint}>
              Tippe mindestens 2 Zeichen, um Teams zu suchen.
            </Text>
          )}

          {!selectedTeamId && query.length >= 2 && results.length === 0 && !isSearching && (
            <View style={styles.noResultsWrap}>
              <Text style={styles.noResultsText}>
                Kein Team gefunden. Ist dein Team noch nicht in der Datenbank?
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(SUPPORT_URL)}
                activeOpacity={0.8}
              >
                <Text style={styles.noResultsLink}>Team jetzt anfordern →</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        {/* ── WEITERE TEAM-DATEN ─────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>WEITERE TEAM-DATEN</Text>
        <View style={[styles.formCard, !selectedTeamId && styles.formCardDisabled]}>
          <Text style={styles.sectionHint}>
            Optional – ergänze Logo, Farben und Trainingsinfos für dein Teamprofil.
          </Text>

          <Text style={styles.fieldLabel}>TEAM-LOGO</Text>
          <TouchableOpacity
            style={styles.logoPicker}
            onPress={pickLogo}
            activeOpacity={0.85}
            disabled={!selectedTeamId}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.logoPreview} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Camera size={28} color={B} />
                <Text style={styles.logoPlaceholderText}>Logo hochladen</Text>
              </View>
            )}
          </TouchableOpacity>
          {!!avatarUri && (
            <TouchableOpacity onPress={() => setAvatarUri(null)} style={styles.removeLogoBtn}>
              <Text style={styles.removeLogoText}>Logo entfernen</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>TEAMFARBEN</Text>
          <View style={styles.twoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.subFieldLabel}>PRIMARY</Text>
              <View style={styles.colorRow}>
                <View style={[styles.colorSwatch, { backgroundColor: normalizeHex(primaryColour) || B }]} />
                <TextInput
                  style={styles.colorInput}
                  value={primaryColour}
                  onChangeText={(v) => {
                    setPrimaryColour(v);
                    setErrors((prev) => ({ ...prev, primaryColour: undefined }));
                  }}
                  placeholder="#1A2F6E"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  editable={!!selectedTeamId}
                />
              </View>
              {!!errors.primaryColour && <Text style={styles.fieldError}>{errors.primaryColour}</Text>}
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.subFieldLabel}>SECONDARY</Text>
              <View style={styles.colorRow}>
                <View style={[styles.colorSwatch, { backgroundColor: normalizeHex(secondaryColour) || R }]} />
                <TextInput
                  style={styles.colorInput}
                  value={secondaryColour}
                  onChangeText={(v) => {
                    setSecondaryColour(v);
                    setErrors((prev) => ({ ...prev, secondaryColour: undefined }));
                  }}
                  placeholder="#C01830"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  editable={!!selectedTeamId}
                />
              </View>
              {!!errors.secondaryColour && <Text style={styles.fieldError}>{errors.secondaryColour}</Text>}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {COLOR_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[styles.presetChip, { backgroundColor: preset.value, borderColor: preset.value === '#FFFFFF' ? BORDER : preset.value }]}
                onPress={() => setPrimaryColour(preset.value)}
                disabled={!selectedTeamId}
              />
            ))}
          </ScrollView>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>GRÜNDUNGSJAHR</Text>
            <View style={styles.searchRow}>
              <Clock size={18} color={MUTED} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={foundingYear}
                onChangeText={(v) => {
                  setFoundingYear(v.replace(/[^0-9]/g, ''));
                  setErrors((prev) => ({ ...prev, foundingYear: undefined }));
                }}
                placeholder="z. B. 2005"
                placeholderTextColor="#4A5568"
                keyboardType="number-pad"
                maxLength={4}
                editable={!!selectedTeamId}
              />
            </View>
            {!!errors.foundingYear && <Text style={styles.fieldError}>{errors.foundingYear}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>TRAININGSORT</Text>
            <View style={styles.searchRow}>
              <MapPin size={18} color={MUTED} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={trainingLocation}
                onChangeText={setTrainingLocation}
                placeholder="Adresse oder Sportanlage"
                placeholderTextColor="#4A5568"
                editable={!!selectedTeamId}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>TRAININGSTAGE</Text>
          <View style={styles.dayRow}>
            {WEEKDAYS.map((day) => {
              const active = trainingDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => toggleTrainingDay(day)}
                  disabled={!selectedTeamId}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.subFieldLabel}>VON</Text>
              <TextInput
                style={styles.plainInput}
                value={trainingStart}
                onChangeText={(v) => { setExistingTrainingTimes(null); setTrainingStart(v); }}
                placeholder="19:00"
                placeholderTextColor="#9CA3AF"
                editable={!!selectedTeamId}
              />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.subFieldLabel}>BIS</Text>
              <TextInput
                style={styles.plainInput}
                value={trainingEnd}
                onChangeText={(v) => { setExistingTrainingTimes(null); setTrainingEnd(v); }}
                placeholder="21:00"
                placeholderTextColor="#9CA3AF"
                editable={!!selectedTeamId}
              />
            </View>
          </View>

          {trainingPreview ? (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Vorschau Trainingszeiten</Text>
              <Text style={styles.previewValue}>{trainingPreview}</Text>
            </View>
          ) : null}

          {!selectedTeamId && (
            <Text style={styles.disabledHint}>Wähle zuerst ein Team aus, um Details zu ergänzen.</Text>
          )}
        </View>

        {/* ── EINLADUNGSCODE ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>EINLADUNGSCODE</Text>
        <View style={styles.formCard}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CODE *</Text>
            <View style={[
              styles.searchRow,
              styles.codeRow,
              !!errors.inviteCode && styles.searchRowError,
            ]}>
              <Hash size={18} color={R} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, styles.codeInput]}
                value={inviteCode}
                onChangeText={(v) => {
                  setInviteCode(v.toUpperCase());
                  setErrors((prev) => ({ ...prev, inviteCode: undefined }));
                }}
                placeholder="z. B. RAMS-2026"
                placeholderTextColor="#4A5568"
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
            {!!errors.inviteCode && (
              <Text style={styles.fieldError}>{errors.inviteCode}</Text>
            )}
            <Text style={styles.fieldHint}>
              Den Einladungscode erhältst du vom FIELDNET-Team.
            </Text>
          </View>
        </View>

        {/* ── SUBMIT ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.claimBtn, isSubmitting && styles.claimBtnDisabled]}
          onPress={handleClaim}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Trophy size={18} color="#FFFFFF" />
              <Text style={styles.claimBtnText}>Vereinsverwaltung übernehmen</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <View style={styles.footerCard}>
          <Text style={styles.footerQuestion}>
            Du hast noch keinen Einladungscode für deinen Verein?
          </Text>
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => Linking.openURL(SUPPORT_URL)}
            activeOpacity={0.8}
          >
            <ExternalLink size={15} color={B} />
            <Text style={styles.footerBtnText}>Code jetzt anfordern</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const B      = '#1A2F6E';
const R      = '#C01830';
const BG     = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED  = '#6B7280';

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },

  // ── Header ──
  headerSection: {
    alignItems: 'center', marginBottom: 32, paddingHorizontal: 8,
  },
  headerIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: B, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: B, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  headerTitle: {
    color: B, fontSize: 28, fontWeight: '900',
    textAlign: 'center', lineHeight: 36, marginBottom: 14,
  },
  headerSubtitle: {
    color: MUTED, fontSize: 14, lineHeight: 22, textAlign: 'center',
  },
  highlight: { color: R, fontWeight: '700' },

  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.2, marginBottom: 10,
  },

  formCard: {
    backgroundColor: BG, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    padding: 18, marginBottom: 20,
  },

  fieldWrap:  { marginBottom: 4 },
  fieldLabel: {
    color: B, fontSize: 10, fontWeight: '800',
    letterSpacing: 0.8, marginBottom: 7, textTransform: 'uppercase',
  },
  fieldError: { color: R, fontSize: 11, marginTop: 5 },
  fieldHint:  { color: MUTED, fontSize: 11, marginTop: 5 },

  // ── Search row ──
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 12,
  },
  searchRowError: { borderColor: R },
  codeRow: { borderColor: R, borderWidth: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1, color: B, fontSize: 15, paddingVertical: 13,
  },
  codeInput: {
    fontWeight: '800', fontSize: 16, letterSpacing: 1.5, color: R,
  },

  // ── Dropdown results ──
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden', marginTop: 8,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  leagueLogo: { width: 34, height: 34, borderRadius: 8 },
  dropdownIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: BG, justifyContent: 'center', alignItems: 'center',
  },
  dropdownText:  { flex: 1 },
  dropdownName:  { color: B, fontSize: 14, fontWeight: '700' },
  dropdownMeta:  { color: MUTED, fontSize: 11, marginTop: 2 },

  // ── Selected badge ──
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E8EDF8', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: B, marginTop: 12,
  },
  selectedBadgeText: { flex: 1 },
  selectedName: { color: B, fontSize: 14, fontWeight: '800' },
  selectedMeta: { color: MUTED, fontSize: 11, marginTop: 2 },

  searchHint: { color: '#9CA3AF', fontSize: 12, marginTop: 10, textAlign: 'center' },

  noResultsWrap: { marginTop: 12, alignItems: 'center', gap: 6 },
  noResultsText: { color: MUTED, fontSize: 12, textAlign: 'center' },
  noResultsLink: { color: R, fontSize: 12, fontWeight: '700' },

  // ── Submit button ──
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: R, borderRadius: 16, paddingVertical: 18,
    marginBottom: 24,
    shadowColor: R, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  claimBtnDisabled: { opacity: 0.6 },
  claimBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

  // ── Footer ──
  footerCard: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 20, alignItems: 'center', gap: 14,
  },
  footerQuestion: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 12,
    borderWidth: 1.5, borderColor: B,
  },
  footerBtnText: { color: B, fontSize: 13, fontWeight: '800' },

  formCardDisabled: { opacity: 0.92 },
  sectionHint: { color: MUTED, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  disabledHint: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 12 },

  logoPicker: { alignSelf: 'center', marginBottom: 8 },
  logoPreview: { width: 96, height: 96, borderRadius: 20, borderWidth: 2, borderColor: B },
  logoPlaceholder: {
    width: 96, height: 96, borderRadius: 20, backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  logoPlaceholderText: { color: MUTED, fontSize: 10, fontWeight: '600' },
  removeLogoBtn: { alignSelf: 'center', marginBottom: 4 },
  removeLogoText: { color: R, fontSize: 12, fontWeight: '700' },

  twoCol: { flexDirection: 'row', gap: 12 },
  colHalf: { flex: 1 },
  subFieldLabel: {
    color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6,
  },
  colorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 10, marginBottom: 8,
  },
  colorSwatch: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: BORDER,
  },
  colorInput: { flex: 1, color: B, fontSize: 14, paddingVertical: 10 },
  presetScroll: { marginBottom: 12 },
  presetChip: {
    width: 28, height: 28, borderRadius: 14, marginRight: 8, borderWidth: 1.5,
  },

  plainInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 12, color: B, fontSize: 14, marginBottom: 8,
  },

  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
  },
  dayChipActive: { backgroundColor: B, borderColor: B },
  dayChipText: { color: MUTED, fontSize: 12, fontWeight: '700' },
  dayChipTextActive: { color: '#FFFFFF' },

  previewBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    padding: 12, marginTop: 4,
  },
  previewLabel: { color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginBottom: 4 },
  previewValue: { color: B, fontSize: 13, fontWeight: '600' },
});
