import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Search, Check, X, Star } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { OnboardingData } from '../PlayerOnboardingFlow';

type League = { name: string; logo_url: string | null };
type Team   = { id: string; name: string; town: string; leagues?: League | null };

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
};

const REGIONS = [
  { key: 'BAWÜ', label: 'BaWü' },
  { key: 'BAYERN', label: 'Bayern' },
  { key: 'NRW', label: 'NRW' },
  { key: 'HESSEN', label: 'Hessen' },
  { key: 'NORD', label: 'Nord' },
  { key: 'OST', label: 'Ost' },
  { key: 'WEST', label: 'West' },
  { key: 'SUED', label: 'Süd' },
];

export default function FanStep3_Interests({ data, update, onNext, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const toggleRegion = (key: string) => {
    const current = data.favoriteRegions ?? [];
    const updated = current.includes(key)
      ? current.filter((r) => r !== key)
      : [...current, key];
    update({ favoriteRegions: updated });
  };

  const search = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setSearchError(null);
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, town, leagues(name, logo_url)')
        .ilike('name', `%${text.trim()}%`)
        .limit(10);
      if (error) throw error;
      setResults(teams ?? []);
    } catch {
      setSearchError('Suche fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectTeam = (team: Team) => {
    update({ favoriteTeamId: team.id, favoriteTeamName: team.name });
    setQuery(team.name);
    setResults([]);
  };

  const clearTeam = () => {
    update({ favoriteTeamId: null, favoriteTeamName: null });
    setQuery('');
    setResults([]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Deine Interessen</Text>
      <Text style={styles.subtitle}>
        Wähle Regionen und dein Lieblingsteam. Beide Felder sind optional.
      </Text>

      {/* Region Chips */}
      <Text style={styles.sectionLabel}>REGIONEN</Text>
      <View style={styles.chipRow}>
        {REGIONS.map(({ key, label }) => {
          const active = (data.favoriteRegions ?? []).includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleRegion(key)}
              activeOpacity={0.75}
            >
              {active && <Check size={12} color="#FFFFFF" style={styles.chipIcon} />}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Favorite Team */}
      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>LIEBLINGSTEAM</Text>
      <View style={styles.searchWrap}>
        <Search size={18} color="#1A2F6E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={search}
          placeholder="Teamname suchen…"
          placeholderTextColor="#4A5568"
          editable={!data.favoriteTeamId}
        />
        {!!data.favoriteTeamId && (
          <TouchableOpacity onPress={clearTeam} hitSlop={8}>
            <X size={18} color="#7C8BA1" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && <ActivityIndicator color="#1A2F6E" style={styles.spinner} />}
      {!!searchError && <Text style={styles.error}>{searchError}</Text>}

      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((team, index) => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.dropdownItem,
                index === results.length - 1 && styles.dropdownItemLast,
              ]}
              onPress={() => selectTeam(team)}
              activeOpacity={0.75}
            >
              {team.leagues?.logo_url
                ? <Image source={{ uri: team.leagues.logo_url }} style={styles.leagueLogo} resizeMode="contain" />
                : <View style={styles.leagueLogoPlaceholder} />
              }
              <View style={styles.dropdownText}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamTown}>
                  {team.town}
                  {team.leagues?.name ? `  ·  ${team.leagues.name}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!data.favoriteTeamId && (
        <View style={styles.selectedBadge}>
          <Star size={15} color="#1A2F6E" />
          <Text style={styles.selectedText}>{data.favoriteTeamName}</Text>
        </View>
      )}

      <Text style={styles.skipHint}>
        Du kannst diese Angaben auch später in deinem Profil ergänzen.
      </Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnSecondary} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>Weiter →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title: { color: B, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  sectionLabel: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F0F4FF',
    borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  chipActive: { backgroundColor: B, borderColor: B },
  chipIcon: { marginRight: 4 },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 12,
    paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#D1D8F0', marginBottom: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: B, fontSize: 15, paddingVertical: 13 },
  spinner: { marginTop: 12 },
  error: { color: R, fontSize: 12, marginTop: 8 },
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#D1D8F0', overflow: 'hidden', marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#D1D8F0',
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  leagueLogo: { width: 32, height: 32, borderRadius: 6 },
  leagueLogoPlaceholder: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: '#F0F4FF', borderWidth: 1, borderColor: '#D1D8F0',
  },
  dropdownText: { flex: 1 },
  teamName: { color: B, fontSize: 14, fontWeight: '700' },
  teamTown: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8EDF8', borderRadius: 10, padding: 12,
    borderWidth: 1.5, borderColor: B, marginTop: 12,
  },
  selectedText: { color: B, fontSize: 13, fontWeight: '600', flex: 1 },
  skipHint: { color: '#9CA3AF', fontSize: 12, marginTop: 16, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, backgroundColor: R, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnSecondary: {
    flex: 1, backgroundColor: '#F0F4FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  btnSecondaryText: { color: B, fontSize: 15, fontWeight: '700' },
});
