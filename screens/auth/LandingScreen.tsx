import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

const DARK_BLUE = '#1A2F6E';
const RED       = '#C01830';

type Props = {
  onLogin: () => void;
  onRegister: () => void;
};

export default function LandingScreen({ onLogin, onRegister }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* LOGO */}
      <View style={styles.logoSection}>
        <Image
          source={require('../../assets/fieldnet_logo.png')}
          style={styles.logoImage}
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

        {/* DIVIDER */}
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
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    paddingTop: 32,
  },
  logoImage: {
    width: 260,
    height: 200,
  },

  // Hero
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 8,
  },
  heroTitle: {
    color: DARK_BLUE,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroRed: { color: RED },
  heroSubtitle: {
    color: '#4A5568',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
    color: DARK_BLUE,
    fontSize: 14,
    fontWeight: '600',
  },

  // Buttons
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  btnPrimary: {
    backgroundColor: RED,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DARK_BLUE,
  },
  btnSecondaryText: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: '700',
  },

  // Legal
  legal: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
