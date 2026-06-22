import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

type Props = {
  onBack: () => void;
  onSubmit: (email: string, password: string) => void;
  isSubmitting: boolean;
};

export default function Step5_AccountCreate({ onBack, onSubmit, isSubmitting }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'E-Mail ist Pflicht.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Ungültige E-Mail-Adresse.';
    if (!password) e.password = 'Passwort ist Pflicht.';
    else if (password.length < 8) e.password = 'Mindestens 8 Zeichen.';
    if (!passwordConfirm) e.passwordConfirm = 'Bitte Passwort bestätigen.';
    else if (password !== passwordConfirm) e.passwordConfirm = 'Passwörter stimmen nicht überein.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(email.trim(), password);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Konto erstellen</Text>
      <Text style={styles.subtitle}>Fast geschafft! Gib deine Zugangsdaten ein.</Text>

      {/* EMAIL */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>E-MAIL *</Text>
        <TextInput
          style={[styles.input, !!errors.email && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          placeholder="deine@email.de"
          placeholderTextColor="#4A5568"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
      </View>

      {/* PASSWORT */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>PASSWORT *</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 8 Zeichen"
            placeholderTextColor="#4A5568"
            secureTextEntry={!showPw}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPw((v) => !v)}
            activeOpacity={0.7}
          >
            {showPw ? (
              <EyeOff size={18} color="#1A2F6E" />
            ) : (
              <Eye size={18} color="#1A2F6E" />
            )}
          </TouchableOpacity>
        </View>
        {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}
      </View>

      {/* PASSWORT BESTÄTIGEN */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>PASSWORT BESTÄTIGEN *</Text>
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
            placeholderTextColor="#4A5568"
            secureTextEntry={!showPwConfirm}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPwConfirm((v) => !v)}
            activeOpacity={0.7}
          >
            {showPwConfirm ? (
              <EyeOff size={18} color="#1A2F6E" />
            ) : (
              <Eye size={18} color="#1A2F6E" />
            )}
          </TouchableOpacity>
        </View>
        {!!errors.passwordConfirm && (
          <Text style={styles.error}>{errors.passwordConfirm}</Text>
        )}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnSecondary} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, isSubmitting && styles.btnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0A0E1A" />
          ) : (
            <Text style={styles.btnText}>Registrieren ✓</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title: { color: B, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 20 },
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
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, backgroundColor: R, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnSecondary: {
    flex: 1, backgroundColor: '#F0F4FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  btnSecondaryText: { color: B, fontSize: 15, fontWeight: '700' },
});
