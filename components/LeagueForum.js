import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Send } from 'lucide-react-native';
import {
  joinLeagueConversation,
  fetchMessages,
  sendMessage,
  markConversationRead,
  subscribeToMessages,
  formatChatName,
} from '../lib/chat';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { createLeagueForumStyles } from '../theme/chatStyles';

function formatPostTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LeagueForum({
  leagueId,
  leagueName,
  bottomInset = 100,
  onUnreadChange,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createLeagueForumStyles(colors), [colors]);

  const [conversationId, setConversationId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const listRef = useRef(null);
  const onUnreadChangeRef = useRef(onUnreadChange);
  onUnreadChangeRef.current = onUnreadChange;

  const scrollToTop = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 80);
  }, []);

  const bootstrap = useCallback(async ({ showSpinner = true } = {}) => {
    if (!leagueId) return;
    if (showSpinner) setLoading(true);
    try {
      const convId = await joinLeagueConversation(leagueId);
      setConversationId(convId);

      const msgs = await fetchMessages(convId);
      // Timeline: newest first
      setPosts([...msgs].reverse());
      await markConversationRead(convId);
      onUnreadChangeRef.current?.();
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Forum konnte nicht geladen werden.');
      setConversationId(null);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leagueId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setCurrentUserId(user?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    bootstrap({ showSpinner: true });
  }, [bootstrap]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        return [msg, ...prev];
      });
      markConversationRead(conversationId).then(() => onUnreadChangeRef.current?.());
      scrollToTop();
    });

    return unsubscribe;
  }, [conversationId, scrollToTop]);

  const onRefresh = () => {
    setRefreshing(true);
    bootstrap({ showSpinner: false });
  };

  const handlePost = async () => {
    if (!draft.trim() || sending || !conversationId) return;
    setSending(true);
    try {
      const msg = await sendMessage(conversationId, draft);
      setPosts((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        return [msg, ...prev];
      });
      setDraft('');
      scrollToTop();
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Beitrag konnte nicht gepostet werden.');
    } finally {
      setSending(false);
    }
  };

  const renderPost = ({ item }) => {
    const isMine = item.sender_id === currentUserId;
    const name = formatChatName(item.sender);
    const initial = name.slice(0, 1).toUpperCase();

    return (
      <View style={[styles.postCard, isMine && styles.postCardMine]}>
        <View style={styles.postHeader}>
          {item.sender?.avatar ? (
            <Image source={{ uri: item.sender.avatar }} style={styles.postAvatar} />
          ) : (
            <View style={styles.postAvatarPlaceholder}>
              <Text style={styles.postAvatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.postMeta}>
            <Text style={styles.postAuthor} numberOfLines={1}>
              {isMine ? 'Du' : name}
            </Text>
            <Text style={styles.postTime}>{formatPostTime(item.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.postBody}>{item.content}</Text>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
        <Text style={styles.loadingHint}>Forum wird geladen…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.titleRow}>
        <Text style={styles.forumLeagueName} numberOfLines={1}>
          {leagueName ?? 'Liga-Forum'}
        </Text>
        <Text style={styles.forumHint}>Öffentliches Liga-Forum</Text>
      </View>

      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.listContentEmpty,
          { paddingBottom: 12 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Noch keine Beiträge</Text>
            <Text style={styles.emptySub}>
              Sei der Erste und poste etwas in dieses Liga-Forum.
            </Text>
          </View>
        }
      />

      <View style={[styles.composer, { marginBottom: bottomInset }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Beitrag posten…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handlePost}
          disabled={!draft.trim() || sending}
          activeOpacity={0.85}
        >
          {sending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Send size={18} color="#FFFFFF" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
