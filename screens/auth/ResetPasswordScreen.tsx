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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { updateAccountPassword } from '../../lib/passwordReset';
import {
  AUTH_CONTENT_INDENT,
  AUTH_BUTTON_SIDE_INSET,
  authBackgroundStyles,
} from './authScreenLayout';

type Props = {
  onComplete: () => void;
};

export default function ResetPasswordScreen({ onComplete }: Props) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; passwordConfirm?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!password) next.password = 'Passwort ist Pflicht.';
    else if (password.length < 8) next.password = 'Mindestens 8 Zeichen.';
    if (!passwordConfirm) next.passwordConfirm = 'Bitte Passwort bestätigen.';
    else if (password !== passwordConfirm) next.passwordConfirm = 'Passwörter stimmen nicht überein.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await updateAccountPassword(password);
      if (error) throw new Error(error);

      Alert.alert(
        'Passwort geändert',
        'Dein neues Passwort wurde gespeichert. Du kannst dich jetzt damit anmelden.',
        [{ text: 'OK', onPress: onComplete }],
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Speichern fehlgeschlagen.';
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

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
            <Text style={styles.title}>Neues Passwort</Text>
            <Text style={styles.subtitle}>
              Wähle ein neues Passwort für dein FIELDNET-Konto.
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>NEUES PASSWORT</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mindestens 8 Zeichen"
                  placeholderTextColor="rgba(26, 47, 110, 0.45)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  editable={!loading}
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
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>NEUES PASSWORT BESTÄTIGEN</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    !!errors.passwordConfirm && styles.inputError,
                  ]}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  placeholder="Passwort wiederholen"
                  placeholderTextColor="rgba(26, 47, 110, 0.45)"
                  secureTextEntry={!showPasswordConfirm}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPasswordConfirm((v) => !v)}
                  activeOpacity={0.7}
                >
                  {showPasswordConfirm ? (
                    <EyeOff size={18} color="#4A5568" />
                  ) : (
                    <Eye size={18} color="#4A5568" />
                  )}
                </TouchableOpacity>
              </View>
              {!!errors.passwordConfirm && (
                <Text style={styles.error}>{errors.passwordConfirm}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnPrimaryText}>Passwort speichern</Text>
              )}
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
  btnPrimary: {
    backgroundColor: R,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginRight: AUTH_BUTTON_SIDE_INSET - AUTH_CONTENT_INDENT,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
