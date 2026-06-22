import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Clock } from 'lucide-react-native';

type Props = { onContinue: () => void };

export default function PendingScreen({ onContinue }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Clock size={48} color="#1A2F6E" />
        </View>

        <Text style={styles.title}>Anfrage eingereicht!</Text>
        <Text style={styles.body}>
          Deine Anfrage läuft noch.{'\n\n'}
          Sobald ein Admin dich bestätigt,{'\n'}
          siehst du alle Teaminhalte.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ausstehend</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={styles.btnText}>Zur App →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#F0F4FF', justifyContent: 'center',
    alignItems: 'center', borderWidth: 2, borderColor: B, marginBottom: 28,
  },
  title: { color: B, fontSize: 28, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  body: { color: '#6B7280', fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 32 },
  card: {
    backgroundColor: '#F0F4FF', borderRadius: 14, padding: 18,
    borderWidth: 1.5, borderColor: '#D1D8F0', alignSelf: 'stretch', marginBottom: 40,
  },
  cardLabel: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  statusText: { color: '#D97706', fontSize: 14, fontWeight: '700' },
  btn: {
    backgroundColor: R, borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 40, alignSelf: 'stretch', alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
