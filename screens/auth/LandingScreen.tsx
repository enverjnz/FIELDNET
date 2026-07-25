import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ImageBackground,
} from 'react-native';

import {
  AUTH_BUTTON_SIDE_INSET,
  AUTH_CONTENT_INDENT,
  authBackgroundStyles,
} from './authScreenLayout';

type Props = {
  onLogin: () => void;
  onRegister: () => void;
};

export default function LandingScreen({ onLogin, onRegister }: Props) {
  return (
    <ImageBackground
      source={require('../../assets/bg_01.jpg')}
      style={authBackgroundStyles.background}
      resizeMode="cover"
    >
      <View style={authBackgroundStyles.overlay} />
      <SafeAreaView style={[authBackgroundStyles.safe, styles.safeLayout]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* LOGO */}
        <View style={authBackgroundStyles.logoSection}>
          <Image
            source={require('../../assets/fieldnet_logo.png')}
            style={authBackgroundStyles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Willkommen bei{'\n'}
            {'FIELDNET'}<Text style={styles.heroRed}>.DE</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Verfolge Ligen, Spielergebnisse und dein Team – alles an einem Ort.
          </Text>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Live-Ticker & Spielergebnisse</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Team- & Spielerprofile</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Community & Chats</Text>
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={onRegister} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Jetzt registrieren</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onLogin} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>Bereits ein Konto? Einloggen</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Mit der Registrierung stimmst du unseren Nutzungsbedingungen und der Datenschutzerklärung zu.
        </Text>
      </SafeAreaView>
    </ImageBackground>
  );
}

const RED = '#C01830';

const styles = StyleSheet.create({
  safeLayout: {
    justifyContent: 'space-between',
  },

  heroSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 8,
    paddingLeft: AUTH_CONTENT_INDENT,
    paddingRight: 28,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroRed: { color: RED },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  actions: {
    gap: 10,
    marginBottom: 20,
    marginHorizontal: AUTH_BUTTON_SIDE_INSET,
  },
  btnPrimary: {
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  legal: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    lineHeight: 16,
    paddingLeft: AUTH_CONTENT_INDENT,
    paddingRight: 28,
  },
});
