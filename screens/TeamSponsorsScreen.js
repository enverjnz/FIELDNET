import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Plus, Pencil, Trash2, Camera, Handshake } from 'lucide-react-native';
import {
  fetchTeamSponsors,
  createTeamSponsor,
  updateTeamSponsor,
  deleteTeamSponsor,
} from '../lib/teamSponsors';
import { useTheme } from '../context/ThemeContext';
import { createTeamSponsorsStyles } from '../theme/teamSponsorsStyles';

const EMPTY_FORM = {
  name: '',
  website_url: '',
  logo_url: '',
};

export default function TeamSponsorsScreen({ teamId, onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createTeamSponsorsStyles(colors), [colors]);

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTeamSponsors(teamId);
      setSponsors(list);
    } catch (err) {
      Alert.alert('Fehler', err?.message ?? 'Sponsoren konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (sponsor) => {
    setForm({
      name: sponsor.name ?? '',
      website_url: sponsor.website_url ?? '',
      logo_url: sponsor.logo_url ?? '',
    });
    setEditingId(sponsor.id);
    setShowForm(true);
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Berechtigung fehlt', 'Bitte erlaube den Zugriff auf Fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setForm((prev) => ({ ...prev, logo_url: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        website_url: form.website_url,
        logo_url: form.logo_url || null,
        sort_order: editingId
          ? sponsors.find((s) => s.id === editingId)?.sort_order ?? 0
          : sponsors.length,
      };

      if (editingId) {
        await updateTeamSponsor(teamId, editingId, payload);
      } else {
        await createTeamSponsor(teamId, payload);
      }

      resetForm();
      await loadSponsors();
    } catch (err) {
      Alert.alert('Fehler', err?.message ?? 'Sponsor konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sponsor) => {
    Alert.alert(
      'Sponsor löschen',
      `„${sponsor.name}" wirklich entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeamSponsor(sponsor.id);
              if (editingId === sponsor.id) resetForm();
              await loadSponsors();
            } catch (err) {
              Alert.alert('Fehler', err?.message ?? 'Sponsor konnte nicht gelöscht werden.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={colors.text} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Sponsoren</Text>
          <Text style={styles.subtitle}>
            Sponsoren erscheinen im Teamprofil. Tippt man dort auf einen Sponsor, öffnet sich die hinterlegte Webseite.
          </Text>

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? 'Sponsor bearbeiten' : 'Neuen Sponsor hinzufügen'}
              </Text>

              <Text style={styles.fieldLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                placeholder="z. B. Muster GmbH"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>WEBSEITE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                value={form.website_url}
                onChangeText={(v) => setForm((prev) => ({ ...prev, website_url: v }))}
                placeholder="https://sponsor.de"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.fieldLabel}>LOGO (OPTIONAL)</Text>
              <TouchableOpacity style={styles.logoPicker} onPress={pickLogo} activeOpacity={0.85}>
                {form.logo_url ? (
                  <Image source={{ uri: form.logo_url }} style={styles.logoPreview} resizeMode="contain" />
                ) : (
                  <View style={styles.logoPreviewPlaceholder}>
                    <Camera size={22} color={colors.textMuted} />
                  </View>
                )}
                <Text style={styles.logoHint}>Logo auswählen</Text>
              </TouchableOpacity>

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm} activeOpacity={0.85}>
                  <Text style={styles.cancelBtnText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.disabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Speichern</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>EINGEPFLEGTE SPONSOREN</Text>

          {loading ? (
            <ActivityIndicator color={colors.text} style={{ marginTop: 24 }} />
          ) : sponsors.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Handshake size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>Noch keine Sponsoren hinterlegt.</Text>
            </View>
          ) : (
            sponsors.map((sponsor) => (
              <View key={sponsor.id} style={styles.card}>
                <View style={styles.sponsorRow}>
                  {sponsor.logo_url ? (
                    <Image
                      source={{ uri: sponsor.logo_url }}
                      style={styles.sponsorLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.sponsorLogoPlaceholder}>
                      <Text style={styles.sponsorLogoInitial}>
                        {(sponsor.name ?? '?').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.sponsorInfo}>
                    <Text style={styles.sponsorName} numberOfLines={1}>{sponsor.name}</Text>
                    <Text style={styles.sponsorUrl} numberOfLines={1}>
                      {sponsor.website_url || 'Keine Webseite hinterlegt'}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => startEdit(sponsor)}
                      hitSlop={6}
                    >
                      <Pencil size={16} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDelete(sponsor)}
                      hitSlop={6}
                    >
                      <Trash2 size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          {!showForm && (
            <TouchableOpacity style={styles.addBtn} onPress={startCreate} activeOpacity={0.85}>
              <Plus size={18} color={colors.text} />
              <Text style={styles.addBtnText}>Sponsor hinzufügen</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
