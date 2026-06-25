import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { deleteAccount } from '../lib/deleteAccount';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

const REASONS = [
  'App zu kompliziert',
  'Kein Bedarf mehr',
  'Wechsel zu anderem Tool',
  'Sonstiges',
] as const;

type Props = {
  onBack: () => void;
  onDeleted: () => void;
};

function RadioOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.radioRow, selected && styles.radioRowSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DeleteProfileScreen({ onBack, onDeleted }: Props) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    if (!selectedReason) {
      Alert.alert('Grund fehlt', 'Bitte wähle einen Grund für die Löschung aus.');
      return;
    }

    Alert.alert(
      'Bist du sicher?',
      'Dein Konto und alle zugehörigen Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Account löschen',
          style: 'destructive',
          onPress: handleDelete,
        },
      ],
    );
  };

  const handleDelete = async () => {
    if (!selectedReason) return;

    setDeleting(true);
    try {
      const { error } = await deleteAccount(selectedReason, feedback);
      if (error) throw new Error(error);
      onDeleted();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message.includes('Network request failed')
            ? 'Keine Verbindung. Bitte prüfe deine Internetverbindung.'
            : err.message
          : 'Unbekannter Fehler.';
      Alert.alert('Löschen fehlgeschlagen', message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.title}>Konto löschen</Text>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7} disabled={deleting}>
          <X size={22} color={B} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Schade, dass du gehst. Dein Feedback hilft uns, FIELDNET zu verbessern. Die Angaben
            werden anonym gespeichert und nicht mit deinem Konto verknüpft.
          </Text>

          <Text style={styles.sectionTitle}>WARUM MÖCHTEST DU GEHEN?</Text>
          <View style={styles.card}>
            {REASONS.map((reason, index) => (
              <View key={reason}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <RadioOption
                  label={reason}
                  selected={selectedReason === reason}
                  onPress={() => setSelectedReason(reason)}
                />
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>FEEDBACK (OPTIONAL)</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Was können wir besser machen?"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!deleting}
          />

          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            onPress={confirmDelete}
            activeOpacity={0.85}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteBtnText}>Account unwiderruflich löschen</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { color: B, fontSize: 22, fontWeight: '900' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  intro: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },
  sectionTitle: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
    overflow: 'hidden',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  radioRowSelected: { backgroundColor: '#E8EDF8' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: { borderColor: B },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: B,
  },
  radioLabel: { flex: 1, color: B, fontSize: 14, fontWeight: '600' },
  radioLabelSelected: { fontWeight: '800' },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  feedbackInput: {
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: B,
    fontSize: 14,
    minHeight: 110,
    marginBottom: 32,
  },
  deleteBtn: {
    backgroundColor: R,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: R,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
});
