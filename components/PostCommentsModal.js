import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { X, Send, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import {
  fetchCommentsForPost,
  createPostComment,
  updatePostComment,
  deletePostComment,
  formatCommentAuthor,
  formatCommentDate,
} from '../lib/postComments';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

function CommentAvatar({ uri, label }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarText}>{label.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export default function PostCommentsModal({ visible, post, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);

  const loadComments = useCallback(async () => {
    if (!post?.id) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCommentsForPost(post.id);
      setComments(list);
      onCountChange?.(list.length);
    } catch (e) {
      setError(e?.message ?? 'Kommentare konnten nicht geladen werden.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [post?.id, onCountChange]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setCurrentUserId(user?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, [visible]);

  useEffect(() => {
    if (visible && post?.id) {
      setDraft('');
      setEditingCommentId(null);
      loadComments();
    }
  }, [visible, post?.id, loadComments]);

  const cancelEdit = () => {
    setEditingCommentId(null);
    setDraft('');
  };

  const handleSubmit = async () => {
    if (!post?.id || !draft.trim()) return;
    setSubmitting(true);
    try {
      if (editingCommentId) {
        const updated = await updatePostComment(editingCommentId, draft);
        setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCommentId(null);
        setDraft('');
      } else {
        const created = await createPostComment(post.id, draft);
        setComments((prev) => {
          const next = [...prev, created];
          onCountChange?.(next.length);
          return next;
        });
        setDraft('');
      }
    } catch (e) {
      Alert.alert(
        'Fehler',
        e?.message ?? (editingCommentId
          ? 'Kommentar konnte nicht gespeichert werden.'
          : 'Kommentar konnte nicht gesendet werden.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setDraft(comment.content ?? '');
  };

  const confirmDelete = (comment) => {
    Alert.alert(
      'Kommentar löschen?',
      'Dieser Kommentar wird endgültig gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostComment(comment.id);
              setComments((prev) => {
                const next = prev.filter((c) => c.id !== comment.id);
                onCountChange?.(next.length);
                return next;
              });
              if (editingCommentId === comment.id) cancelEdit();
            } catch (e) {
              Alert.alert('Fehler', e?.message ?? 'Kommentar konnte nicht gelöscht werden.');
            }
          },
        },
      ],
    );
  };

  const handleLongPress = (comment) => {
    if (!currentUserId || comment.user_id !== currentUserId) return;

    Alert.alert(
      'Dein Kommentar',
      'Was möchtest du tun?',
      [
        {
          text: 'Bearbeiten',
          onPress: () => startEdit(comment),
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => confirmDelete(comment),
        },
        { text: 'Abbrechen', style: 'cancel' },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Kommentare</Text>
            {post?.title ? (
              <Text style={styles.headerSub} numberOfLines={1}>{post.title}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={B} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={B} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadComments} style={styles.retryBtn}>
              <Text style={styles.retryText}>Erneut laden</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Noch keine Kommentare. Sei der Erste!</Text>
              </View>
            }
            renderItem={({ item }) => {
              const author = formatCommentAuthor(item);
              const isMine = !!currentUserId && item.user_id === currentUserId;
              const isEditing = editingCommentId === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.commentRow,
                    isEditing && styles.commentRowEditing,
                  ]}
                  onLongPress={() => handleLongPress(item)}
                  delayLongPress={350}
                  activeOpacity={isMine ? 0.7 : 1}
                  disabled={!isMine}
                >
                  <CommentAvatar uri={item.profiles?.avatar} label={author} />
                  <View style={styles.commentBody}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>
                        {isMine ? 'Du' : author}
                      </Text>
                      <Text style={styles.commentDate}>{formatCommentDate(item.created_at)}</Text>
                    </View>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {editingCommentId ? (
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>Kommentar bearbeiten</Text>
            <TouchableOpacity onPress={cancelEdit} hitSlop={8}>
              <Text style={styles.editBannerCancel}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={editingCommentId ? 'Kommentar ändern…' : 'Kommentar schreiben…'}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={!draft.trim() || submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : editingCommentId
                ? <Check size={18} color="#FFFFFF" />
                : <Send size={18} color="#FFFFFF" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { color: B, fontSize: 18, fontWeight: '900' },
  headerSub: { color: MUTED, fontSize: 12, marginTop: 2, fontWeight: '600' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: MUTED, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: -4,
  },
  commentRowEditing: {
    backgroundColor: BG,
  },
  avatar: { width: 36, height: 36, borderRadius: 10 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: B,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  commentBody: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: { color: B, fontSize: 13, fontWeight: '800', flex: 1 },
  commentDate: { color: MUTED, fontSize: 10, fontWeight: '600' },
  commentContent: { color: B, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  editBannerText: { color: B, fontSize: 12, fontWeight: '800' },
  editBannerCancel: { color: R, fontSize: 12, fontWeight: '800' },
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
    maxHeight: 100,
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: B,
    fontSize: 14,
    fontWeight: '500',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  errorBox: { padding: 24, alignItems: 'center', gap: 12 },
  errorText: { color: R, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  retryText: { color: B, fontSize: 13, fontWeight: '700' },
});
