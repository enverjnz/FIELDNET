import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { OnboardingData } from '../PlayerOnboardingFlow';
import { Field } from './Step2_BasicInfo';

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P', 'LS'];
const GENDERS = ['Männlich', 'Weiblich', 'Divers'];

export default function Step4_AthleticProfile({
  data,
  update,
  onBack,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Deine{'\n'}Spielerinformationen</Text>
      <Text style={styles.subtitle}>Optional – du kannst das später ergänzen.</Text>

      <Text style={styles.fieldLabel}>POSITION</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipScrollContent}
      >
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[styles.chip, data.position === pos && styles.chipActive]}
            onPress={() => update({ position: data.position === pos ? '' : pos })}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, data.position === pos && styles.chipTextActive]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Field
        label="Trikotnummer"
        value={data.jerseyNumber}
        onChangeText={(v) => update({ jerseyNumber: v })}
        placeholder="z.B. 12"
      />

      <Text style={styles.fieldLabel}>GESCHLECHT</Text>
      <View style={styles.genderRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderChip, data.gender === g && styles.chipActive]}
            onPress={() => update({ gender: data.gender === g ? '' : g })}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, data.gender === g && styles.chipTextActive]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.twoCol}>
        <View style={styles.colField}>
          <Field
            label="Alter"
            value={data.age}
            onChangeText={(v) => update({ age: v })}
            placeholder="z.B. 22"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.colField}>
          <Field
            label="Nationalität"
            value={data.nationality}
            onChangeText={(v) => update({ nationality: v })}
            placeholder="z.B. Deutsch"
          />
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={styles.colField}>
          <Field
            label="Gewicht (kg)"
            value={data.weight}
            onChangeText={(v) => update({ weight: v })}
            placeholder="z.B. 85"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.colField}>
          <Field
            label="Größe (cm)"
            value={data.height}
            onChangeText={(v) => update({ height: v })}
            placeholder="z.B. 182"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={onBack}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          <Text style={styles.btnSecondaryText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, isSubmitting && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0A0E1A" />
          ) : (
            <Text style={styles.btnText}>Registrierung abschließen ✓</Text>
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
  title: { color: B, fontSize: 26, fontWeight: '800', lineHeight: 34, marginBottom: 6 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 24 },
  fieldLabel: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase',
  },
  chipScroll: { marginBottom: 20 },
  chipScrollContent: { paddingRight: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#F0F4FF', borderRadius: 20, marginRight: 8,
    borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  chipActive: { backgroundColor: B, borderColor: B },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  genderChip: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  colField: { flex: 1 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 2, backgroundColor: R, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  btnSecondary: {
    flex: 1, backgroundColor: '#F0F4FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  btnSecondaryText: { color: B, fontSize: 15, fontWeight: '700' },
});
