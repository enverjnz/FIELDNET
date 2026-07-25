import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Flag } from 'lucide-react-native';
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  submitReport,
} from '../lib/reports';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

/**
 * Melde-Dialog für Profile und Kommentare (App Store Guideline 1.2).
 *
 * @param {boolean} visible
 * @param {'profile'|'comment'|'message'} reportedType
 * @param {string} targetId
 * @param {() => void} onClose
 * @param {string} [title]
 * @param {string} [subtitle]
 */
export default function ReportContentModal({
  visible,
  reportedType,
  targetId,
  onClose,
  title,
  subtitle,
}) {
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetails('');
      setSubmitting(false);
    }
  }, [visible]);

  const defaultHeading =
    reportedType === 'comment'
      ? 'Kommentar melden'
      : reportedType === 'message'
        ? 'Nachricht melden'
        : 'Profil melden';

  const defaultIntro =
    reportedType === 'profile'
      ? 'Melde dieses Profil, wenn es gegen unsere Regeln verstößt. Wir prüfen jede Meldung.'
      : 'Hilf uns, die Community sicher zu halten. Deine Meldung wird vertraulich geprüft.';

  const heading = title ?? defaultHeading;
  const intro = subtitle ?? defaultIntro;

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Grund fehlt', 'Bitte wähle einen Meldegrund.');
      return;
    }
    if (!targetId) {
      Alert.alert('Fehler', 'Ziel der Meldung fehlt.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        reportedType,
        targetId,
        reason,
        details,
      });
      Alert.alert(
        'Meldung gesendet',
        'Danke. Unser Team prüft deine Meldung so schnell wie möglich.',
        [{ text: 'OK', onPress: onClose }],
      );
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Meldung konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={submitting ? undefined : onClose}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Flag size={18} color={R} />
            <Text style={styles.title}>{heading}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={8}
            disabled={submitting}
            accessibilityLabel="Schließen"
          >
            <X size={22} color={B} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>{intro}</Text>

          <Text style={styles.sectionTitle}>GRUND</Text>
          <View style={styles.chipRow}>
            {REPORT_REASONS.map((key) => {
              const selected = reason === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setReason(key)}
                  activeOpacity={0.8}
                  disabled={submitting}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {REPORT_REASON_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            DETAILS{reason === 'other' ? ' (PFLICHT)' : ' (OPTIONAL)'}
          </Text>
          <TextInput
            style={styles.input}
            value={details}
            onChangeText={setDetails}
            placeholder={
              reason === 'other'
                ? 'Bitte kurz beschreiben, warum du meldest…'
                : 'Optional: weitere Hinweise für unser Team…'
            }
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
            editable={!submitting}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Meldung absenden</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: B, fontSize: 18, fontWeight: '900' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  intro: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 22,
  },
  sectionTitle: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipSelected: {
    backgroundColor: R,
    borderColor: R,
  },
  chipText: { color: B, fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: '#FFFFFF' },
  input: {
    minHeight: 110,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: B,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
