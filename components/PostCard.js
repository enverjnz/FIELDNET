import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Share } from 'react-native';
import { Edit2, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { formatPostDate } from '../lib/teamPosts';
import { countCommentsForPost } from '../lib/postComments';
import FullscreenImageModal from './FullscreenImageModal';
import PostCommentsModal from './PostCommentsModal';
import { useTheme } from '../context/ThemeContext';
import { createPostCardStyles, getPostCategoryStyles } from '../theme/postStyles';

function TeamAvatar({ uri, label, styles }) {
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
  const { colors } = useTheme();
  const styles = useMemo(() => createPostCardStyles(colors), [colors]);
  const categoryStyles = useMemo(() => getPostCategoryStyles(colors), [colors]);

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const categoryStyle = categoryStyles[post.category] ?? categoryStyles.News;
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
          <TeamAvatar uri={teamInfo.avatar_teamlogo} label={teamLabel} styles={styles} />
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
              <Edit2 size={14} color={colors.text} />
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
                color={liked ? colors.accent : colors.textMuted}
                fill={liked ? colors.accent : 'transparent'}
              />
              <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                {likeCount > 0 ? `${likeCount} ` : ''}Gefällt mir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleComment} activeOpacity={0.75}>
              <MessageCircle size={18} color={colors.textMuted} />
              <Text style={styles.actionText}>
                {commentCount > 0 ? `${commentCount} ` : ''}Kommentieren
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
              <Share2 size={18} color={colors.textMuted} />
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
