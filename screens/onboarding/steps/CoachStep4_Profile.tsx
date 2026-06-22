import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { OnboardingData } from '../PlayerOnboardingFlow';
import { Field } from './Step2_BasicInfo';

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
};

const COACHING_ROLES = [
  'Head Coach',
  'Offensive Coordinator',
  'Defensive Coordinator',
  'Special Teams',
  'Quarterback Coach',
  'Line Coach',
  'Assistenztrainer',
];

const LICENSES = [
  'Keine',
  'Level 1',
  'Level 2',
  'GFL-Lizenz',
  'DFB B-Lizenz',
  'DFB A-Lizenz',
];

const SPECIALIZATIONS = ['Offense', 'Defense', 'Special Teams', 'Allrounder'];

export default function CoachStep4_Profile({ data, update, onNext, onBack }: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Dein{'\n'}Trainerprofil</Text>
      <Text style={styles.subtitle}>Optional – du kannst das später ergänzen.</Text>

      {/* Coaching Role */}
      <Text style={styles.sectionLabel}>FUNKTION IM TEAM</Text>
      <View style={styles.chipGrid}>
        {COACHING_ROLES.map((role) => {
          const active = data.coachingRole === role;
          return (
            <TouchableOpacity
              key={role}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => update({ coachingRole: active ? '' : role })}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{role}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Specialization */}
      <Text style={styles.sectionLabel}>SPEZIALISIERUNG</Text>
      <View style={styles.chipRow}>
        {SPECIALIZATIONS.map((spec) => {
          const active = data.coachingSpecialization === spec;
          return (
            <TouchableOpacity
              key={spec}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => update({ coachingSpecialization: active ? '' : spec })}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{spec}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* License */}
      <Text style={styles.sectionLabel}>LIZENZ / QUALIFIKATION</Text>
      <View style={styles.chipGrid}>
        {LICENSES.map((lic) => {
          const active = data.coachingLicense === lic;
          return (
            <TouchableOpacity
              key={lic}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => update({ coachingLicense: active ? '' : lic })}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{lic}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Experience */}
      <Field
        label="Coaching-Erfahrung (Jahre)"
        value={data.coachingExperience}
        onChangeText={(v) => update({ coachingExperience: v })}
        placeholder="z.B. 5"
        keyboardType="numeric"
      />

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnSecondary} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>Weiter →</Text>
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
  sectionLabel: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: '#F0F4FF', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  chipActive: { backgroundColor: B, borderColor: B },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, backgroundColor: R, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnSecondary: {
    flex: 1, backgroundColor: '#F0F4FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  btnSecondaryText: { color: B, fontSize: 15, fontWeight: '700' },
});
