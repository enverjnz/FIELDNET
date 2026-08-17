import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ChevronLeft, Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { fetchFavoritePostsForUser } from '../lib/postFavorites';
import PostCard from '../components/PostCard';
import TeamProfileScreen from './TeamProfileScreen';
import EdgeSwipeBack from '../components/EdgeSwipeBack';

function createStyles(c) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
      gap: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      color: c.text,
      fontSize: 18,
      fontWeight: '900',
    },
    scroll: { flex: 1 },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 48,
      gap: 12,
    },
    loadingText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
    emptyWrap: {
      marginHorizontal: 16,
      marginTop: 48,
      padding: 28,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      gap: 12,
    },
    emptyTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
    },
    emptyText: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 20,
    },
    postsWrap: { paddingHorizontal: 16, paddingTop: 12 },
  });
}

export default function FavoritesScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewTeamId, setViewTeamId] = useState(null);

  const loadFavorites = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const list = await fetchFavoritePostsForUser();
      setPosts(list);
    } catch (e) {
      console.warn('FavoritesScreen:', e?.message);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites({ silent: true });
  }, [loadFavorites]);

  const handleFavoriteChange = useCallback((postId, isSaved) => {
    if (!isSaved) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  }, []);

  if (viewTeamId) {
    return (
      <TeamProfileScreen
        teamId={viewTeamId}
        readOnly
        onBack={() => setViewTeamId(null)}
      />
    );
  }

  return (
    <EdgeSwipeBack onBack={onBack} enabled={!!onBack}>
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Zurück"
        >
          <ChevronLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favoriten</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Lade Favoriten…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.primary]}
            />
          )}
        >
          {posts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Star size={28} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Noch keine Favoriten</Text>
              <Text style={styles.emptyText}>
                Tippe auf den Stern oben rechts bei einem Beitrag, um ihn hier zu speichern.
              </Text>
            </View>
          ) : (
            <View style={styles.postsWrap}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  variant="hero"
                  showTeamHeader
                  showActions
                  showFavorite
                  onTeamPress={setViewTeamId}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
    </EdgeSwipeBack>
  );
}
