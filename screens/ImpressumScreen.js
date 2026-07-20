import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { X, FileText } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { IMPRESSUM } from '../lib/impressumContent';

function createStyles(c) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    title: { color: c.text, fontSize: 18, fontWeight: '900' },
    scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
    pageTitle: {
      color: c.text,
      fontSize: 26,
      fontWeight: '900',
      marginBottom: 28,
      letterSpacing: -0.3,
    },
    section: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 16,
    },
    sectionLabel: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    line: {
      color: c.text,
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '600',
    },
    lineMuted: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '500',
      marginTop: 2,
    },
    contactRow: {
      marginTop: 10,
      gap: 6,
    },
    contactLabel: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    contactValue: {
      color: c.text,
      fontSize: 15,
      fontWeight: '700',
    },
    contactAccent: {
      color: c.accent,
    },
  });
}

function InfoSection({ label, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function ImpressumScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={20} color={colors.text} />
          <Text style={styles.title} numberOfLines={1}>Impressum</Text>
        </View>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Impressum</Text>

        <InfoSection label={IMPRESSUM.providerLabel} styles={styles}>
          <Text style={styles.line}>{IMPRESSUM.name}</Text>
          <Text style={styles.lineMuted}>{IMPRESSUM.street}</Text>
          <Text style={styles.lineMuted}>{IMPRESSUM.city}</Text>
        </InfoSection>

        <InfoSection label={IMPRESSUM.contactLabel} styles={styles}>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Telefon</Text>
            <Text style={styles.contactValue}>{IMPRESSUM.phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>E-Mail</Text>
            <Text style={[styles.contactValue, styles.contactAccent]}>{IMPRESSUM.email}</Text>
          </View>
        </InfoSection>

        <InfoSection label={IMPRESSUM.contentResponsibleLabel} styles={styles}>
          <Text style={styles.line}>{IMPRESSUM.name}</Text>
          <Text style={styles.lineMuted}>{IMPRESSUM.street}</Text>
          <Text style={styles.lineMuted}>{IMPRESSUM.city}</Text>
        </InfoSection>
      </ScrollView>
    </SafeAreaView>
  );
}
