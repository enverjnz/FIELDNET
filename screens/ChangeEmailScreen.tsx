import React, { useCallback, useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Mail } from 'lucide-react-native';
import { requestEmailChange } from '../lib/changeEmail';
import { useTheme } from '../context/ThemeContext';

type Props = {
  currentEmail: string;
  onBack: () => void;
};

const RESEND_COOLDOWN_SECONDS = 60;
const COOLDOWN_STORAGE_KEY = 'fieldnet:email-change-cooldown-until';

function formatCooldown(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

async function readCooldownRemaining(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!raw) return 0;
    const until = Number.parseInt(raw, 10);
    if (Number.isNaN(until)) return 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

async function persistCooldown(): Promise<number> {
  const until = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
  await AsyncStorage.setItem(COOLDOWN_STORAGE_KEY, String(until));
  return RESEND_COOLDOWN_SECONDS;
}

export default function ChangeEmailScreen({ currentEmail, onBack }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let active = true;

    readCooldownRemaining().then((remaining) => {
      if (active && remaining > 0) {
        setResendCooldown(remaining);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const startCooldown = useCallback(async () => {
    const seconds = await persistCooldown();
    setResendCooldown(seconds);
  }, []);

  const sendEmailChange = async (targetEmail: string) => {
    const { error } = await requestEmailChange(targetEmail);
    if (error) throw new Error(error);
    await startCooldown();
    setSent(true);
  };

  const handleSubmit = async () => {
    if (resendCooldown > 0) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('E-Mail ist Pflicht.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailError('Ungültige E-Mail-Adresse.');
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.trim().toLowerCase()) {
      setEmailError('Das ist bereits deine aktuelle E-Mail-Adresse.');
      return;
    }

    setEmailError(null);
    setLoading(true);
    try {
      await sendEmailChange(trimmed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ändern fehlgeschlagen.';
      Alert.alert('Fehler', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || resendCooldown > 0) return;

    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await sendEmailChange(trimmed);
      Alert.alert(
        'E-Mails gesendet',
        'Wir haben dir erneut einen Bestätigungslink und eine Info-Mail geschickt.',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Senden fehlgeschlagen.';
      Alert.alert('Fehler', message);
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled = loading || resendCooldown > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>E-Mail ändern</Text>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {sent ? (
          <>
            <View style={styles.iconWrap}>
              <Mail size={28} color={colors.text} />
            </View>
            <Text style={styles.heading}>E-Mails gesendet</Text>
            <Text style={styles.body}>
              An deine neue Adresse{'\n'}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>
              {'\n\n'}
              haben wir einen Bestätigungslink geschickt. Öffne die E-Mail auf diesem Gerät und
              tippe auf den Link — die neue Adresse wird erst danach aktiv.
              {'\n\n'}
              An deine bisherige Adresse{'\n'}
              <Text style={styles.emailHighlight}>{currentEmail || '–'}</Text>
              {'\n\n'}
              haben wir nur eine Info geschickt (ohne Bestätigungslink).
            </Text>
            {resendCooldown > 0 ? (
              <Text style={styles.cooldownHint}>
                Erneut senden möglich in {formatCooldown(resendCooldown)}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                submitDisabled && styles.btnDisabled,
              ]}
              onPress={handleResend}
              activeOpacity={0.85}
              disabled={submitDisabled}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : resendCooldown > 0 ? (
                <Text style={styles.secondaryBtnText}>
                  Erneut senden in {formatCooldown(resendCooldown)}
                </Text>
              ) : (
                <Text style={styles.secondaryBtnText}>E-Mails erneut senden</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onBack} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Zurück zum Konto</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.body}>
              Aktuelle E-Mail:{'\n'}
              <Text style={styles.emailHighlight}>{currentEmail || '–'}</Text>
              {'\n\n'}
              Gib deine neue Adresse ein. An die neue Adresse senden wir einen Bestätigungslink,
              an deine bisherige Adresse nur eine Info.
            </Text>

            <Text style={styles.label}>NEUE E-MAIL</Text>
            <TextInput
              style={[styles.input, !!emailError && styles.inputError]}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(null);
              }}
              placeholder="neue@email.de"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!loading}
            />
            {!!emailError && <Text style={styles.error}>{emailError}</Text>}
            {resendCooldown > 0 ? (
              <Text style={styles.cooldownHint}>
                Erneut senden möglich in {formatCooldown(resendCooldown)}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, submitDisabled && styles.btnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitDisabled}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : resendCooldown > 0 ? (
                <Text style={styles.primaryBtnText}>
                  Erneut senden in {formatCooldown(resendCooldown)}
                </Text>
              ) : (
                <Text style={styles.primaryBtnText}>Bestätigungslink senden</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { color: c.text, fontSize: 22, fontWeight: '900' },
    scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 20,
    },
    heading: {
      color: c.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 12,
    },
    body: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 24,
    },
    emailHighlight: { color: c.text, fontWeight: '800' },
    label: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    input: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: c.text,
      fontSize: 15,
      marginBottom: 8,
    },
    inputError: { borderColor: c.accent },
    error: { color: c.accent, fontSize: 12, marginBottom: 8 },
    cooldownHint: {
      color: c.textMuted,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 8,
    },
    primaryBtn: {
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 12,
    },
    primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    secondaryBtn: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 12,
    },
    secondaryBtnText: { color: c.text, fontSize: 14, fontWeight: '800' },
    btnDisabled: { opacity: 0.6 },
  });
}
