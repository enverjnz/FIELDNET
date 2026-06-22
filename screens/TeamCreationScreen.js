import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Alert, Linking, Image,
} from 'react-native';
import {
  Trophy, Hash, Search, Check, X,
  ExternalLink, ArrowLeft, Users,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORT_URL = 'https://www.instagram.com/fieldnet.de/';

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

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [errors, setErrors]             = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Team search handler ──────────────────────────────────────────────────────
  const searchTeams = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }

    setIsSearching(true);
    setSearchError(null);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, town, leagues(name, logo_url)')
        .ilike('name', `%${text.trim()}%`)
        .limit(12);
      if (error) throw error;
      setResults(data ?? []);
    } catch (e) {
      setSearchError('Suche fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectTeam = (team) => {
    setSelectedTeamId(team.id);
    setSelectedTeamName(team.name);
    setSelectedTeamTown(team.town);
    setQuery(team.name);
    setResults([]);
    setErrors((prev) => ({ ...prev, selectedTeam: undefined }));
  };

  const clearTeam = () => {
    setSelectedTeamId(null);
    setSelectedTeamName(null);
    setSelectedTeamTown(null);
    setQuery('');
    setResults([]);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!selectedTeamId)    e.selectedTeam = 'Bitte ein Team auswählen.';
    if (!inviteCode.trim()) e.inviteCode   = 'Einladungscode ist Pflicht.';
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

      // ── Step 2: Manager verknüpfen ───────────────────────────────────────────
      const { error: managerErr } = await supabase
        .from('team_managers')
        .insert({ profile_id: user.id, team_id: selectedTeamId });
      if (managerErr) throw managerErr;

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

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
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
            <View style={[
              styles.searchRow,
              !!errors.selectedTeam && !selectedTeamId && styles.searchRowError,
            ]}>
              <Search size={18} color={selectedTeamId ? B : MUTED} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={searchTeams}
                placeholder="z. B. Nürnberg Rams…"
                placeholderTextColor="#4A5568"
                editable={!selectedTeamId}
              />
              {isSearching && <ActivityIndicator size="small" color={B} style={{ marginRight: 8 }} />}
              {!!selectedTeamId && (
                <TouchableOpacity onPress={clearTeam} hitSlop={10}>
                  <X size={18} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>
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
                  {team.leagues?.logo_url
                    ? <Image source={{ uri: team.leagues.logo_url }} style={styles.leagueLogo} resizeMode="contain" />
                    : <View style={styles.dropdownIcon}><Users size={16} color={B} /></View>
                  }
                  <View style={styles.dropdownText}>
                    <Text style={styles.dropdownName}>{team.name}</Text>
                    <Text style={styles.dropdownMeta}>
                      {team.town}
                      {team.leagues?.name ? `  ·  ${team.leagues.name}` : ''}
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
});
