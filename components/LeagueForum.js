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
import { Send, HatGlasses } from 'lucide-react-native';
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
import ForumUserPreviewSheet from './ForumUserPreviewSheet';

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

function AnonymousAvatar({ styles, size = 34 }) {
  return (
    <View style={[styles.postAvatarPlaceholder, styles.anonAvatar, size !== 34 && { width: size, height: size, borderRadius: size / 2 }]}>
      <HatGlasses size={Math.round(size * 0.45)} color="#FFFFFF" />
    </View>
  );
}

export default function LeagueForum({
  leagueId,
  leagueName,
  bottomInset = 100,
  onUnreadChange,
  onOpenProfile,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createLeagueForumStyles(colors), [colors]);

  const [conversationId, setConversationId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
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
      const msg = await sendMessage(conversationId, draft, { isAnonymous: anonymousMode });
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

  const openUserPreview = async (item) => {
    if (!item?.sender_id || item.is_anonymous || !item.sender) return;

    const base = {
      id: item.sender_id,
      first_name: item.sender?.first_name ?? null,
      last_name: item.sender?.last_name ?? null,
      avatar: item.sender?.avatar ?? null,
      position: null,
      roleLabel: null,
    };
    setPreviewUser(base);

    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar, position, role')
        .eq('id', item.sender_id)
        .maybeSingle();

      if (!data) {
        setPreviewUser(null);
        return;
      }
      const roleLabel =
        data.role === 'fan' ? 'Fan'
          : data.role === 'coach' ? 'Coach'
            : data.role === 'player' ? 'Spieler'
              : null;

      setPreviewUser({
        id: item.sender_id,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar: data.avatar,
        position: data.position,
        roleLabel,
      });
    } catch {
      // keep base preview
    }
  };

  const renderPost = ({ item }) => {
    const isAnonymous = !!item.is_anonymous;
    const isUnknown = !isAnonymous && !item.sender;
    const canOpenProfile = !isAnonymous && !isUnknown && !!item.sender_id;
    const isMine = item.sender_id === currentUserId;
    const name = isAnonymous ? 'Anonymer User' : formatChatName(item.sender);
    const initial = name.slice(0, 1).toUpperCase();

    const avatarNode = isAnonymous ? (
      <AnonymousAvatar styles={styles} />
    ) : item.sender?.avatar ? (
      <Image source={{ uri: item.sender.avatar }} style={styles.postAvatar} />
    ) : (
      <View style={[styles.postAvatarPlaceholder, isUnknown && styles.anonAvatar]}>
        <Text style={styles.postAvatarText}>{initial}</Text>
      </View>
    );

    return (
      <View style={[styles.postCard, isMine && canOpenProfile && styles.postCardMine]}>
        <View style={styles.postHeader}>
          {canOpenProfile ? (
            <TouchableOpacity
              onPress={() => openUserPreview(item)}
              activeOpacity={0.75}
              hitSlop={6}
            >
              {avatarNode}
            </TouchableOpacity>
          ) : (
            avatarNode
          )}
          <View style={styles.postMeta}>
            <Text
              style={[
                styles.postAuthor,
                (isAnonymous || isUnknown) && styles.postAuthorAnon,
              ]}
              numberOfLines={1}
            >
              {isAnonymous ? 'Anonymer User' : (isMine && canOpenProfile ? 'Du' : name)}
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
          placeholder={anonymousMode ? 'Anonym posten…' : 'Beitrag posten…'}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.anonBtn, anonymousMode && styles.anonBtnActive]}
          onPress={() => setAnonymousMode((v) => !v)}
          activeOpacity={0.85}
          accessibilityLabel="Anonym posten"
        >
          <HatGlasses size={18} color={anonymousMode ? '#FFFFFF' : colors.textMuted} />
        </TouchableOpacity>
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

      <ForumUserPreviewSheet
        visible={!!previewUser}
        user={previewUser}
        onClose={() => setPreviewUser(null)}
        onOpenProfile={(profileId) => {
          setPreviewUser(null);
          onOpenProfile?.(profileId);
        }}
      />
    </KeyboardAvoidingView>
  );
}
