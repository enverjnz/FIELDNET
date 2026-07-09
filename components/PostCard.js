import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Edit2, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { formatPostDate } from '../lib/teamPosts';
import { countCommentsForPost } from '../lib/postComments';
import FullscreenImageModal from './FullscreenImageModal';
import PostCommentsModal from './PostCommentsModal';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

const CATEGORY_STYLES = {
  News: { bg: BG, color: B },
  Spielbericht: { bg: '#FFF0F2', color: R },
  'Trainings-Update': { bg: '#ECFDF5', color: '#059669' },
  Event: { bg: '#FFFBEB', color: '#D97706' },
};

function TeamAvatar({ uri, label }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.teamAvatar} resizeMode="contain" />;
  }
  return (
    <View style={styles.teamAvatarPlaceholder}>
      <Text style={styles.teamAvatarText}>{(label ?? '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export default function PostCard({ post, showTeamHeader = false, showActions = false, team, onPress, onEdit }) {
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const categoryStyle = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.News;
  const teamInfo = showTeamHeader ? (post.teams ?? team) : null;
  const teamLabel = teamInfo?.short_name ?? teamInfo?.name ?? 'Team';
  const dateStr = formatPostDate(post.created_at);

  useEffect(() => {
    if (!showActions || !post?.id) return;
    let cancelled = false;
    countCommentsForPost(post.id)
      .then((count) => { if (!cancelled) setCommentCount(count); })
      .catch(() => { if (!cancelled) setCommentCount(0); });
    return () => { cancelled = true; };
  }, [post?.id, showActions]);

  const handleLike = () => {
    setLikeCount((count) => (liked ? Math.max(0, count - 1) : count + 1));
    setLiked((prev) => !prev);
  };

  const handleComment = () => {
    setCommentsOpen(true);
  };

  const handleShare = async () => {
    const teamName = teamInfo?.name ?? teamLabel;
    const snippet = (post.content ?? '').trim().slice(0, 160);
    const message = [
      post.title,
      snippet ? `${snippet}${post.content.length > 160 ? '…' : ''}` : null,
      `— ${teamName} · FIELDNET`,
    ].filter(Boolean).join('\n\n');

    try {
      await Share.share({ message });
    } catch {
      // User dismissed share sheet
    }
  };

  const card = (
    <View style={[styles.card, showActions && styles.cardWithActions]}>
      {showTeamHeader && teamInfo ? (
        <View style={styles.teamHeader}>
          <TeamAvatar uri={teamInfo.avatar_teamlogo} label={teamLabel} />
          <View style={styles.teamHeaderText}>
            <Text style={styles.teamName} numberOfLines={1}>{teamInfo.name ?? teamLabel}</Text>
            {dateStr ? <Text style={styles.teamMeta}>{dateStr}</Text> : null}
          </View>
        </View>
      ) : null}

      <View style={styles.cardTop}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
          <Text style={[styles.categoryText, { color: categoryStyle.color }]}>
            {(post.category ?? 'News').toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardTopRight}>
          {!showTeamHeader && dateStr ? (
            <Text style={styles.dateText}>{dateStr}</Text>
          ) : null}
          {onEdit ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={(e) => {
                e?.stopPropagation?.();
                onEdit(post);
              }}
              hitSlop={8}
              activeOpacity={0.75}
            >
              <Edit2 size={14} color={B} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
      <Text style={styles.content} numberOfLines={showTeamHeader ? 4 : 6}>{post.content}</Text>

      {post.image_url ? (
        <TouchableOpacity
          onPress={(e) => {
            e?.stopPropagation?.();
            setFullscreenImage(post.image_url);
          }}
          activeOpacity={0.9}
        >
          <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const wrapped = onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      {card}
    </TouchableOpacity>
  ) : card;

  return (
    <>
      <View style={styles.postWrapper}>
        {wrapped}
        {showActions ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.75}>
              <Heart
                size={18}
                color={liked ? R : MUTED}
                fill={liked ? R : 'transparent'}
              />
              <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                {likeCount > 0 ? `${likeCount} ` : ''}Gefällt mir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleComment} activeOpacity={0.75}>
              <MessageCircle size={18} color={MUTED} />
              <Text style={styles.actionText}>
                {commentCount > 0 ? `${commentCount} ` : ''}Kommentieren
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
              <Share2 size={18} color={MUTED} />
              <Text style={styles.actionText}>Teilen</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      <FullscreenImageModal uri={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      <PostCommentsModal
        visible={commentsOpen}
        post={post}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setCommentCount}
      />
    </>
  );
}

const styles = StyleSheet.create({
  postWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 0,
  },
  cardWithActions: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  actionText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
  },
  actionTextActive: {
    color: R,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  teamAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: B,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  teamHeaderText: { flex: 1 },
  teamName: { color: B, fontSize: 14, fontWeight: '800' },
  teamMeta: { color: MUTED, fontSize: 11, marginTop: 2 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dateText: { color: MUTED, fontSize: 11, fontWeight: '600' },
  title: {
    color: B,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  content: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: BG,
  },
});
