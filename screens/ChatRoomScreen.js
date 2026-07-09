import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

export default function ChatRoomScreen({ conversationId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('Chat');
  const [currentUserId, setCurrentUserId] = useState(null);
  const listRef = useRef(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');
      setCurrentUserId(user.id);

      const [msgs, chatTitle] = await Promise.all([
        fetchMessages(conversationId),
        getConversationTitle(conversationId, user.id),
      ]);

      setMessages(msgs);
      setTitle(chatTitle);
      await markConversationRead(conversationId);
      scrollToEnd();
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Chat konnte nicht geladen werden.');
      onBack?.();
    } finally {
      setLoading(false);
    }
  }, [conversationId, onBack, scrollToEnd]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToEnd();
      markConversationRead(conversationId);
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

  const renderMessage = ({ item }) => {
    const isMine = item.sender_id === currentUserId;
    const senderName = formatChatName(item.sender);

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && item.sender?.avatar ? (
          <Image source={{ uri: item.sender.avatar }} style={styles.msgAvatar} />
        ) : !isMine ? (
          <View style={styles.msgAvatarPlaceholder}>
            <Text style={styles.msgAvatarText}>{senderName.slice(0, 1)}</Text>
          </View>
        ) : null}
        <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
          {!isMine ? <Text style={styles.msgSender}>{senderName}</Text> : null}
          <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <ArrowLeft size={20} color={B} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={B} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Noch keine Nachrichten. Schreib die erste!</Text>
              </View>
            }
            onContentSizeChange={scrollToEnd}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Nachricht schreiben…"
              placeholderTextColor="#9CA3AF"
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
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: B, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: MUTED, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 8 },
  msgAvatarPlaceholder: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: B,
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  msgBubbleOther: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  msgBubbleMine: { backgroundColor: B },
  msgSender: { color: MUTED, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  msgText: { color: B, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  msgTextMine: { color: '#FFFFFF' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: B,
    fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: R, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
