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
import { X, Shield } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { DATENSCHUTZ_BLOCKS } from '../lib/datenschutzContent';

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
    h1: {
      color: c.text,
      fontSize: 26,
      fontWeight: '900',
      marginBottom: 28,
      letterSpacing: -0.3,
    },
    h2: {
      color: c.text,
      fontSize: 18,
      fontWeight: '900',
      marginTop: 8,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    h3: {
      color: c.text,
      fontSize: 15,
      fontWeight: '800',
      marginTop: 4,
      marginBottom: 8,
    },
    paragraph: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '500',
      marginBottom: 16,
    },
    addressBlock: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      gap: 4,
    },
    addressLine: {
      color: c.text,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
    },
    addressEmail: {
      color: c.accent,
      fontWeight: '700',
      marginTop: 4,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 20,
    },
  });
}

function BlockRenderer({ block, styles, isFirstH2 }) {
  switch (block.type) {
    case 'h1':
      return <Text style={styles.h1}>{block.text}</Text>;
    case 'h2':
      return (
        <>
          {!isFirstH2 && <View style={styles.sectionDivider} />}
          <Text style={styles.h2}>{block.text}</Text>
        </>
      );
    case 'h3':
      return <Text style={styles.h3}>{block.text}</Text>;
    case 'p':
      return <Text style={styles.paragraph}>{block.text}</Text>;
    case 'address':
      return (
        <View style={styles.addressBlock}>
          {block.lines.map((line, index) => {
            const isEmail = line.startsWith('E-Mail:');
            return (
              <Text
                key={index}
                style={[styles.addressLine, isEmail && styles.addressEmail]}
              >
                {line}
              </Text>
            );
          })}
        </View>
      );
    default:
      return null;
  }
}

export default function DatenschutzScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  let h2Count = 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shield size={20} color={colors.text} />
          <Text style={styles.title} numberOfLines={1}>Datenschutz</Text>
        </View>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {DATENSCHUTZ_BLOCKS.map((block, index) => {
          const isFirstH2 = block.type === 'h2' && h2Count++ === 0;
          return (
            <BlockRenderer
              key={`${block.type}-${index}`}
              block={block}
              styles={styles}
              isFirstH2={isFirstH2}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
