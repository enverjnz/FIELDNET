import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://awvpodsrwycyjcipwrrg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dnBvZHNyd3ljeWpjaXB3cnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTU0NTksImV4cCI6MjA5NjIzMTQ1OX0.QjtQqDiGXzKlM9SSGyiY-1JS4oSBuWEYmeOAIei0-F0';

if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_PROJECT')) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL ist nicht gesetzt.\n' +
      'Trage die Werte in die .env-Datei ein und starte Expo neu.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
