import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingData } from '../screens/onboarding/PlayerOnboardingFlow';

const STORAGE_KEY = '@fieldnet/pending_onboarding';

export type PendingOnboarding = {
  email: string;
  data: OnboardingData;
};

export function reviveOnboardingData(data: OnboardingData): OnboardingData {
  if (!data.birthDate) return data;
  if (data.birthDate instanceof Date) return data;
  const parsed = new Date(data.birthDate as unknown as string);
  if (Number.isNaN(parsed.getTime())) return { ...data, birthDate: null };
  return { ...data, birthDate: parsed };
}

export async function savePendingOnboarding(payload: PendingOnboarding): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadPendingOnboarding(): Promise<PendingOnboarding | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingOnboarding;
    if (!parsed?.email || !parsed?.data?.role) return null;
    return {
      email: parsed.email,
      data: reviveOnboardingData(parsed.data),
    };
  } catch {
    return null;
  }
}

export async function clearPendingOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
