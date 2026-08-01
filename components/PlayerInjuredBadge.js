import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlayerInjuredBadge({ style }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>Verletzt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
  },
  text: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
