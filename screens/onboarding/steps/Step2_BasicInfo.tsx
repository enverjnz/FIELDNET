import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { OnboardingData } from '../PlayerOnboardingFlow';

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2_BasicInfo({ data, update, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung fehlt', 'Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      update({ avatarUri: result.assets[0].uri });
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!data.firstName.trim()) e.firstName = 'Vorname ist Pflicht.';
    if (!data.lastName.trim()) e.lastName = 'Nachname ist Pflicht.';
    if (Object.keys(e).length) {
      setErrors(e);
      return false;
    }
    setErrors({});
    return true;
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Wer bist du?</Text>
      <Text style={styles.subtitle}>Erzähl uns etwas über dich.</Text>

      <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
        {data.avatarUri ? (
          <Image source={{ uri: data.avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Camera size={28} color="#1A2F6E" />
            <Text style={styles.avatarHint}>Foto auswählen</Text>
          </View>
        )}
      </TouchableOpacity>

      <Field
        label="Vorname *"
        value={data.firstName}
        onChangeText={(v) => update({ firstName: v })}
        placeholder="Max"
        error={errors.firstName}
      />
      <Field
        label="Nachname *"
        value={data.lastName}
        onChangeText={(v) => update({ lastName: v })}
        placeholder="Mustermann"
        error={errors.lastName}
      />
      <Field
        label="Bio"
        value={data.bio}
        onChangeText={(v) => update({ bio: v })}
        placeholder="Erzähl etwas über dich…"
        multiline
        numberOfLines={4}
      />

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnSecondary} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => validate() && onNext()}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Weiter →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Reusable Field ─────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  error,
  keyboardType,
}: FieldProps) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          !!error && fieldStyles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4A5568"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title: { color: B, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 24 },
  avatarWrap: { alignSelf: 'center', marginBottom: 28 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: B },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F0F4FF', borderWidth: 2, borderColor: '#D1D8F0',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  avatarHint: { color: '#6B7280', fontSize: 10, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, backgroundColor: R, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnSecondary: {
    flex: 1, backgroundColor: '#F0F4FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  btnSecondaryText: { color: B, fontSize: 15, fontWeight: '700' },
});

export const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F0F4FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    color: B, fontSize: 15, borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  multiline: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: R },
  error: { color: R, fontSize: 11, marginTop: 4 },
});
