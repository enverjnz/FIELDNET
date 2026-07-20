import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import {
  fetchMessages,
  sendMessage,
  markConversationRead,
  getConversationTitle,
  subscribeToMessages,
  formatChatName,
} from '../lib/chat';
import { useTheme } from '../context/ThemeContext';
import { createChatRoomStyles } from '../theme/chatStyles';

export default function ChatRoomScreen({
  conversationId,
  onBack,
  onRead,
  onOpenProfile,
  bottomInset = 0,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatRoomStyles(colors), [colors]);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('Chat');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const listRef = useRef(null);
  const onReadRef = useRef(onRead);
  const onBackRef = useRef(onBack);
  const onOpenProfileRef = useRef(onOpenProfile);
  onReadRef.current = onRead;
  onBackRef.current = onBack;
  onOpenProfileRef.current = onOpenProfile;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (!conversationId) return undefined;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Nicht eingeloggt.');
        if (cancelled) return;
        setCurrentUserId(user.id);

        const [msgs, chatTitle] = await Promise.all([
          fetchMessages(conversationId),
          getConversationTitle(conversationId, user.id),
        ]);

        if (cancelled) return;
        setMessages(msgs);
        setTitle(chatTitle);

        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversationId);
        const otherId = (members ?? []).find((m) => m.user_id !== user.id)?.user_id ?? null;
        if (otherId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar')
            .eq('id', otherId)
            .maybeSingle();
          if (!cancelled) setOtherUser(profile ?? { id: otherId });
        } else if (!cancelled) {
          setOtherUser(null);
        }

        await markConversationRead(conversationId);
        if (cancelled) return;
        onReadRef.current?.();
        scrollToEnd();
      } catch (e) {
        if (cancelled) return;
        Alert.alert('Fehler', e?.message ?? 'Chat konnte nicht geladen werden.');
        onBackRef.current?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, scrollToEnd]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToEnd();
      markConversationRead(conversationId).then(() => onReadRef.current?.());
    });

    return unsubscribe;
  }, [conversationId, scrollToEnd]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(conversationId, draft);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setDraft('');
      scrollToEnd();
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Nachricht konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  const openOtherProfile = () => {
    if (!otherUser?.id) return;
    onOpenProfileRef.current?.(otherUser.id);
  };

  const renderMessage = ({ item }) => {
    const isMine = item.sender_id === currentUserId;
    const senderName = formatChatName(item.sender);
    const canOpenSender = !isMine && !!item.sender?.id;

    const avatarNode = !isMine ? (
      item.sender?.avatar ? (
        <Image source={{ uri: item.sender.avatar }} style={styles.msgAvatar} />
      ) : (
        <View style={styles.msgAvatarPlaceholder}>
          <Text style={styles.msgAvatarText}>{senderName.slice(0, 1)}</Text>
        </View>
      )
    ) : null;

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {avatarNode ? (
          canOpenSender ? (
            <TouchableOpacity onPress={() => onOpenProfileRef.current?.(item.sender.id)} activeOpacity={0.75}>
              {avatarNode}
            </TouchableOpacity>
          ) : avatarNode
        ) : null}
        <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
          {!isMine ? <Text style={styles.msgSender}>{senderName}</Text> : null}
          <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const otherName = otherUser ? formatChatName(otherUser) : title;
  const otherInitial = otherName.slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => onBackRef.current?.()}
            activeOpacity={0.75}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfile}
            onPress={openOtherProfile}
            disabled={!otherUser?.id}
            activeOpacity={otherUser?.id ? 0.75 : 1}
          >
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
            ) : otherUser?.id ? (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>{otherInitial}</Text>
              </View>
            ) : null}
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </TouchableOpacity>

          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.text} style={{ marginTop: 40 }} />
        ) : (
          <>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>Noch keine Nachrichten. Schreib die erste!</Text>
                </View>
              }
              onContentSizeChange={scrollToEnd}
            />

            <View style={[styles.inputRow, { marginBottom: bottomInset }]}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Nachricht schreiben…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!draft.trim() || sending}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Send size={18} color="#FFFFFF" />
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
