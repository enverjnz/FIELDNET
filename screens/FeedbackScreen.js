import React, { useMemo, useState } from 'react';
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
import { X, Send, Sparkles, CheckCircle2, Info } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { FEEDBACK_CATEGORIES, submitFeedbackReport } from '../lib/feedbackReport';

function createStyles(c) {
  const isDark = c.mode === 'dark';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { color: c.text, fontSize: 20, fontWeight: '900' },
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

    heroCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      marginBottom: 22,
    },
    heroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDark ? '#243049' : '#E8EDF8',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    heroTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: '900',
      marginBottom: 8,
    },
    heroText: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '500',
    },

    hintBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: isDark ? '#151D30' : '#F8FAFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 24,
    },
    hintText: {
      flex: 1,
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
    },

    sectionTitle: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      marginBottom: 10,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    chip: {
      backgroundColor: c.chipBg,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    chipSelected: {
      backgroundColor: c.chipSelectedBg,
      borderColor: c.chipSelectedBg,
    },
    chipText: {
      color: c.chipText,
      fontSize: 13,
      fontWeight: '700',
    },
    chipTextSelected: {
      color: c.chipTextSelected,
    },

    messageInput: {
      minHeight: 160,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.text,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500',
    },
    charCount: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'right',
      marginTop: 8,
      marginBottom: 24,
    },

    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.accent,
      borderRadius: 16,
      paddingVertical: 17,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    submitBtnDisabled: { opacity: 0.65 },
    submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

    successCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: isDark ? '#142A1F' : '#ECFDF5',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDark ? '#1F4D38' : '#A7F3D0',
      padding: 16,
      marginBottom: 20,
    },
    successTitle: {
      color: isDark ? '#6EE7B7' : '#047857',
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    },
    successText: {
      color: isDark ? '#A7F3D0' : '#065F46',
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
    },
    successDismiss: {
      marginTop: 10,
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    successDismissText: {
      color: isDark ? '#6EE7B7' : '#047857',
      fontSize: 12,
      fontWeight: '700',
    },
  });
}

function CategoryChip({ label, selected, onPress, disabled, styles }) {
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

export default function FeedbackScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Kategorie fehlt', 'Bitte wähle eine Kategorie für dein Feedback.');
      return;
    }

    setSubmitting(true);
    setSuccess(null);

    try {
      const result = await submitFeedbackReport(category, message);

      setCategory(null);
      setMessage('');

      const successMessage = result.emailSent
        ? 'Dein Feedback wurde gespeichert und an unser Team weitergeleitet. Vielen Dank!'
        : 'Dein Feedback wurde gespeichert. Vielen Dank für deine Idee!';

      setSuccess({ title: 'Feedback gesendet', message: successMessage });

      Alert.alert('Danke!', successMessage);
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Feedback konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={20} color={colors.accent} />
          <Text style={styles.title}>Feedback geben</Text>
        </View>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7} disabled={submitting}>
          <X size={22} color={colors.text} />
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
          {success && (
            <View style={styles.successCard}>
              <CheckCircle2 size={22} color={colors.mode === 'dark' ? '#6EE7B7' : '#047857'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>{success.title}</Text>
                <Text style={styles.successText}>{success.message}</Text>
                <TouchableOpacity
                  style={styles.successDismiss}
                  onPress={() => setSuccess(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.successDismissText}>Schließen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Sparkles size={22} color={colors.text} />
            </View>
            <Text style={styles.heroTitle}>Deine Ideen machen FIELDNET besser</Text>
            <Text style={styles.heroText}>
              Teile uns Feature-Wünsche, Verbesserungsvorschläge, Fragen oder Lob mit.
              Wir freuen uns über jedes ehrliche Feedback aus der Community.
            </Text>
          </View>

          <View style={styles.hintBox}>
            <Info size={16} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={styles.hintText}>
              Für Fehler und technische Probleme nutze bitte „Problem melden“ im Menü —
              dieser Bereich ist nur für Ideen und Feedback gedacht.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>KATEGORIE</Text>
          <View style={styles.chipRow}>
            {FEEDBACK_CATEGORIES.map((item) => (
              <CategoryChip
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
                disabled={submitting}
                styles={styles}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>DEINE NACHRICHT</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Was wünschst du dir? Was gefällt dir besonders?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={8}
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
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Wird gesendet…</Text>
              </>
            ) : (
              <>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Feedback senden</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
