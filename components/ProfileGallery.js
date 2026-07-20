import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { ImagePlus, Play, Trash2, X, Film } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  addProfileMedia,
  deleteProfileMedia,
  fetchProfileMedia,
} from '../lib/profileMedia';
import { useTheme } from '../context/ThemeContext';

const COLS = 3;
const GAP = 8;
const SCREEN_W = Dimensions.get('window').width;

export default function ProfileGallery({
  profileId,
  canEdit = false,
  contentPadding = 20,
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, isDark, contentPadding),
    [colors, isDark, contentPadding],
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchProfileMedia(profileId);
      setItems(data);
    } catch (e) {
      console.warn('ProfileGallery:', e?.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const pickAndUpload = async () => {
    if (!canEdit || uploading) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung fehlt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];

    setUploading(true);
    try {
      const created = await addProfileMedia(profileId, asset.uri, 'image');
      setItems((prev) => [created, ...prev]);
    } catch (err) {
      const msg = err?.message ?? 'Upload fehlgeschlagen.';
      Alert.alert(
        'Upload fehlgeschlagen',
        msg.includes('row-level security') || msg.includes('Bucket not found')
          ? 'Galerie nicht eingerichtet. Bitte sql/profile_media.sql in Supabase ausführen und den Bucket „profile_media“ anlegen.'
          : msg,
      );
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      'Löschen?',
      'Dieses Medium wirklich aus der Galerie entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfileMedia(item.id);
              setItems((prev) => prev.filter((m) => m.id !== item.id));
              if (viewer?.id === item.id) setViewer(null);
            } catch (e) {
              Alert.alert('Fehler', e?.message ?? 'Löschen fehlgeschlagen.');
            }
          },
        },
      ],
    );
  };

  const openItem = async (item) => {
    if (item.media_type === 'video') {
      try {
        await Linking.openURL(item.media_url);
      } catch {
        Alert.alert('Fehler', 'Video konnte nicht geöffnet werden.');
      }
      return;
    }
    setViewer(item);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {canEdit ? (
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={pickAndUpload}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ImagePlus size={18} color="#FFFFFF" />
              <Text style={styles.uploadBtnText}>Bilder hinzufügen</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Film size={28} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {canEdit ? 'Noch keine Medien' : 'Keine Galerie-Inhalte'}
          </Text>
          <Text style={styles.emptySub}>
            {canEdit
              ? 'Lade Fotos hoch – sie sind für alle Profilbesucher sichtbar.'
              : 'Dieser Nutzer hat noch keine Bilder geteilt.'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.tile}
              onPress={() => openItem(item)}
              onLongPress={canEdit ? () => confirmDelete(item) : undefined}
              activeOpacity={0.85}
            >
              {item.media_type === 'image' ? (
                <Image source={{ uri: item.media_url }} style={styles.tileImage} />
              ) : (
                <View style={styles.videoTile}>
                  <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.videoLabel}>Video</Text>
                </View>
              )}
              {canEdit ? (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmDelete(item)}
                  hitSlop={8}
                >
                  <Trash2 size={14} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        visible={!!viewer && viewer.media_type === 'image'}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setViewer(null)}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewer(null)}
            hitSlop={12}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {viewer?.media_url ? (
            <Image
              source={{ uri: viewer.media_url }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function createStyles(c, isDark, contentPadding) {
  const tile = Math.floor((SCREEN_W - contentPadding * 2 - GAP * (COLS - 1)) / COLS);

  return StyleSheet.create({
    wrap: { marginBottom: 24 },
    centered: { paddingVertical: 40, alignItems: 'center' },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 14,
      marginBottom: 16,
    },
    uploadBtnDisabled: { opacity: 0.7 },
    uploadBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      paddingHorizontal: 20,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      gap: 8,
    },
    emptyTitle: { color: c.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
    emptySub: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 18,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
    },
    tile: {
      width: tile,
      height: tile,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    tileImage: { width: '100%', height: '100%' },
    videoTile: {
      flex: 1,
      backgroundColor: isDark ? '#1A2336' : '#1A2F6E',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    videoLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    deleteBtn: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewerClose: {
      position: 'absolute',
      top: 56,
      right: 20,
      zIndex: 2,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewerImage: { width: '100%', height: '100%' },
  });
}
