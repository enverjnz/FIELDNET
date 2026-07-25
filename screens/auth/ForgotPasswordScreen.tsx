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
  Image,
  ImageBackground,
} from 'react-native';
import { requestPasswordResetEmail } from '../../lib/passwordReset';
import {
  AUTH_CONTENT_INDENT,
  AUTH_BUTTON_SIDE_INSET,
  authBackgroundStyles,
} from './authScreenLayout';

type Props = {
  initialEmail?: string;
  onBack: () => void;
  onEmailSent?: () => void;
};

export default function ForgotPasswordScreen({ initialEmail = '', onBack, onEmailSent }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('E-Mail ist Pflicht.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailError('Ungültige E-Mail-Adresse.');
      return;
    }

    setEmailError(null);
    setLoading(true);
    try {
      const { error } = await requestPasswordResetEmail(trimmed);
      if (error) throw new Error(error);
      setSent(true);
      onEmailSent?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Senden fehlgeschlagen.';
      Alert.alert('Fehler', message);
    } finally {
      setLoading(false);
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

        <View style={authBackgroundStyles.logoSection}>
          <Image
            source={require('../../assets/fieldnet_logo.png')}
            style={authBackgroundStyles.logoImage}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Passwort zurücksetzen</Text>
          {sent ? (
            <>
              <Text style={styles.subtitle}>
                Wir haben dir eine E-Mail an{'\n'}
                <Text style={styles.emailHighlight}>{email.trim()}</Text>
                {'\n\n'}
                geschickt. Klicke den Link in der Mail — du wirst zur App weitergeleitet und
                kannst dort ein neues Passwort setzen.
              </Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={onBack} activeOpacity={0.85}>
                <Text style={styles.btnPrimaryText}>Zurück zum Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Gib deine E-Mail-Adresse ein. Du erhältst einen Link zum Festlegen eines neuen
                Passworts.
              </Text>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>E-MAIL</Text>
                <TextInput
                  style={[styles.input, !!emailError && styles.inputError]}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="deine@email.de"
                  placeholderTextColor="rgba(26, 47, 110, 0.45)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
                {!!emailError && <Text style={styles.error}>{emailError}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleSend}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Link senden</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
                <Text style={styles.backLink}>Zurück</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  formScroll: { flex: 1 },
  formContent: {
    flexGrow: 1,
    paddingLeft: AUTH_CONTENT_INDENT,
    paddingRight: 28,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 22,
  },
  emailHighlight: { color: '#FFFFFF', fontWeight: '800' },
  fieldWrap: { marginBottom: 16 },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: B,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  inputError: { borderColor: R },
  error: { color: '#FCA5A5', fontSize: 11, marginTop: 4 },
  btnPrimary: {
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    marginRight: AUTH_BUTTON_SIDE_INSET - AUTH_CONTENT_INDENT,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  backLink: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
