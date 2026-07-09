import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ALLOWED_DIVISIONS,
  fetchLeaguesForRegionAllowed,
  fetchRegions,
  fetchSeasons,
  type Season,
} from '../lib/leagueTeams';

const STORAGE_KEY = '@fieldnet/master_filter';

export type Region = {
  id: number;
  name: string;
  country_unit: string | null;
  region_logo_url: string | null;
};

export type League = {
  id: string;
  name: string;
  division: string;
};

type PersistedFilter = {
  selectedRegionId: number | null;
  selectedLeagueId: string | null;
  selectedSeasonId: number | null;
};

type FilterContextValue = {
  selectedRegionId: number | null;
  selectedLeagueId: string | null;
  selectedSeasonId: number | null;
  setSelectedRegionId: (id: number) => void;
  setSelectedLeagueId: (id: string) => void;
  setSelectedSeasonId: (id: number) => void;
  seasons: Season[];
  regions: Region[];
  leagues: League[];
  seasonsLoading: boolean;
  regionsLoading: boolean;
  leaguesLoading: boolean;
  catalogLoading: boolean;
  hydrated: boolean;
  isFilterReady: boolean;
  selectedSeason: Season | null;
  selectedRegion: Region | null;
  selectedLeague: League | null;
  refreshCatalog: () => Promise<void>;
};

const FilterContext = createContext<FilterContextValue | null>(null);

async function readPersistedFilter(): Promise<PersistedFilter | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFilter;
    return {
      selectedRegionId: parsed.selectedRegionId ?? null,
      selectedLeagueId: parsed.selectedLeagueId ?? null,
      selectedSeasonId: parsed.selectedSeasonId ?? null,
    };
  } catch {
    return null;
  }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedRegionId, setSelectedRegionIdState] = useState<number | null>(null);
  const [selectedLeagueId, setSelectedLeagueIdState] = useState<string | null>(null);
  const [selectedSeasonId, setSelectedSeasonIdState] = useState<number | null>(null);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);

  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const persistedRef = useRef<PersistedFilter | null>(null);

  const loadSeasonsAndRegions = useCallback(async (applyDefaults = false) => {
    setSeasonsLoading(true);
    setRegionsLoading(true);
    try {
      const [seasonList, regionList] = await Promise.all([fetchSeasons(), fetchRegions()]);
      setSeasons(seasonList);
      setRegions(regionList as Region[]);

      if (applyDefaults) {
        const persisted = persistedRef.current;
        const defaultSeason =
          seasonList.find((s) => s.id === persisted?.selectedSeasonId)
          ?? seasonList.find((s) => s.is_current)
          ?? seasonList[0]
          ?? null;

        const defaultRegion =
          regionList.find((r) => r.id === persisted?.selectedRegionId)
          ?? regionList[0]
          ?? null;

        setSelectedSeasonIdState(defaultSeason?.id ?? null);
        setSelectedRegionIdState(defaultRegion?.id ?? null);
      }
    } catch (e) {
      console.warn('FilterContext catalog:', (e as Error)?.message);
    } finally {
      setSeasonsLoading(false);
      setRegionsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      persistedRef.current = await readPersistedFilter();
      await loadSeasonsAndRegions(true);
      setHydrated(true);
    })();
  }, [loadSeasonsAndRegions]);

  useEffect(() => {
    if (!selectedRegionId) {
      setLeagues([]);
      setSelectedLeagueIdState(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLeaguesLoading(true);
      try {
        const list = await fetchLeaguesForRegionAllowed(selectedRegionId);
        if (cancelled) return;
        setLeagues(list);

        const persisted = persistedRef.current;
        const preferredId =
          persisted?.selectedLeagueId && list.some((l) => l.id === persisted.selectedLeagueId)
            ? persisted.selectedLeagueId
            : list[0]?.id ?? null;

        persistedRef.current = null;
        setSelectedLeagueIdState(preferredId);
      } catch (e) {
        if (!cancelled) {
          console.warn('FilterContext leagues:', (e as Error)?.message);
          setLeagues([]);
          setSelectedLeagueIdState(null);
        }
      } finally {
        if (!cancelled) setLeaguesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRegionId]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedRegionId,
        selectedLeagueId,
        selectedSeasonId,
      }),
    ).catch(() => {});
  }, [hydrated, selectedRegionId, selectedLeagueId, selectedSeasonId]);

  const setSelectedRegionId = useCallback((id: number) => {
    persistedRef.current = null;
    setSelectedRegionIdState(id);
    setSelectedLeagueIdState(null);
  }, []);

  const setSelectedLeagueId = useCallback((id: string) => {
    setSelectedLeagueIdState(id);
  }, []);

  const setSelectedSeasonId = useCallback((id: number) => {
    setSelectedSeasonIdState(id);
  }, []);

  const refreshCatalog = useCallback(async () => {
    await loadSeasonsAndRegions(false);
    if (selectedRegionId) {
      setLeaguesLoading(true);
      try {
        const list = await fetchLeaguesForRegionAllowed(selectedRegionId);
        setLeagues(list);
        if (selectedLeagueId && !list.some((l) => l.id === selectedLeagueId)) {
          setSelectedLeagueIdState(list[0]?.id ?? null);
        }
      } catch (e) {
        console.warn('FilterContext refresh leagues:', (e as Error)?.message);
      } finally {
        setLeaguesLoading(false);
      }
    }
  }, [loadSeasonsAndRegions, selectedRegionId, selectedLeagueId]);

  const selectedSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId) ?? null,
    [seasons, selectedSeasonId],
  );

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selectedRegionId) ?? null,
    [regions, selectedRegionId],
  );

  const selectedLeague = useMemo(
    () => leagues.find((l) => l.id === selectedLeagueId) ?? null,
    [leagues, selectedLeagueId],
  );

  const catalogLoading = seasonsLoading || regionsLoading || leaguesLoading;
  const isFilterReady = Boolean(selectedRegionId && selectedLeagueId && selectedSeasonId);

  const value = useMemo<FilterContextValue>(() => ({
    selectedRegionId,
    selectedLeagueId,
    selectedSeasonId,
    setSelectedRegionId,
    setSelectedLeagueId,
    setSelectedSeasonId,
    seasons,
    regions,
    leagues,
    seasonsLoading,
    regionsLoading,
    leaguesLoading,
    catalogLoading,
    hydrated,
    isFilterReady,
    selectedSeason,
    selectedRegion,
    selectedLeague,
    refreshCatalog,
  }), [
    selectedRegionId,
    selectedLeagueId,
    selectedSeasonId,
    setSelectedRegionId,
    setSelectedLeagueId,
    setSelectedSeasonId,
    seasons,
    regions,
    leagues,
    seasonsLoading,
    regionsLoading,
    leaguesLoading,
    catalogLoading,
    hydrated,
    isFilterReady,
    selectedSeason,
    selectedRegion,
    selectedLeague,
    refreshCatalog,
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return ctx;
}

export { ALLOWED_DIVISIONS };
