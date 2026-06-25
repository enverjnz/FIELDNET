import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Hash, Trophy } from 'lucide-react-native';
import { verifyAndRedeemInvoiceCode } from '../lib/invoiceCode';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

type Props = {
  onBack: () => void;
  onSuccess: (inviteCodeId: string) => void;
};

export default function InvoiceCodeScreen({ onBack, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await verifyAndRedeemInvoiceCode(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess(result.inviteCodeId);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message.includes('Network request failed')
            ? 'Keine Verbindung. Bitte prüfe deine Internetverbindung.'
            : err.message
          : 'Unbekannter Fehler.';
      Alert.alert('Fehler', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={B} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Trophy size={36} color={R} />
        </View>

        <Text style={styles.title}>Rechnungscode eingeben</Text>
        <Text style={styles.subtitle}>
          Gib den Code aus deiner Anmeldegebühr ein, um deinen Verein anzulegen.
          Pro Code kann genau ein Team erstellt werden.
        </Text>

        <Text style={styles.label}>RECHNUNGSCODE</Text>
        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Hash size={18} color={MUTED} />
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase());
              setError(null);
            }}
            placeholder="z.B. FN-2026-ABC123"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            editable={!loading}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnPrimaryText}>Code bestätigen</Text>
          )}
        </TouchableOpacity>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Co-Trainer?</Text>
          <Text style={styles.hintText}>
            Du möchtest einem bestehenden Team beitreten? Suche das Team in deinem Profil
            und stelle eine Trainer-Anfrage — kein Rechnungscode nötig.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtnText: { color: B, fontSize: 15, fontWeight: '600' },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: B,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: BG,
    marginBottom: 8,
  },
  inputWrapError: { borderColor: R },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: B,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  errorText: {
    color: R,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: B,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hintCard: {
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: B,
    marginBottom: 6,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
});
