import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { User, Users, Star } from 'lucide-react-native';
import { OnboardingData } from '../PlayerOnboardingFlow';

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
};

const ROLES = [
  {
    key: 'player' as const,
    label: 'Spieler',
    description: 'Du spielst aktiv in einem Team und möchtest Statistiken, dein Team und dein Profil verwalten.',
    Icon: User,
  },
  {
    key: 'coach' as const,
    label: 'Trainer / Coach',
    description: 'Du leitest oder betreust ein Team und verwaltest Spielerprofile sowie Taktiken.',
    Icon: Users,
  },
  {
    key: 'fan' as const,
    label: 'Fan',
    description: 'Du verfolgst Teams und Spiele, kommentierst und bleibst immer auf dem Laufenden.',
    Icon: Star,
  },
] as const;

export default function Step1_RoleSelect({ data, update, onNext }: Props) {
  const selectedRole = data.role;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Als was möchtest du{'\n'}dich registrieren?</Text>
      <Text style={styles.subtitle}>
        Wähle deine Rolle. Du kannst sie später in deinem Profil ändern.
      </Text>

      <View style={styles.cards}>
        {ROLES.map(({ key, label, description, Icon }) => {
          const isSelected = selectedRole === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => update({ role: key })}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                <Icon size={22} color={isSelected ? '#FFFFFF' : '#6B7280'} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {label}
                  {isSelected && <Text style={styles.badge}> · Ausgewählt</Text>}
                </Text>
                <Text style={styles.cardDesc}>{description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.btnText}>
          {selectedRole === 'fan'
            ? 'Weiter als Fan →'
            : selectedRole === 'coach'
            ? 'Weiter als Trainer →'
            : 'Weiter als Spieler →'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title: { color: B, fontSize: 26, fontWeight: '800', lineHeight: 34, marginBottom: 10 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 32, lineHeight: 20 },
  cards: { gap: 12, marginBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 14,
    padding: 16, borderWidth: 1.5, borderColor: '#D1D8F0',
  },
  cardSelected: { borderColor: B, backgroundColor: '#E8EDF8' },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#D1D8F0', justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  iconWrapSelected: { backgroundColor: B },
  cardText: { flex: 1 },
  cardLabel: { color: '#6B7280', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardLabelSelected: { color: B },
  cardDesc: { color: '#9CA3AF', fontSize: 12, lineHeight: 17 },
  badge: { color: R, fontSize: 11, fontWeight: '600' },
  btn: { backgroundColor: R, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
