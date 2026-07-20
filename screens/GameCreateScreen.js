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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, Share, Platform, Modal, Image, KeyboardAvoidingView, Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, MapPin, Clock, Copy, Check, Search, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { createGameCreateStyles } from '../theme/gameCreateStyles';

const GREEN = '#10B981';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createGameCreateStyles(colors), [colors]);

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

  const [opponentFocused, setOpponentFocused]       = useState(false);
  const [opponentSuggestions, setOpponentSuggestions] = useState([]);
  const [isSearchingOpponent, setIsSearchingOpponent] = useState(false);
  const [selectedOpponent, setSelectedOpponent]     = useState(null);
  const opponentDebounceRef = useRef(null);
  const opponentInputRef = useRef(null);
  const selectingOpponentRef = useRef(false);

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

  useEffect(() => {
    const q = form.away_team_name.trim();

    if (q.length < 2) {
      setOpponentSuggestions([]);
      setIsSearchingOpponent(false);
      return;
    }

    if (selectedOpponent && selectedOpponent.name === q) {
      setOpponentSuggestions([]);
      setIsSearchingOpponent(false);
      return;
    }

    setIsSearchingOpponent(true);
    if (opponentDebounceRef.current) clearTimeout(opponentDebounceRef.current);

    opponentDebounceRef.current = setTimeout(async () => {
      try {
        const { data: teams } = await supabase
          .from('teams')
          .select('id, name, short_name, town, avatar_teamlogo, leagues(name, league_logo_url)')
          .neq('id', teamId)
          .or(`name.ilike.%${q}%,short_name.ilike.%${q}%,town.ilike.%${q}%`)
          .limit(8);

        setOpponentSuggestions((teams ?? []).map((t) => ({
          id:       t.id,
          name:     t.name,
          meta:     [t.leagues?.name, t.town, t.short_name].filter(Boolean).join(' · '),
          logoUrl:  t.avatar_teamlogo || t.leagues?.league_logo_url || null,
          initials: (t.short_name || t.name || '?').slice(0, 2).toUpperCase(),
        })));
      } finally {
        setIsSearchingOpponent(false);
      }
    }, 300);

    return () => {
      if (opponentDebounceRef.current) clearTimeout(opponentDebounceRef.current);
    };
  }, [form.away_team_name, teamId, selectedOpponent]);

  const handleOpponentChange = (value) => {
    set('away_team_name', value);
    if (selectedOpponent && selectedOpponent.name !== value) {
      setSelectedOpponent(null);
    }
  };

  const selectOpponent = (team) => {
    selectingOpponentRef.current = true;
    set('away_team_name', team.name);
    setSelectedOpponent(team);
    setOpponentSuggestions([]);
    setOpponentFocused(false);
    opponentInputRef.current?.blur();
  };

  const handleOpponentBlur = () => {
    setTimeout(() => {
      if (selectingOpponentRef.current) {
        selectingOpponentRef.current = false;
        return;
      }
      setOpponentFocused(false);
    }, 200);
  };

  const clearOpponent = () => {
    set('away_team_name', '');
    setSelectedOpponent(null);
    setOpponentSuggestions([]);
  };

  const showOpponentDropdown =
    opponentFocused &&
    form.away_team_name.trim().length >= 2 &&
    (isSearchingOpponent || opponentSuggestions.length > 0);

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
    await Share.share({ message: createdCode });
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (createdCode) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
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
                ? <><Check size={18} color={colors.text} /><Text style={styles.copyBtnText}>Geteilt!</Text></>
                : <><Copy size={18} color={colors.text} /><Text style={styles.copyBtnText}>Code teilen</Text></>
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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={colors.text} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
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
            <Pressable
              style={[
                styles.inputRow,
                opponentFocused && styles.inputRowFocused,
                !!errors.away_team_name && styles.inputRowError,
              ]}
              onPress={() => opponentInputRef.current?.focus()}
            >
              {selectedOpponent?.logoUrl ? (
                <Image
                  source={{ uri: selectedOpponent.logoUrl }}
                  style={styles.opponentLogo}
                  resizeMode="contain"
                />
              ) : selectedOpponent ? (
                <View style={styles.opponentLogoPlaceholder}>
                  <Text style={styles.opponentInitials}>{selectedOpponent.initials}</Text>
                </View>
              ) : (
                <Search size={17} color={colors.textMuted} style={styles.inputIcon} />
              )}
              <TextInput
                ref={opponentInputRef}
                style={styles.inputField}
                value={form.away_team_name}
                onChangeText={handleOpponentChange}
                onFocus={() => setOpponentFocused(true)}
                onBlur={handleOpponentBlur}
                placeholder="Team suchen oder Name eingeben…"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                returnKeyType="done"
              />
              {isSearchingOpponent && !selectedOpponent ? (
                <ActivityIndicator size="small" color={colors.text} style={{ marginRight: 4 }} />
              ) : null}
              {form.away_team_name.length > 0 ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    clearOpponent();
                    opponentInputRef.current?.focus();
                  }}
                  hitSlop={8}
                >
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </Pressable>
            {!!errors.away_team_name && <Text style={styles.fieldError}>{errors.away_team_name}</Text>}

            {showOpponentDropdown && (
              <View style={styles.suggestionsBox}>
                {isSearchingOpponent && opponentSuggestions.length === 0 ? (
                  <View style={styles.suggestionEmpty}>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={styles.suggestionEmptyText}>Teams werden gesucht…</Text>
                  </View>
                ) : opponentSuggestions.length === 0 ? (
                  <View style={styles.suggestionEmpty}>
                    <Text style={styles.suggestionEmptyText}>Kein Teamprofil gefunden</Text>
                    <Text style={styles.suggestionEmptySub}>Freien Namen verwenden oder anders suchen</Text>
                  </View>
                ) : (
                  opponentSuggestions.map((team, index) => (
                    <TouchableOpacity
                      key={team.id}
                      style={[
                        styles.suggestionRow,
                        index < opponentSuggestions.length - 1 && styles.suggestionBorder,
                      ]}
                      onPress={() => selectOpponent(team)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionIcon}>
                        {team.logoUrl ? (
                          <Image source={{ uri: team.logoUrl }} style={styles.suggestionAvatar} resizeMode="contain" />
                        ) : (
                          <Text style={styles.suggestionInitials}>{team.initials}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionName} numberOfLines={1}>{team.name}</Text>
                        {!!team.meta && (
                          <Text style={styles.suggestionMeta} numberOfLines={1}>{team.meta}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* DATUM */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>DATUM *</Text>
            <TouchableOpacity
              style={[styles.inputRow, styles.inputRowPressable, !!errors.game_date && styles.inputRowError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={17} color={gameDate ? colors.text : colors.textMuted} style={styles.inputIcon} />
              <Text style={[styles.inputField, { paddingVertical: 13, color: gameDate ? colors.text : colors.textMuted }]}>
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
              <Clock size={17} color={gameTime ? colors.text : colors.textMuted} style={styles.inputIcon} />
              <Text style={[styles.inputField, { paddingVertical: 13, color: gameTime ? colors.text : colors.textMuted }]}>
                {gameTime ? formatTime(gameTime) : 'Uhrzeit auswählen'}
              </Text>
              {gameTime && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setGameTime(null); }}
                  hitSlop={8}
                  style={{ paddingRight: 4 }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 18, lineHeight: 20 }}>×</Text>
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
                      accentColor={colors.text}
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
              <MapPin size={17} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.location}
                onChangeText={(v) => set('location', v)}
                placeholder="z. B. Sportpark Süd, Nürnberg"
                placeholderTextColor={colors.textMuted}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
