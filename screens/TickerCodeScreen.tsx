import React, { useState, useMemo } from 'react';
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
import { Hash, Zap, X } from 'lucide-react-native';
import { validateTickerAccess, TickerGame } from '../lib/validateTickerAccess';
import { useTheme } from '../context/ThemeContext';
import { createTickerCodeStyles } from '../theme/tickerCodeStyles';

type Props = {
  onBack: () => void;
  onSuccess: (game: TickerGame) => void;
};

export default function TickerCodeScreen({ onBack, onSuccess }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createTickerCodeStyles(colors), [colors]);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await validateTickerAccess(code);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.game) {
        onSuccess(result.game);
      }
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

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live-Ticker</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Zap size={36} color={colors.accent} />
        </View>

        <Text style={styles.title}>Gameday-Code eingeben</Text>
        <Text style={styles.subtitle}>
          Gib den Ticker-Code ein, den dein Coach beim Spiel erstellen erhalten hat.
          Nur berechtigte Teammitglieder können den Live-Ticker starten.
        </Text>

        <Text style={styles.label}>TICKER-CODE</Text>
        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Hash size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase());
              setError(null);
            }}
            placeholder="z.B. TEAM-25062026-ABC"
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
            <Text style={styles.btnPrimaryText}>Ticker öffnen</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
