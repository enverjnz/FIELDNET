import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ChevronDown, Camera, X, Check } from 'lucide-react-native';
import { POST_CATEGORIES, createTeamPost, updateTeamPost } from '../lib/teamPosts';
import { isLocalImageUri, uploadPostImage } from '../lib/uploadImage';
import { useTheme } from '../context/ThemeContext';
import { createPostCreateStyles } from '../theme/postStyles';

export default function PostCreateScreen({ teamId, post = null, onBack, onSuccess }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createPostCreateStyles(colors), [colors]);
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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
            <ArrowLeft size={20} color={colors.text} />
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
              placeholderTextColor={colors.textMuted}
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
              <ChevronDown size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>INHALT *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={content}
              onChangeText={setContent}
              placeholder="Schreibe hier deinen Beitrag…"
              placeholderTextColor={colors.textMuted}
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
                <Camera size={22} color={colors.text} />
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
