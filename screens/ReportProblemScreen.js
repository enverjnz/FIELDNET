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
import { X, Send, AlertCircle } from 'lucide-react-native';
import { PROBLEM_CATEGORIES, submitProblemReport } from '../lib/reportProblem';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

function CategoryChip({ label, selected, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ReportProblemScreen({ onBack }) {
  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Kategorie fehlt', 'Bitte wähle eine Kategorie für deine Meldung.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitProblemReport(category, message);
      const successMessage = result.emailSent
        ? 'Danke! Deine Meldung wurde an unser Team gesendet.'
        : 'Danke! Deine Meldung wurde gespeichert. Wir melden uns bei dir.';

      Alert.alert('Meldung gesendet', successMessage, [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Meldung konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AlertCircle size={20} color={R} />
          <Text style={styles.title}>Problem melden</Text>
        </View>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7} disabled={submitting}>
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
            Beschreibe uns kurz, was nicht funktioniert. Wir kümmern uns so schnell wie möglich darum.
          </Text>

          <Text style={styles.sectionTitle}>KATEGORIE</Text>
          <View style={styles.chipRow}>
            {PROBLEM_CATEGORIES.map((item) => (
              <CategoryChip
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
                disabled={submitting}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>BESCHREIBUNG</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Was ist passiert? Was hast du erwartet?"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
            editable={!submitting}
          />
          <Text style={styles.charCount}>{message.length}/2000</Text>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Absenden</Text>
              </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: B, fontSize: 18, fontWeight: '900' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  intro: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 20,
  },
  sectionTitle: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: B,
    borderColor: B,
  },
  chipText: {
    color: B,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  messageInput: {
    minHeight: 140,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: B,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  charCount: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 24,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
