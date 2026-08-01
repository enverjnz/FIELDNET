import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import {
  resendSignupConfirmation,
  verifySignupEmailCode,
  isEmailConfirmed,
} from '../../lib/authRedirect';
import { finishPendingOnboardingIfNeeded } from '../../lib/completeOnboarding';
import { supabase } from '../../lib/supabase';
import {
  AUTH_BUTTON_SIDE_INSET,
  AUTH_CONTENT_INDENT,
  authBackgroundStyles,
} from './authScreenLayout';

type Props = {
  email: string;
  onBack: () => void;
  onVerified: (role?: 'player' | 'fan' | 'coach') => void;
};

const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;

export default function VerifyEmailScreen({ email, onBack, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (codeError) setCodeError(null);
  };

  const handleVerify = async () => {
    if (verifying) return;

    if (code.length !== CODE_LENGTH) {
      setCodeError(`Bitte gib den ${CODE_LENGTH}-stelligen Code ein.`);
      return;
    }

    setVerifying(true);
    try {
      const { error } = await verifySignupEmailCode(email, code);
      if (error) throw new Error(error);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isEmailConfirmed(user)) {
        throw new Error('E-Mail konnte nicht bestätigt werden. Bitte versuche es erneut.');
      }

      const result = await finishPendingOnboardingIfNeeded();
      onVerified(result.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bestätigung fehlgeschlagen.';
      setCodeError(message);
      Alert.alert('Fehler', message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;

    setResending(true);
    try {
      const { error } = await resendSignupConfirmation(email);
      if (error) throw new Error(error);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setCode('');
      setCodeError(null);
      inputRef.current?.focus();
      Alert.alert(
        'Code gesendet',
        'Wir haben dir einen neuen Bestätigungscode per E-Mail geschickt.',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Senden fehlgeschlagen.';
      Alert.alert('Fehler', message);
    } finally {
      setResending(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/bg_01.jpg')}
      style={authBackgroundStyles.background}
      resizeMode="cover"
    >
      <View style={authBackgroundStyles.overlay} />
      <SafeAreaView style={authBackgroundStyles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconWrap}>
              <Mail size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>E-Mail bestätigen</Text>
            <Text style={styles.body}>
              Wir haben einen {CODE_LENGTH}-stelligen Code an{'\n'}
              <Text style={styles.email}>{email}</Text>
              {'\n\n'}
              gib ihn hier ein, um dein Konto zu aktivieren.
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>BESTÄTIGUNGSCODE</Text>
              <TextInput
                ref={inputRef}
                style={[styles.codeInput, !!codeError && styles.inputError]}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="000000"
                placeholderTextColor="rgba(26, 47, 110, 0.35)"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                autoFocus
              />
              {!!codeError && <Text style={styles.error}>{codeError}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, verifying && styles.btnDisabled]}
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnPrimaryText}>Code bestätigen</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                (resending || resendCooldown > 0) && styles.btnDisabled,
              ]}
              onPress={handleResend}
              activeOpacity={0.85}
              disabled={resending || resendCooldown > 0}
            >
              {resending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : resendCooldown > 0 ? (
                <Text style={styles.secondaryBtnText}>
                  Neuen Code senden in {resendCooldown}s
                </Text>
              ) : (
                <Text style={styles.secondaryBtnText}>Neuen Code senden</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
              <Text style={styles.backLink}>Zurück</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingLeft: AUTH_CONTENT_INDENT,
    paddingVertical: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  email: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fieldWrap: {
    marginBottom: 20,
    marginRight: AUTH_BUTTON_SIDE_INSET - AUTH_CONTENT_INDENT,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    color: B,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  inputError: {
    borderColor: R,
  },
  error: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginRight: AUTH_BUTTON_SIDE_INSET - AUTH_CONTENT_INDENT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    marginBottom: 24,
    marginRight: AUTH_BUTTON_SIDE_INSET - AUTH_CONTENT_INDENT,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  backLink: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
