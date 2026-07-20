import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { X, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const SHEET_HEIGHT = Math.min(340, Dimensions.get('window').height * 0.42);
const DISMISS_THRESHOLD = 90;

/**
 * Bottom-Sheet-Vorschau für Forum-Autoren.
 * Schließen: X oder Swipe nach unten. Tippen auf den Inhalt öffnet das Profil.
 */
export default function ForumUserPreviewSheet({
  visible,
  user,
  onClose,
  onOpenProfile,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dismiss = useRef((velocity = 0) => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: Math.max(160, 280 - Math.abs(velocity) * 20),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onCloseRef.current?.();
    });
  }).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SHEET_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.9) {
          dismiss(g.vy);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    }),
    [dismiss, translateY],
  );

  if (!user) return null;

  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unbekannt';
  const initial = name.slice(0, 1).toUpperCase();
  const meta = [user.roleLabel, user.position].filter(Boolean).join(' · ');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => dismiss()}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={() => dismiss()} />

        <Animated.View
          style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => dismiss()}
              hitSlop={10}
              accessibilityLabel="Schließen"
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.content}
            onPress={() => {
              onCloseRef.current?.();
              onOpenProfile?.(user.id);
            }}
            activeOpacity={0.85}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {!!meta && <Text style={styles.meta} numberOfLines={1}>{meta}</Text>}
            <View style={styles.openRow}>
              <Text style={styles.openText}>Profil öffnen</Text>
              <ChevronRight size={18} color={colors.accent} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.border,
      paddingBottom: 28,
      paddingHorizontal: 20,
    },
    handleRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 10,
      paddingBottom: 8,
      minHeight: 36,
    },
    handle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    closeBtn: {
      position: 'absolute',
      right: 0,
      top: 6,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    content: {
      alignItems: 'center',
      paddingTop: 8,
      gap: 8,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      marginBottom: 4,
    },
    avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    avatarInitial: {
      color: c.text,
      fontSize: 32,
      fontWeight: '900',
    },
    name: {
      color: c.text,
      fontSize: 20,
      fontWeight: '900',
      textAlign: 'center',
    },
    meta: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    openText: {
      color: c.accent,
      fontSize: 14,
      fontWeight: '800',
    },
  });
}
