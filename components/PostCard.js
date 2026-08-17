import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Share, Alert } from 'react-native';
import { MoreVertical, Heart, MessageCircle, Share2, Star } from 'lucide-react-native';
import { formatPostDate } from '../lib/teamPosts';
import { countCommentsForPost } from '../lib/postComments';
import { fetchPostLikeSummary, togglePostLike } from '../lib/postLikes';
import { fetchPostFavoriteStatus, togglePostFavorite } from '../lib/postFavorites';
import FullscreenImageModal from './FullscreenImageModal';
import PostCommentsModal from './PostCommentsModal';
import { useTheme } from '../context/ThemeContext';
import { createPostCardStyles, getPostCategoryStyles } from '../theme/postStyles';

const CONTENT_PREVIEW_LENGTH = 140;
const STAR_ACTIVE = '#EAB308';

function PostBodyText({ text, expanded, onExpand, onCollapse, style, readMoreStyle }) {
  if (!text) return null;

  const isLong = text.length > CONTENT_PREVIEW_LENGTH;

  if (!isLong) {
    return <Text style={style}>{text}</Text>;
  }

  if (expanded) {
    return (
      <Text style={style}>
        {text}
        <Text style={readMoreStyle} onPress={onCollapse}> weniger</Text>
      </Text>
    );
  }

  return (
    <Text style={style}>
      {text.slice(0, CONTENT_PREVIEW_LENGTH).trim()}
      <Text style={readMoreStyle} onPress={onExpand}>…mehr</Text>
    </Text>
  );
}

function TeamAvatar({ uri, label, styles, hero = false }) {
  if (hero) {
    if (uri) {
      return <Image source={{ uri }} style={styles.heroTeamLogo} resizeMode="contain" />;
    }
    return (
      <View style={styles.heroTeamLogoPlaceholder}>
        <Text style={styles.heroTeamLogoText}>{(label ?? '?').slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }

  if (uri) {
    return <Image source={{ uri }} style={styles.teamAvatar} resizeMode="contain" />;
  }
  return (
    <View style={styles.teamAvatarPlaceholder}>
      <Text style={styles.teamAvatarText}>{(label ?? '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export default function PostCard({
  post,
  showTeamHeader = false,
  showActions = false,
  showFavorite = false,
  variant = 'default',
  team,
  onPress,
  onEdit,
  onFavoriteChange,
  onTeamPress,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createPostCardStyles(colors), [colors]);
  const categoryStyles = useMemo(() => getPostCategoryStyles(colors), [colors]);
  const isHero = variant === 'hero';

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const categoryStyle = post.category
    ? (categoryStyles[post.category] ?? categoryStyles.News)
    : null;
  const teamInfo = showTeamHeader || isHero ? (post.teams ?? team) : null;
  const teamLabel = teamInfo?.short_name ?? teamInfo?.name ?? 'Team';
  const dateStr = formatPostDate(post.created_at);
  const contentText = (post.content ?? '').trim();
  const teamId = post.team_id ?? teamInfo?.id;

  const handleTeamPress = () => {
    if (teamId && onTeamPress) onTeamPress(teamId);
  };

  useEffect(() => {
    setExpanded(false);
  }, [post?.id]);

  useEffect(() => {
    if (!showActions || !post?.id) return;
    let cancelled = false;
    countCommentsForPost(post.id)
      .then((count) => { if (!cancelled) setCommentCount(count); })
      .catch(() => { if (!cancelled) setCommentCount(0); });
    return () => { cancelled = true; };
  }, [post?.id, showActions]);

  useEffect(() => {
    if (!showActions || !post?.id) return;
    let cancelled = false;
    fetchPostLikeSummary(post.id)
      .then(({ count, liked: isLiked }) => {
        if (!cancelled) {
          setLikeCount(count);
          setLiked(isLiked);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLikeCount(0);
          setLiked(false);
        }
      });
    return () => { cancelled = true; };
  }, [post?.id, showActions]);

  useEffect(() => {
    if (!showFavorite || !post?.id) return;
    let cancelled = false;
    fetchPostFavoriteStatus(post.id)
      .then((isSaved) => { if (!cancelled) setSaved(isSaved); })
      .catch(() => { if (!cancelled) setSaved(false); });
    return () => { cancelled = true; };
  }, [post?.id, showFavorite]);

  const handleLike = async () => {
    if (likeLoading || !post?.id) return;

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setLikeLoading(true);

    try {
      const summary = await togglePostLike(post.id);
      setLikeCount(summary.count);
      setLiked(summary.liked);
    } catch (e) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      Alert.alert('Fehler', e?.message ?? 'Like konnte nicht gespeichert werden.');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (favoriteLoading || !post?.id) return;

    const prevSaved = saved;
    setSaved(!prevSaved);
    setFavoriteLoading(true);

    try {
      const isSaved = await togglePostFavorite(post.id);
      setSaved(isSaved);
      onFavoriteChange?.(post.id, isSaved);
    } catch (e) {
      setSaved(prevSaved);
      Alert.alert('Fehler', e?.message ?? 'Favorit konnte nicht gespeichert werden.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleComment = () => {
    setCommentsOpen(true);
  };

  const handleShare = async () => {
    const teamName = teamInfo?.name ?? teamLabel;
    const snippet = contentText.slice(0, 160);
    const message = [
      post.title,
      snippet ? `${snippet}${contentText.length > 160 ? '…' : ''}` : null,
      `— ${teamName} · FIELDNET`,
    ].filter(Boolean).join('\n\n');

    try {
      await Share.share({ message });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleMenuPress = () => {
    if (!onEdit) return;
    Alert.alert('Beitrag', post.title, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Bearbeiten',
        onPress: () => onEdit(post),
      },
    ]);
  };

  const renderHeroCard = () => (
    <View style={styles.heroCard}>
      <TouchableOpacity
        activeOpacity={post.image_url ? 0.92 : 1}
        onPress={() => {
          if (post.image_url) setFullscreenImage(post.image_url);
        }}
      >
        <View style={styles.heroImageWrap}>
          {post.image_url ? (
            <Image source={{ uri: post.image_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              {teamInfo?.avatar_teamlogo ? (
                <Image
                  source={{ uri: teamInfo.avatar_teamlogo }}
                  style={styles.heroImagePlaceholderLogo}
                  resizeMode="contain"
                />
              ) : (
                <TeamAvatar uri={null} label={teamLabel} styles={styles} hero />
              )}
            </View>
          )}

          <View style={styles.heroOverlayTop}>
            <TouchableOpacity
              style={styles.heroTeamLogoWrap}
              onPress={handleTeamPress}
              disabled={!onTeamPress || !teamId}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Teamprofil ${teamInfo?.name ?? teamLabel}`}
            >
              <TeamAvatar uri={teamInfo?.avatar_teamlogo} label={teamLabel} styles={styles} hero />
            </TouchableOpacity>

            {showFavorite ? (
              <TouchableOpacity
                style={styles.heroFavoriteBtn}
                onPress={handleFavorite}
                disabled={favoriteLoading}
                hitSlop={8}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              >
                <Star
                  size={18}
                  color={saved ? STAR_ACTIVE : colors.textMuted}
                  fill={saved ? STAR_ACTIVE : 'transparent'}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {dateStr ? (
            <View style={styles.heroDatePill}>
              <Text style={styles.heroDateText}>{dateStr}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.heroBody}>
        <Text style={styles.heroTeamName} numberOfLines={1}>
          {teamInfo?.name ?? teamLabel}
        </Text>
        <Text style={styles.heroTitle}>{post.title}</Text>
        <PostBodyText
          text={contentText}
          expanded={expanded}
          onExpand={() => setExpanded(true)}
          onCollapse={() => setExpanded(false)}
          style={styles.heroContent}
          readMoreStyle={styles.readMoreLink}
        />
      </View>

      {showActions ? (
        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={handleLike}
            disabled={likeLoading}
            activeOpacity={0.75}
          >
            <Heart
              size={16}
              color={liked ? colors.accent : colors.textMuted}
              fill={liked ? colors.accent : 'transparent'}
            />
            <Text style={[styles.heroActionText, liked && styles.heroActionTextActive]}>
              Gefällt mir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.heroActionBtn} onPress={handleComment} activeOpacity={0.75}>
            <MessageCircle size={16} color={colors.textMuted} />
            <Text style={styles.heroActionText}>Kommentieren</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.heroActionBtn} onPress={handleShare} activeOpacity={0.75}>
            <Share2 size={16} color={colors.textMuted} />
            <Text style={styles.heroActionText}>Teilen</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const showCardTop = categoryStyle || (!showTeamHeader && dateStr) || onEdit;

  const defaultCard = (
    <View style={[styles.card, showActions && styles.cardWithActions]}>
      {showTeamHeader && teamInfo ? (
        <View style={styles.teamHeader}>
          <TouchableOpacity
            onPress={handleTeamPress}
            disabled={!onTeamPress || !teamId}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Teamprofil ${teamInfo.name ?? teamLabel}`}
          >
            <TeamAvatar uri={teamInfo.avatar_teamlogo} label={teamLabel} styles={styles} />
          </TouchableOpacity>
          <View style={styles.teamHeaderText}>
            <Text style={styles.teamName} numberOfLines={1}>{teamInfo.name ?? teamLabel}</Text>
            {dateStr ? <Text style={styles.teamMeta}>{dateStr}</Text> : null}
          </View>
        </View>
      ) : null}

      {showCardTop ? (
        <View style={styles.cardTop}>
          {categoryStyle ? (
            <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
              <Text style={[styles.categoryText, { color: categoryStyle.color }]}>
                {post.category.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.cardTopRight}>
            {!showTeamHeader && dateStr ? (
              <Text style={styles.dateText}>{dateStr}</Text>
            ) : null}
            {onEdit ? (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleMenuPress();
                }}
                hitSlop={8}
                activeOpacity={0.75}
                accessibilityLabel="Beitragsoptionen"
              >
                <MoreVertical size={16} color={colors.text} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
      <PostBodyText
        text={contentText}
        expanded={expanded}
        onExpand={() => setExpanded(true)}
        onCollapse={() => setExpanded(false)}
        style={styles.content}
        readMoreStyle={styles.readMoreLink}
      />

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

  const card = isHero ? renderHeroCard() : defaultCard;

  const wrapped = onPress && !isHero ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      {card}
    </TouchableOpacity>
  ) : card;

  return (
    <>
      <View style={styles.postWrapper}>
        {wrapped}
        {!isHero && showActions ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleLike}
              disabled={likeLoading}
              activeOpacity={0.75}
            >
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
