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
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

type Props = {
  onBack: () => void;
  onSuccess: () => void;
};

export default function LoginScreen({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const msg =
        err?.message?.includes('Network request failed')
          ? 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.'
          : err?.message ?? 'Bitte überprüfe deine Eingaben.';
      Alert.alert('Login fehlgeschlagen', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Zurück</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/fieldnet_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Einloggen</Text>
        <Text style={styles.subtitle}>Willkommen zurück! Bitte melde dich an.</Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>E-MAIL</Text>
          <TextInput
            style={[styles.input, !!errors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.de"
            placeholderTextColor="#4A5568"
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
              placeholderTextColor="#4A5568"
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
                <EyeOff size={18} color="#7C8BA1" />
              ) : (
                <Eye size={18} color="#7C8BA1" />
              )}
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}
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
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { color: B, fontSize: 14, fontWeight: '600' },
  logoImage: { width: 180, height: 130, alignSelf: 'center', marginBottom: 24 },
  title: { color: B, fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 32, lineHeight: 20 },
  fieldWrap: { marginBottom: 16 },
  label: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F0F4FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    color: B, fontSize: 15, borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  inputError: { borderColor: R },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  error: { color: R, fontSize: 11, marginTop: 4 },
  btnPrimary: {
    backgroundColor: R, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 8, marginBottom: 20,
    shadowColor: R, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  registerHint: { alignItems: 'center' },
  registerHintText: { color: '#6B7280', fontSize: 13 },
  registerHintLink: { color: R, fontWeight: '700' },
});
