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
    wrapMenu: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
      marginBottom: 4,
    },
    menuTitle: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    row: { gap: 8 },
    rowCompact: { flexDirection: 'row', gap: 6 },
    rowMenu: { gap: 14 },
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

export default function MasterFilterBar({ compact = false, menu = false }) {
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

  const large = menu;

  return (
    <View style={[
      styles.wrap,
      compact && styles.wrapCompact,
      menu && styles.wrapMenu,
    ]}>
      {menu ? <Text style={styles.menuTitle}>MASTER FILTER</Text> : null}
      <View style={[
        styles.row,
        compact && styles.rowCompact,
        menu && styles.rowMenu,
      ]}>
        <FilterDropdown
          label="SAISON"
          placeholder="Saison…"
          options={seasonOptions}
          value={selectedSeasonId}
          onChange={(v) => setSelectedSeasonId(Number(v))}
          loading={seasonsLoading}
          emptyText="Keine Saisons gefunden."
          compact={compact}
          large={large}
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
          large={large}
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
          large={large}
        />
      </View>
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
