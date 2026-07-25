import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import { resendSignupConfirmation } from '../../lib/authRedirect';
import { finishPendingOnboardingIfNeeded } from '../../lib/completeOnboarding';
import { supabase } from '../../lib/supabase';
import { authBackgroundStyles } from './authScreenLayout';

type Props = {
  email: string;
  onBack: () => void;
  onVerified: (role?: 'player' | 'fan' | 'coach') => void;
};

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailScreen({ email, onBack, onVerified }: Props) {
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let active = true;

    const finishIfConfirmed = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user?.email_confirmed_at) return;

      setChecking(true);
      try {
        const result = await finishPendingOnboardingIfNeeded();
        if (active) onVerified(result.role);
      } finally {
        if (active) setChecking(false);
      }
    };

    finishIfConfirmed();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        finishIfConfirmed();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [onVerified]);

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;

    setResending(true);
    try {
      const { error } = await resendSignupConfirmation(email);
      if (error) throw new Error(error);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert(
        'E-Mail gesendet',
        'Wir haben dir einen neuen Bestätigungslink geschickt. Tippe auf den Link in der Mail.',
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

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Mail size={40} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>E-Mail bestätigen</Text>
          <Text style={styles.body}>
            Wir haben einen Bestätigungslink an{'\n'}
            <Text style={styles.email}>{email}</Text>
            {'\n\n'}
            geschickt. Öffne die E-Mail auf diesem Gerät und tippe auf den Link — du wirst
            zurück in die App geleitet.
          </Text>

          {checking ? (
            <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
          ) : null}

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
                Erneut senden in {resendCooldown}s
              </Text>
            ) : (
              <Text style={styles.secondaryBtnText}>Link erneut senden</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
            <Text style={styles.backLink}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
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
  spinner: {
    marginBottom: 16,
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    marginBottom: 24,
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
