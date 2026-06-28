import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Search, Check, X } from 'lucide-react-native';
import { searchTeams, teamSearchMeta, teamSearchLogoUrl, type TeamSearchResult } from '../../../lib/teamSearch';
import { OnboardingData } from '../PlayerOnboardingFlow';

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step3_TeamSearch({ data, update, onNext, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const runSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    const { teams, error } = await searchTeams(trimmed);
    setResults(teams);
    setSearchError(error);
    setHasSearched(true);
    setIsLoading(false);
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  };

  const selectTeam = (team: TeamSearchResult) => {
    update({ selectedTeamId: team.id, selectedTeamName: team.name });
    setQuery(team.name);
    setResults([]);
    setHasSearched(false);
  };

  const clearSelection = () => {
    update({ selectedTeamId: null, selectedTeamName: null });
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Was ist dein Team?</Text>
      <Text style={styles.subtitle}>
        Suche nach deinem Team. Deine Anfrage wird zunächst als{' '}
        <Text style={styles.highlight}>ausstehend</Text> eingereicht.
      </Text>

      <View style={styles.searchWrap}>
        <Search size={18} color="#1A2F6E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Teamname, Kürzel oder Ort…"
          placeholderTextColor="#4A5568"
          editable={!data.selectedTeamId}
          autoCorrect={false}
        />
        {isLoading && <ActivityIndicator size="small" color="#1A2F6E" style={{ marginRight: 6 }} />}
        {!!data.selectedTeamId && (
          <TouchableOpacity onPress={clearSelection} hitSlop={8}>
            <X size={18} color="#7C8BA1" />
          </TouchableOpacity>
        )}
      </View>

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
              <TeamLogo team={team} />
              <View style={styles.dropdownText}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamMeta}>{teamSearchMeta(team) || 'Kein Ort angegeben'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {hasSearched && !isLoading && !searchError && results.length === 0 && query.trim().length >= 2 && (
        <Text style={styles.emptyText}>Kein Team gefunden für „{query.trim()}“</Text>
      )}

      {!!data.selectedTeamId && (
        <View style={styles.selectedBadge}>
          <Check size={16} color="#1A2F6E" />
          <Text style={styles.selectedText}>
            {data.selectedTeamName} – Anfrage wird gestellt
          </Text>
        </View>
      )}

      <Text style={styles.skipHint}>
        Du kannst diesen Schritt auch überspringen und später ein Team anfragen.
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

function TeamLogo({ team }: { team: TeamSearchResult }) {
  const uri = teamSearchLogoUrl(team);
  if (uri) {
    return <Image source={{ uri }} style={styles.teamLogo} resizeMode="contain" />;
  }
  return (
    <View style={styles.teamLogoPlaceholder}>
      <Text style={styles.teamLogoInitials}>
        {(team.short_name || team.name || '?').slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title:    { color: B, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 24 },
  highlight: { color: R, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 12,
    paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#D1D8F0', marginBottom: 4,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, color: B, fontSize: 15, paddingVertical: 13 },
  error: { color: R, fontSize: 12, marginTop: 8 },
  emptyText: { color: '#6B7280', fontSize: 13, marginTop: 12, textAlign: 'center' },
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
  teamLogo: { width: 32, height: 32, borderRadius: 6 },
  teamLogoPlaceholder: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: '#F0F4FF', borderWidth: 1, borderColor: '#D1D8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  teamLogoInitials: { color: B, fontSize: 10, fontWeight: '800' },
  dropdownText: { flex: 1 },
  teamName: { color: B, fontSize: 14, fontWeight: '700' },
  teamMeta: { color: '#6B7280', fontSize: 11, marginTop: 2 },
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
