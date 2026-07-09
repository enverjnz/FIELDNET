import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFilter } from '../context/FilterContext';
import { FilterEmptyPrompt } from './MasterFilterBar';
import {
  fetchLatestPostsForLeague,
  fetchLatestLeagueGames,
  formatGameResultDate,
} from '../lib/leagueContent';
import PostCard from './PostCard';

const B = '#1A2F6E';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';
const R = '#C01830';

export default function HomeFeed() {
  const {
    selectedLeagueId,
    selectedSeasonId,
    isFilterReady,
    catalogLoading,
  } = useFilter();

  const [posts, setPosts] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFilterReady || !selectedLeagueId || !selectedSeasonId) {
      setPosts([]);
      setGames([]);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [postList, gameList] = await Promise.all([
          fetchLatestPostsForLeague(selectedLeagueId, selectedSeasonId, 15),
          fetchLatestLeagueGames(selectedLeagueId, selectedSeasonId, 5),
        ]);
        if (!cancelled) {
          setPosts(postList);
          setGames(gameList);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('HomeFeed:', e?.message);
          setPosts([]);
          setGames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedLeagueId, selectedSeasonId, isFilterReady]);

  if (!isFilterReady && !catalogLoading) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <FilterEmptyPrompt />
        <View style={{ height: 140 }} />
      </ScrollView>
    );
  }

  if (loading || catalogLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={B} />
        <Text style={styles.loadingText}>Lade Liga-Inhalte…</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      {games.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>🏈 LETZTE ERGEBNISSE</Text>
          <View style={styles.gamesWrap}>
            {games.map((game) => {
              const homeName = game.teams?.short_name || game.teams?.name || 'Heim';
              const awayName = game.away_team_name || 'Gast';
              const isLive = (game.status ?? '').toLowerCase() === 'live';

              return (
                <View key={game.id} style={styles.gameCard}>
                  <Text style={styles.gameDate}>{formatGameResultDate(game.game_date)}</Text>
                  <View style={styles.gameMatchup}>
                    <Text style={styles.gameTeam} numberOfLines={1}>{homeName}</Text>
                    <View style={styles.gameScoreWrap}>
                      {isLive ? (
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveBadgeText}>LIVE</Text>
                        </View>
                      ) : null}
                      <Text style={styles.gameScore}>
                        {game.home_score ?? 0}:{game.away_score ?? 0}
                      </Text>
                    </View>
                    <Text style={[styles.gameTeam, styles.gameTeamAway]} numberOfLines={1}>{awayName}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>📰 AKTUELLE BEITRÄGE</Text>
      {posts.length === 0 ? (
        <View style={styles.emptyPosts}>
          <Text style={styles.emptyPostsText}>
            Noch keine Beiträge in dieser Liga — Teams können News in der Vereinsverwaltung veröffentlichen.
          </Text>
        </View>
      ) : (
        <View style={styles.postsWrap}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showTeamHeader showActions />
          ))}
        </View>
      )}

      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48, gap: 12 },
  loadingText: { color: MUTED, fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  gamesWrap: { paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  gameCard: {
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  gameDate: { color: MUTED, fontSize: 10, fontWeight: '700', marginBottom: 6 },
  gameMatchup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gameTeam: { flex: 1, color: B, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  gameTeamAway: { textAlign: 'left' },
  gameScoreWrap: { alignItems: 'center', minWidth: 56 },
  gameScore: { color: B, fontSize: 16, fontWeight: '900' },
  liveBadge: {
    backgroundColor: R,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  liveBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  emptyPosts: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  emptyPostsText: { color: MUTED, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  postsWrap: { paddingHorizontal: 16, marginBottom: 8 },
});
