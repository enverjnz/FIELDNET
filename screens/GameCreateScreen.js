/**
 * GameCreateScreen.js
 *
 * WICHTIG – Bevor dieser Screen funktioniert, führe dieses SQL in Supabase aus:
 *
 *   ALTER TABLE games
 *     ADD COLUMN IF NOT EXISTS home_team_id  uuid REFERENCES teams(id),
 *     ADD COLUMN IF NOT EXISTS away_team_name text,
 *     ADD COLUMN IF NOT EXISTS game_date     date,
 *     ADD COLUMN IF NOT EXISTS game_time     text,
 *     ADD COLUMN IF NOT EXISTS location      text,
 *     ADD COLUMN IF NOT EXISTS is_home_game  boolean DEFAULT true,
 *     ADD COLUMN IF NOT EXISTS game_code     text UNIQUE,
 *     ADD COLUMN IF NOT EXISTS created_by    uuid REFERENCES profiles(id);
 *
 *   -- RLS: Coaches dürfen eigene Spiele inserieren
 *   CREATE POLICY "Coach kann Spiel erstellen"
 *   ON public.games FOR INSERT
 *   WITH CHECK (auth.uid() = created_by);
 *
 *   CREATE POLICY "Jeder kann Spiele lesen"
 *   ON public.games FOR SELECT USING (true);
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, Share, Platform, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Copy, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const B      = '#1A2F6E';
const R      = '#C01830';
const BG     = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED  = '#6B7280';
const GREEN  = '#10B981';

function generateGameCode(shortName) {
  const base   = (shortName ?? 'TEAM').replace(/\s+/g, '').toUpperCase().slice(0, 4);
  const now    = new Date();
  const day    = String(now.getDate()).padStart(2, '0');
  const month  = String(now.getMonth() + 1).padStart(2, '0');
  const year   = String(now.getFullYear()).slice(2);
  const rand   = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `${base}-${day}${month}${year}-${rand}`;
}

export default function GameCreateScreen({ teamId, onBack }) {
  const [form, setForm] = useState({
    away_team_name: '',
    location:       '',
    is_home_game:   true,
  });

  // Date & time as real Date objects
  const [gameDate, setGameDate]       = useState(null);
  const [gameTime, setGameTime]       = useState(null);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [errors, setErrors]             = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [createdCode, setCreatedCode]   = useState(null);
  const [codeCopied, setCodeCopied]     = useState(false);

  const formatDate = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const formatTime = (d) => {
    if (!d) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const isoDate = (d) => {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.away_team_name.trim()) e.away_team_name = 'Pflichtfeld';
    if (!gameDate)                   e.game_date      = 'Pflichtfeld';
    if (!form.location.trim())       e.location       = 'Pflichtfeld';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');

      const { data: teamData } = await supabase
        .from('teams')
        .select('short_name')
        .eq('id', teamId)
        .maybeSingle();

      const code = generateGameCode(teamData?.short_name);

      const { error } = await supabase.from('games').insert({
        home_team_id:   teamId,
        away_team_name: form.away_team_name.trim(),
        game_date:      isoDate(gameDate),
        game_time:      gameTime ? formatTime(gameTime) : null,
        location:       form.location.trim(),
        is_home_game:   form.is_home_game,
        game_code:      code,
        status:         'scheduled',
        home_score:     0,
        away_score:     0,
        created_by:     user.id,
      });

      if (error) throw error;
      setCreatedCode(code);
    } catch (err) {
      Alert.alert('Fehler', err.message ?? 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    await Share.share({ message: `Game-Code: ${createdCode}` });
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (createdCode) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Check size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Spiel erstellt!</Text>
            <Text style={styles.successSub}>
              Dein Ticker-Code für dieses Spiel:
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{createdCode}</Text>
            </View>

            <Text style={styles.codeHint}>
              Gib diesen Code ein, wenn du den Live-Ticker für dieses Spiel starten möchtest.
              Du kannst ihn auch mit deinem Co-Trainer teilen.
            </Text>

            <TouchableOpacity style={styles.copyBtn} onPress={copyCode} activeOpacity={0.85}>
              {codeCopied
                ? <><Check size={18} color={B} /><Text style={styles.copyBtnText}>Geteilt!</Text></>
                : <><Copy size={18} color={B} /><Text style={styles.copyBtnText}>Code teilen</Text></>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onBack} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Zurück zum Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={B} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <Calendar size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Spiel erstellen</Text>
          <Text style={styles.headerSub}>
            Nach dem Erstellen erhältst du einen <Text style={styles.highlight}>Ticker-Code</Text>,
            mit dem du den Live-Ticker starten kannst.
          </Text>
        </View>

        {/* HEIMSPIEL / AUSWÄRTSSPIEL */}
        <Text style={styles.sectionLabel}>SPIELORT</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, form.is_home_game && styles.toggleBtnActive]}
            onPress={() => set('is_home_game', true)}
          >
            <Text style={[styles.toggleText, form.is_home_game && styles.toggleTextActive]}>Heimspiel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !form.is_home_game && styles.toggleBtnActiveRed]}
            onPress={() => set('is_home_game', false)}
          >
            <Text style={[styles.toggleText, !form.is_home_game && styles.toggleTextActive]}>Auswärtsspiel</Text>
          </TouchableOpacity>
        </View>

        {/* GEGNER */}
        <Text style={styles.sectionLabel}>SPIELINFOS</Text>
        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>GEGNER *</Text>
            <View style={[styles.inputRow, !!errors.away_team_name && styles.inputRowError]}>
              <Users size={17} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.away_team_name}
                onChangeText={(v) => set('away_team_name', v)}
                placeholder="z. B. Munich Cowboys"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {!!errors.away_team_name && <Text style={styles.fieldError}>{errors.away_team_name}</Text>}
          </View>

          {/* DATUM */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>DATUM *</Text>
            <TouchableOpacity
              style={[styles.inputRow, styles.inputRowPressable, !!errors.game_date && styles.inputRowError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={17} color={gameDate ? B : MUTED} style={styles.inputIcon} />
              <Text style={[styles.inputField, { paddingVertical: 13, color: gameDate ? B : '#9CA3AF' }]}>
                {gameDate ? formatDate(gameDate) : 'Datum auswählen'}
              </Text>
            </TouchableOpacity>
            {!!errors.game_date && <Text style={styles.fieldError}>{errors.game_date}</Text>}
          </View>

          {/* UHRZEIT */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>UHRZEIT (optional)</Text>
            <TouchableOpacity
              style={[styles.inputRow, styles.inputRowPressable]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Clock size={17} color={gameTime ? B : MUTED} style={styles.inputIcon} />
              <Text style={[styles.inputField, { paddingVertical: 13, color: gameTime ? B : '#9CA3AF' }]}>
                {gameTime ? formatTime(gameTime) : 'Uhrzeit auswählen'}
              </Text>
              {gameTime && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setGameTime(null); }}
                  hitSlop={8}
                  style={{ paddingRight: 4 }}
                >
                  <Text style={{ color: MUTED, fontSize: 18, lineHeight: 20 }}>×</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* DATE PICKER */}
          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent animationType="slide" visible={showDatePicker}>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerSheet}>
                    <View style={styles.pickerSheetHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.pickerCancel}>Abbrechen</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerTitle}>Datum wählen</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.pickerDone}>Fertig</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={gameDate ?? new Date()}
                      mode="date"
                      display="inline"
                      minimumDate={new Date()}
                      onChange={(_, d) => { if (d) setGameDate(d); }}
                      locale="de-DE"
                      style={{ alignSelf: 'center' }}
                      accentColor={B}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={gameDate ?? new Date()}
                mode="date"
                display="calendar"
                minimumDate={new Date()}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setGameDate(d); }}
              />
            )
          )}

          {/* TIME PICKER */}
          {showTimePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent animationType="slide" visible={showTimePicker}>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerSheet}>
                    <View style={styles.pickerSheetHeader}>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                        <Text style={styles.pickerCancel}>Abbrechen</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerTitle}>Uhrzeit wählen</Text>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                        <Text style={styles.pickerDone}>Fertig</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={gameTime ?? new Date()}
                      mode="time"
                      display="spinner"
                      is24Hour
                      onChange={(_, t) => { if (t) setGameTime(t); }}
                      locale="de-DE"
                      style={{ alignSelf: 'center' }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={gameTime ?? new Date()}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_, t) => { setShowTimePicker(false); if (t) setGameTime(t); }}
              />
            )
          )}

          <View style={[styles.fieldWrap, { marginBottom: 0 }]}>
            <Text style={styles.fieldLabel}>SPIELORT *</Text>
            <View style={[styles.inputRow, !!errors.location && styles.inputRowError]}>
              <MapPin size={17} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.location}
                onChangeText={(v) => set('location', v)}
                placeholder="z. B. Sportpark Süd, Nürnberg"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {!!errors.location && <Text style={styles.fieldError}>{errors.location}</Text>}
          </View>
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.createBtn, submitting && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <>
                <Calendar size={18} color="#FFFFFF" />
                <Text style={styles.createBtnText}>Spiel erstellen & Code generieren</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },

  headerSection: { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
  headerIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: R,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: R, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  headerTitle: { color: B, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  headerSub:   { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  highlight:   { color: R, fontWeight: '700' },

  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.2, marginBottom: 10,
  },

  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
  },
  toggleBtnActive:    { backgroundColor: B, borderColor: B },
  toggleBtnActiveRed: { backgroundColor: R, borderColor: R },
  toggleText:         { color: MUTED, fontSize: 14, fontWeight: '700' },
  toggleTextActive:   { color: '#FFFFFF' },

  card: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 16, marginBottom: 20,
  },
  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { color: B, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  fieldError: { color: R, fontSize: 11, marginTop: 4 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 10,
  },
  inputRowPressable: { cursor: 'pointer' },
  inputRowError: { borderColor: R },
  inputIcon:     { marginRight: 8 },
  inputField:    { flex: 1, color: B, fontSize: 14, paddingVertical: 12 },

  pickerModal: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  pickerSheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  pickerTitle:  { color: B, fontSize: 15, fontWeight: '700' },
  pickerCancel: { color: MUTED, fontSize: 15 },
  pickerDone:   { color: B, fontSize: 15, fontWeight: '700' },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: R, borderRadius: 16, paddingVertical: 18,
    shadowColor: R, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  // Success screen
  successCard: {
    flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 8,
  },
  successIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  successTitle: { color: B, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  successSub:   { color: MUTED, fontSize: 14, marginBottom: 24 },
  codeBox: {
    backgroundColor: B, borderRadius: 18, paddingHorizontal: 32, paddingVertical: 20,
    marginBottom: 16, width: '100%', alignItems: 'center',
    shadowColor: B, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  codeText: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: 4 },
  codeHint: {
    color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20,
    marginBottom: 24, paddingHorizontal: 8,
  },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BG, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
    borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, width: '100%', justifyContent: 'center',
  },
  copyBtnText: { color: B, fontSize: 14, fontWeight: '700' },
  doneBtn: {
    backgroundColor: R, borderRadius: 14, paddingVertical: 16,
    width: '100%', alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
