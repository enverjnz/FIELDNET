import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ChevronDown, Camera, X, Check } from 'lucide-react-native';
import { POST_CATEGORIES, createTeamPost, updateTeamPost } from '../lib/teamPosts';
import { isLocalImageUri, uploadPostImage } from '../lib/uploadImage';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

export default function PostCreateScreen({ teamId, post = null, onBack, onSuccess }) {
  const isEditing = Boolean(post?.id);

  const [title, setTitle] = useState(post?.title ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [category, setCategory] = useState(
    POST_CATEGORIES.includes(post?.category) ? post.category : POST_CATEGORIES[0],
  );
  const [imageUri, setImageUri] = useState(post?.image_url ?? null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung fehlt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Titel ein.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Inhalt ein.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

      if (imageUri && isLocalImageUri(imageUri)) {
        try {
          const uploadKey = isEditing ? post.id : `${teamId}-${Date.now()}`;
          imageUrl = await uploadPostImage(uploadKey, imageUri);
        } catch (uploadErr) {
          console.warn('Post image upload:', uploadErr?.message);
          Alert.alert(
            'Bild-Upload fehlgeschlagen',
            'Der Beitrag wird ohne Bild veröffentlicht.',
          );
        }
      } else if (imageUri) {
        imageUrl = imageUri;
      }

      if (isEditing) {
        await updateTeamPost({
          postId: post.id,
          title,
          content,
          category,
          imageUrl,
        });
        setSuccessMessage('Beitrag wurde gespeichert!');
      } else {
        await createTeamPost({
          teamId,
          title,
          content,
          category,
          imageUrl,
        });
        setSuccessMessage('Dein Beitrag wurde veröffentlicht!');
      }
      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch (err) {
      Alert.alert('Fehler', err?.message ?? 'Beitrag konnte nicht veröffentlicht werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
            <ArrowLeft size={20} color={B} />
            <Text style={styles.backBtnText}>Zurück</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Beitrag bearbeiten' : 'Beitrag erstellen'}</Text>
          <View style={{ width: 72 }} />
        </View>

        {!!successMessage && (
          <View style={styles.successToast}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.successToastText}>{successMessage}</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>TITEL *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="z. B. Saisonauftakt steht bevor"
              placeholderTextColor="#9CA3AF"
              maxLength={120}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>KATEGORIE *</Text>
            <TouchableOpacity
              style={styles.selectTrigger}
              onPress={() => setCategoryOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectText}>{category}</Text>
              <ChevronDown size={18} color={MUTED} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>INHALT *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={content}
              onChangeText={setContent}
              placeholder="Schreibe hier deinen Beitrag…"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>BILD (OPTIONAL)</Text>
            {imageUri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                  hitSlop={8}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.85}>
                <Camera size={22} color={B} />
                <Text style={styles.imagePickerText}>Bild auswählen</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !!successMessage}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.submitBtnText}>{isEditing ? 'Speichern' : 'Veröffentlichen'}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={categoryOpen} transparent animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setCategoryOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Kategorie wählen</Text>
            {POST_CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modalItem, category === item && styles.modalItemActive]}
                onPress={() => {
                  setCategory(item);
                  setCategoryOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalItemText, category === item && styles.modalItemTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 72 },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },
  headerTitle: { color: B, fontSize: 16, fontWeight: '900' },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successToastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { color: B, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: B,
    fontSize: 15,
    fontWeight: '600',
  },
  inputMulti: { minHeight: 160, paddingTop: 12 },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: { color: B, fontSize: 15, fontWeight: '600' },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
    paddingVertical: 28,
  },
  imagePickerText: { color: B, fontSize: 14, fontWeight: '700' },
  imagePreviewWrap: { position: 'relative' },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: BG,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,47,110,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    color: B,
    fontSize: 16,
    fontWeight: '900',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalItemActive: { backgroundColor: BG },
  modalItemText: { color: B, fontSize: 15, fontWeight: '600' },
  modalItemTextActive: { fontWeight: '900' },
});
