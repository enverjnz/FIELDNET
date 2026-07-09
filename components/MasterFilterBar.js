import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useFilter } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';
import FilterDropdown from './FilterDropdown';

function createStyles(c) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    wrapCompact: { paddingTop: 8, paddingBottom: 6 },
    row: { gap: 8 },
    rowCompact: { flexDirection: 'row', gap: 6 },
    summary: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginTop: 8,
    },
    loadingWrap: {
      paddingVertical: 14,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
      marginHorizontal: 16,
      marginTop: 24,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      gap: 8,
    },
    emptyTitle: { color: c.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
    emptySub: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}

export default function MasterFilterBar({ compact = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    selectedSeasonId,
    selectedRegionId,
    selectedLeagueId,
    setSelectedSeasonId,
    setSelectedRegionId,
    setSelectedLeagueId,
    seasons,
    regions,
    leagues,
    seasonsLoading,
    regionsLoading,
    leaguesLoading,
    catalogLoading,
    hydrated,
    selectedSeason,
    selectedRegion,
    selectedLeague,
  } = useFilter();

  if (!hydrated && catalogLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

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

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.row, compact && styles.rowCompact]}>
        <FilterDropdown
          label="SAISON"
          placeholder="Saison…"
          options={seasonOptions}
          value={selectedSeasonId}
          onChange={(v) => setSelectedSeasonId(Number(v))}
          loading={seasonsLoading}
          emptyText="Keine Saisons gefunden."
          compact={compact}
        />
        <FilterDropdown
          label="VERBAND"
          placeholder="Region…"
          options={regionOptions}
          value={selectedRegionId}
          onChange={(v) => setSelectedRegionId(Number(v))}
          loading={regionsLoading}
          emptyText="Keine Regionen gefunden."
          compact={compact}
        />
        <FilterDropdown
          label="LIGA"
          placeholder={!selectedRegionId ? 'Region…' : 'Liga…'}
          options={leagueOptions}
          value={selectedLeagueId}
          onChange={(v) => setSelectedLeagueId(String(v))}
          loading={leaguesLoading}
          disabled={!selectedRegionId}
          emptyText="Keine Ligen in dieser Region."
          compact={compact}
        />
      </View>
      {(selectedSeason || selectedRegion || selectedLeague) ? (
        <Text style={styles.summary} numberOfLines={1}>
          {[
            selectedSeason?.year_label,
            selectedRegion?.country_unit || selectedRegion?.name,
            selectedLeague?.name,
          ].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

export function FilterEmptyPrompt({ style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.emptyBox, style]}>
      <MapPin size={28} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Liga wählen</Text>
      <Text style={styles.emptySub}>
        Bitte wähle eine Liga aus, um zu starten.
      </Text>
    </View>
  );
}
