import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Hash, Trophy } from 'lucide-react-native';
import { verifyAndRedeemInvoiceCode } from '../lib/invoiceCode';
import { useTheme } from '../context/ThemeContext';
import { createInvoiceCodeStyles } from '../theme/verwaltungStyles';

type Props = {
  onBack: () => void;
  onSuccess: (inviteCodeId: string) => void;
};

export default function InvoiceCodeScreen({ onBack, onSuccess }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createInvoiceCodeStyles(colors), [colors]);

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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={colors.text} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Trophy size={36} color={colors.accent} />
        </View>

        <Text style={styles.title}>Rechnungscode eingeben</Text>
        <Text style={styles.subtitle}>
          Gib den Code aus deiner Anmeldegebühr ein, um deinen Verein anzulegen.
          Pro Code kann genau ein Team erstellt werden.
        </Text>

        <Text style={styles.label}>RECHNUNGSCODE</Text>
        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Hash size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase());
              setError(null);
            }}
            placeholder="z.B. FN-2026-ABC123"
            placeholderTextColor={colors.textMuted}
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
