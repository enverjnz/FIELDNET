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
import { Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import {
  AUTH_BUTTON_SIDE_INSET,
  AUTH_CONTENT_INDENT,
  authBackgroundStyles,
} from './authScreenLayout';

type Props = {
  onBack: () => void;
  onSuccess: () => void;
  onNeedsVerification?: (email: string) => void;
  onForgotPassword?: (email: string) => void;
};

export default function LoginScreen({ onBack, onSuccess, onNeedsVerification, onForgotPassword }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'E-Mail ist Pflicht.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Ungültige E-Mail-Adresse.';
    if (!password) e.password = 'Passwort ist Pflicht.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      const raw = err?.message ?? '';
      const lower = raw.toLowerCase();
      if (lower.includes('email not confirmed') || lower.includes('email not verified')) {
        onNeedsVerification?.(email.trim());
        return;
      }
      const msg =
        raw.includes('Network request failed')
          ? 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.'
          : raw || 'Bitte überprüfe deine Eingaben.';

      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts === 1 && onForgotPassword) {
        Alert.alert('Login fehlgeschlagen', msg, [
          { text: 'Erneut versuchen', style: 'cancel' },
          {
            text: 'Passwort zurücksetzen',
            onPress: () => onForgotPassword(email.trim()),
          },
        ]);
      } else {
        Alert.alert('Login fehlgeschlagen', msg);
      }
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
          <Text style={styles.title}>Einloggen</Text>
          <Text style={styles.subtitle}>Willkommen zurück! Bitte melde dich an.</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>E-MAIL</Text>
            <TextInput
              style={[styles.input, !!errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="deine@email.de"
              placeholderTextColor="rgba(26, 47, 110, 0.45)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>PASSWORT</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
                value={password}
                onChangeText={setPassword}
                placeholder="Dein Passwort"
                placeholderTextColor="rgba(26, 47, 110, 0.45)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#4A5568" />
                ) : (
                  <Eye size={18} color="#4A5568" />
                )}
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}
            {failedAttempts >= 1 && onForgotPassword ? (
              <TouchableOpacity
                style={styles.forgotLinkWrap}
                onPress={() => onForgotPassword(email.trim())}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotLink}>Passwort vergessen?</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnPrimaryText}>Einloggen</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerHint} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.registerHintText}>
              Noch kein Konto?{' '}
              <Text style={styles.registerHintLink}>Jetzt registrieren</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    paddingLeft: AUTH_CONTENT_INDENT,
    paddingRight: 28,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginBottom: 28, lineHeight: 20 },
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
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  error: { color: '#FCA5A5', fontSize: 11, marginTop: 4 },
  forgotLinkWrap: { marginTop: 10, alignSelf: 'flex-start' },
  forgotLink: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  btnPrimary: {
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    marginRight: AUTH_BUTTON_SIDE_INSET - AUTH_CONTENT_INDENT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  registerHint: { alignItems: 'flex-start' },
  registerHintText: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 13 },
  registerHintLink: { color: '#FFFFFF', fontWeight: '700', textDecorationLine: 'underline' },
});
