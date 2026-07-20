import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { birthDateProfileFields } from '../../lib/profileDates';
import { resolveProfileAvatarUrl } from '../../lib/uploadImage';
import { followTeam } from '../../lib/teamFollowers';
import Step1_RoleSelect from './steps/Step1_RoleSelect';
import Step2_BasicInfo from './steps/Step2_BasicInfo';
import Step3_TeamSearch from './steps/Step3_TeamSearch';
import Step4_AthleticProfile from './steps/Step4_AthleticProfile';
import Step5_AccountCreate from './steps/Step5_AccountCreate';
import FanStep3_Interests from './steps/FanStep3_Interests';
import CoachStep3_TeamSearch from './steps/CoachStep3_TeamSearch';
import CoachStep4_Profile from './steps/CoachStep4_Profile';
import PendingScreen from './PendingScreen';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FollowedTeam = {
  id: string;
  name: string;
};

export type OnboardingData = {
  role: 'player' | 'fan' | 'coach';
  firstName: string;
  lastName: string;
  bio: string;
  avatarUri: string | null;
  birthDate: Date | null;
  // Player / Coach – team
  selectedTeamId: string | null;
  selectedTeamName: string | null;
  // Player – athletic profile
  position: string;
  jerseyNumber: string;
  gender: string;
  weight: string;
  height: string;
  nationality: string;
  // Fan
  followedTeams: FollowedTeam[];
  favoriteRegions: string[];
  // Coach
  coachingRole: string;
  coachingLicense: string;
  coachingExperience: string;
  coachingSpecialization: string;
};

const INITIAL_DATA: OnboardingData = {
  role: 'player',
  firstName: '',
  lastName: '',
  bio: '',
  avatarUri: null,
  birthDate: null,
  selectedTeamId: null,
  selectedTeamName: null,
  position: '',
  jerseyNumber: '',
  gender: '',
  weight: '',
  height: '',
  nationality: '',
  followedTeams: [],
  favoriteRegions: [],
  coachingRole: '',
  coachingLicense: '',
  coachingExperience: '',
  coachingSpecialization: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalStepsFor(role: OnboardingData['role']) {
  if (role === 'fan') return 4;   // Role → BasicInfo → Interests → Account
  return 5;                        // Role → BasicInfo → TeamSearch → Profile → Account
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ step, total }: { step: number; total: number }) => (
  <View style={styles.progressContainer}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.progressSegment,
          i < step && styles.progressSegmentActive,
        ]}
      />
    ))}
  </View>
);

// ─── Fan Welcome Screen ───────────────────────────────────────────────────────

function FanWelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.doneContainer}>
        <View style={styles.doneIconWrap}>
          <CheckCircle size={52} color="#1A2F6E" />
        </View>
        <Text style={styles.doneTitle}>Willkommen bei FIELDNET!</Text>
        <Text style={styles.doneBody}>
          Dein Fan-Konto wurde erfolgreich erstellt.{'\n\n'}
          Verfolge Spiele, kommentiere Matches und bleib immer auf dem Laufenden rund um den deutschen Football.
        </Text>
        <View style={styles.doneCard}>
          <Text style={styles.doneCardLabel}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDotGreen} />
            <Text style={styles.statusTextGreen}>Aktiv</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Zur App →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Coach Welcome Screen ─────────────────────────────────────────────────────

function CoachWelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.doneContainer}>
        <View style={styles.doneIconWrap}>
          <CheckCircle size={52} color="#1A2F6E" />
        </View>
        <Text style={styles.doneTitle}>Trainer-Profil erstellt!</Text>
        <Text style={styles.doneBody}>
          Dein Konto wurde erfolgreich angelegt.{'\n\n'}
          Sobald ein Admin deine Team-Anfrage bestätigt, erhältst du vollen Zugriff auf die Teamverwaltung.
        </Text>
        <View style={styles.doneCard}>
          <Text style={styles.doneCardLabel}>Team-Anfrage</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDotAmber} />
            <Text style={styles.statusTextAmber}>Ausstehend</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Zur App →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
  onBack: () => void;
};

export default function PlayerOnboardingFlow({ onComplete, onBack }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doneAs, setDoneAs] = useState<'player' | 'fan' | 'coach' | null>(null);

  const totalSteps = totalStepsFor(data.role);

  const update = (fields: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...fields }));

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // ─── Shared auth helper ──────────────────────────────────────────────────────
  const createAccount = async (email: string, password: string, role: string) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },   // stored in user_metadata on the auth session
    });
    if (error) throw error;
    const user = signUpData?.user;
    if (!user) throw new Error('Kein Benutzer zurückgegeben.');
    return user;
  };

  // ─── Player submit ───────────────────────────────────────────────────────────
  const handlePlayerSubmit = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const user = await createAccount(email, password, 'player');

      const avatarUrl = await resolveProfileAvatarUrl(user.id, data.avatarUri);

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        role: 'player',
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        bio: data.bio.trim(),
        avatar: avatarUrl,
        ...birthDateProfileFields(data.birthDate),
        position: data.position.trim(),
        jersey_number: data.jerseyNumber.trim(),
        gender: data.gender.trim(),
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        nationality: data.nationality.trim(),
      });
      if (profileError) throw profileError;

      if (data.selectedTeamId) {
        const { error: membershipError } = await supabase.from('team_memberships').insert({
          player_id: user.id,
          team_id: data.selectedTeamId,
          status: 'pending',
        });
        if (membershipError) throw membershipError;
      }

      setDoneAs('player');
    } catch (err: any) {
      Alert.alert('Fehler', networkSafeMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Fan submit ──────────────────────────────────────────────────────────────
  const handleFanSubmit = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const user = await createAccount(email, password, 'fan');

      const avatarUrl = await resolveProfileAvatarUrl(user.id, data.avatarUri);

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        role: 'fan',
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        bio: data.bio.trim(),
        avatar: avatarUrl,
        ...birthDateProfileFields(data.birthDate),
        favourite_team_id: data.followedTeams[0]?.id ?? null,
      });
      if (profileError) throw profileError;

      for (const team of data.followedTeams) {
        await followTeam(user.id, team.id);
      }

      setDoneAs('fan');
    } catch (err: any) {
      Alert.alert('Fehler', networkSafeMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Coach submit ─────────────────────────────────────────────────────────────
  const handleCoachSubmit = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const user = await createAccount(email, password, 'coach');

      const avatarUrl = await resolveProfileAvatarUrl(user.id, data.avatarUri);

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        role: 'coach',
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        bio: data.bio.trim(),
        avatar: avatarUrl,
        ...birthDateProfileFields(data.birthDate),
        coaching_role: data.coachingRole.trim() || null,
        coaching_license: data.coachingLicense.trim() || null,
        coaching_experience: data.coachingExperience
          ? parseInt(data.coachingExperience, 10)
          : null,
        coaching_specialization: data.coachingSpecialization.trim() || null,
      });
      if (profileError) throw profileError;

      if (data.selectedTeamId) {
        const { error: membershipError } = await supabase.from('team_memberships').insert({
          player_id: user.id,
          team_id: data.selectedTeamId,
          status: 'coach_pending',
        });
        if (membershipError) throw membershipError;
      }

      setDoneAs('coach');
    } catch (err: any) {
      Alert.alert('Fehler', networkSafeMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Completion screens ──────────────────────────────────────────────────────
  if (doneAs === 'player') return <PendingScreen onContinue={onComplete} />;
  if (doneAs === 'fan') return <FanWelcomeScreen onContinue={onComplete} />;
  if (doneAs === 'coach') return <CoachWelcomeScreen onContinue={onComplete} />;

  // ─── Step rendering ──────────────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 1) {
      return <Step1_RoleSelect data={data} update={update} onNext={next} onBack={onBack} />;
    }

    if (step === 2) {
      return <Step2_BasicInfo data={data} update={update} onNext={next} onBack={back} />;
    }

    if (step === 3) {
      if (data.role === 'fan') {
        return <FanStep3_Interests data={data} update={update} onNext={next} onBack={back} />;
      }
      if (data.role === 'coach') {
        return <CoachStep3_TeamSearch data={data} update={update} onNext={next} onBack={back} />;
      }
      return <Step3_TeamSearch data={data} update={update} onNext={next} onBack={back} />;
    }

    if (step === 4) {
      if (data.role === 'fan') {
        return (
          <Step5_AccountCreate
            onBack={back}
            onSubmit={handleFanSubmit}
            isSubmitting={isSubmitting}
          />
        );
      }
      if (data.role === 'coach') {
        return (
          <CoachStep4_Profile data={data} update={update} onNext={next} onBack={back} />
        );
      }
      return (
        <Step4_AthleticProfile
          data={data}
          update={update}
          onBack={back}
          onSubmit={next}
          isSubmitting={false}
        />
      );
    }

    if (step === 5) {
      const submitHandler = data.role === 'coach' ? handleCoachSubmit : handlePlayerSubmit;
      return (
        <Step5_AccountCreate
          onBack={back}
          onSubmit={submitHandler}
          isSubmitting={isSubmitting}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Image
          source={require('../../assets/fieldnet_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.stepLabel}>
          Schritt {step} / {totalSteps}
        </Text>
      </View>
      <ProgressBar step={step} total={totalSteps} />

      <View style={styles.content}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function networkSafeMessage(err: any): string {
  if (err?.message?.includes('Network request failed')) {
    return 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.';
  }
  return err?.message ?? 'Unbekannter Fehler. Bitte versuche es erneut.';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const B = '#1A2F6E';
const R = '#C01830';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoImage: { width: 44, height: 44 },
  stepLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: '#D1D8F0',
  },
  progressSegmentActive: { backgroundColor: R },
  content: { flex: 1 },
  // Shared completion screen
  doneContainer: {
    flex: 1, paddingHorizontal: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  doneIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#F0F4FF', justifyContent: 'center',
    alignItems: 'center', borderWidth: 2, borderColor: B, marginBottom: 28,
  },
  doneTitle: {
    color: B, fontSize: 26, fontWeight: '800',
    marginBottom: 14, textAlign: 'center',
  },
  doneBody: {
    color: '#6B7280', fontSize: 15, lineHeight: 24,
    textAlign: 'center', marginBottom: 32,
  },
  doneCard: {
    backgroundColor: '#F0F4FF', borderRadius: 14, padding: 18,
    borderWidth: 1.5, borderColor: '#D1D8F0',
    alignSelf: 'stretch', marginBottom: 40,
  },
  doneCardLabel: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusTextGreen: { color: '#059669', fontSize: 14, fontWeight: '700' },
  statusDotAmber: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  statusTextAmber: { color: '#D97706', fontSize: 14, fontWeight: '700' },
  doneBtn: {
    backgroundColor: R, borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 40, alignSelf: 'stretch', alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
