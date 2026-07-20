import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { linkInvoiceCodeToTeam } from '../../lib/invoiceCode';
import { ensureTeamStatsForTeam } from '../../lib/finishGame';
import { getCurrentSeason } from '../../lib/leagueTeams';
import { useTheme } from '../../context/ThemeContext';
import { createCoachOnboardingStyles } from '../../theme/verwaltungStyles';
import type { ThemeColors } from '../../theme/palettes';

type Region = { id: number; country_unit: string | null; name: string; region_logo_url: string | null };
type League = { id: string; name: string };

type Props = {
  onBack: () => void;
  onSuccess: (teamId: string) => void;
  inviteCodeId: string;
};

type PipelineStep = 'team' | 'manager' | 'profile' | 'done';

const PIPELINE_LABELS: Record<PipelineStep, string> = {
  team: 'Team wird angelegt…',
  manager: 'Verwaltungsrechte werden gesetzt…',
  profile: 'Coach-Profil wird aktualisiert…',
  done: 'Fertig!',
};

export default function CoachOnboardingWizard({ onBack, onSuccess, inviteCodeId }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createCoachOnboardingStyles(colors), [colors]);

  const [step, setStep] = useState(1);

  // Step 1
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  // Step 2
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [town, setTown] = useState('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [leaguesError, setLeaguesError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 3 pipeline
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    setRegionsLoading(true);
    setRegionsError(null);
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, country_unit, region_logo_url')
        .order('country_unit', { ascending: true });
      if (error) throw error;
      setRegions(data ?? []);
    } catch (e: any) {
      setRegionsError(e?.message ?? 'Regionen konnten nicht geladen werden.');
    } finally {
      setRegionsLoading(false);
    }
  }, []);

  useEffect(() => { loadRegions(); }, [loadRegions]);

  useEffect(() => {
    if (!selectedRegionId) {
      setLeagues([]);
      setSelectedLeagueId(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLeaguesLoading(true);
      setLeaguesError(null);
      setSelectedLeagueId(null);
      try {
        const { data, error } = await supabase
          .from('leagues')
          .select('id, name')
          .eq('region_id', selectedRegionId)
          .order('name', { ascending: true });
        if (error) throw error;
        if (!cancelled) setLeagues(data ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setLeaguesError(e?.message ?? 'Ligen konnten nicht geladen werden.');
          setLeagues([]);
        }
      } finally {
        if (!cancelled) setLeaguesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRegionId]);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId);
  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  const validateStep1 = () => {
    if (!selectedRegionId) {
      Alert.alert('Region fehlt', 'Bitte wähle eine Region aus.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!selectedRegionId) e.region = 'Bitte wähle eine Region.';
    if (!name.trim()) e.name = 'Teamname ist Pflicht.';
    if (!shortName.trim()) e.shortName = 'Kürzel ist Pflicht.';
    if (!town.trim()) e.town = 'Stadt ist Pflicht.';
    if (!selectedLeagueId) e.league = 'Bitte wähle eine Liga.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const runMutationPipeline = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setPipelineStep('team');

    let createdTeamId: string | null = null;

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Nicht eingeloggt. Bitte melde dich erneut an.');

      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .insert({
          name: name.trim(),
          short_name: shortName.trim(),
          town: town.trim(),
          leagues_idleague: selectedLeagueId,
          regions_idregion: selectedRegionId,
        })
        .select('id')
        .single();

      if (teamErr || !team?.id) throw teamErr ?? new Error('Team konnte nicht erstellt werden.');
      createdTeamId = team.id;

      setPipelineStep('manager');
      const { error: mgrErr } = await supabase.from('team_managers').insert({
        profile_id: user.id,
        team_id: team.id,
      });
      if (mgrErr) throw mgrErr;

      const currentSeason = await getCurrentSeason();
      if (currentSeason && selectedLeagueId) {
        const { error: ltErr } = await supabase.from('league_teams').insert({
          team_id: team.id,
          league_id: selectedLeagueId,
          season_id: currentSeason.id,
        });
        if (ltErr) throw ltErr;
      }

      setPipelineStep('profile');
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ role: 'coach' })
        .eq('id', user.id);
      if (profErr) throw profErr;

      await supabase.auth.updateUser({ data: { role: 'coach' } });

      setPipelineStep('done');
      await linkInvoiceCodeToTeam(inviteCodeId, team.id);
      await ensureTeamStatsForTeam(team.id);
      setTimeout(() => onSuccess(team.id), 400);
    } catch (e: any) {
      if (createdTeamId) {
        await supabase.from('teams').delete().eq('id', createdTeamId);
      }
      const msg = e?.message?.includes('Network request failed')
        ? 'Keine Verbindung zum Server.'
        : e?.message ?? 'Unbekannter Fehler.';
      setSubmitError(msg);
      setPipelineStep(null);
      Alert.alert('Fehler', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Next = () => {
    if (!validateStep2()) return;
    setStep(3);
  };

  const renderProgress = () => (
    <View style={styles.progressRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegActive]} />
      ))}
    </View>
  );

  const regionOptions = regions.map((r) => ({
    value: r.id,
    label: r.country_unit || r.name,
    imageUrl: r.region_logo_url,
  }));

  const leagueOptions = leagues.map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Region wählen</Text>
      <Text style={styles.stepSub}>
        Wähle das Bundesland bzw. die Region deines Teams.
      </Text>

      {regionsError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{regionsError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRegions}>
            <Text style={styles.retryBtnText}>Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <SelectDropdown
        label="Region *"
        placeholder="Region auswählen…"
        options={regionOptions}
        value={selectedRegionId}
        onChange={(v) => setSelectedRegionId(Number(v))}
        loading={regionsLoading}
        emptyText="Keine Regionen verfügbar."
        styles={styles}
        colors={colors}
      />

      <TouchableOpacity
        style={[styles.primaryBtn, regionsLoading && styles.btnDisabled]}
        onPress={() => { if (validateStep1()) setStep(2); }}
        disabled={regionsLoading}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Weiter</Text>
        <ChevronRight size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
    <ScrollView
      contentContainerStyle={styles.stepScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.stepTitle}>Team anlegen</Text>
      <Text style={styles.stepSub}>
        Trage deine Teamdaten ein und wähle die passende Liga.
      </Text>

      <SelectDropdown
        label="Region *"
        placeholder="Region auswählen…"
        options={regionOptions}
        value={selectedRegionId}
        onChange={(v) => {
          setSelectedRegionId(Number(v));
          setFormErrors((p) => ({ ...p, region: '' }));
        }}
        loading={regionsLoading}
        fieldError={formErrors.region}
        emptyText="Keine Regionen verfügbar."
        styles={styles}
        colors={colors}
      />

      <SelectDropdown
        label="Liga *"
        placeholder={selectedRegionId ? 'Liga auswählen…' : 'Zuerst Region wählen'}
        options={leagueOptions}
        value={selectedLeagueId}
        onChange={(v) => {
          setSelectedLeagueId(String(v));
          setFormErrors((p) => ({ ...p, league: '' }));
        }}
        loading={leaguesLoading}
        disabled={!selectedRegionId}
        fieldError={formErrors.league}
        emptyText={selectedRegionId ? 'Keine Ligen für diese Region.' : undefined}
        error={leaguesError}
        styles={styles}
        colors={colors}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>TEAMNAME *</Text>
        <TextInput
          style={[styles.input, formErrors.name && styles.inputError]}
          value={name}
          onChangeText={(v) => { setName(v); setFormErrors((p) => ({ ...p, name: '' })); }}
          placeholder="z. B. Hellenstein Rascals"
          placeholderTextColor={colors.textMuted}
          autoComplete="off"
          textContentType="organizationName"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
        />
        {!!formErrors.name && <Text style={styles.fieldError}>{formErrors.name}</Text>}
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>KÜRZEL *</Text>
        <TextInput
          style={[styles.input, formErrors.shortName && styles.inputError]}
          value={shortName}
          onChangeText={(v) => { setShortName(v); setFormErrors((p) => ({ ...p, shortName: '' })); }}
          placeholder="z. B. HRSC"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={8}
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
        />
        {!!formErrors.shortName && <Text style={styles.fieldError}>{formErrors.shortName}</Text>}
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>STADT *</Text>
        <TextInput
          style={[styles.input, formErrors.town && styles.inputError]}
          value={town}
          onChangeText={(v) => { setTown(v); setFormErrors((p) => ({ ...p, town: '' })); }}
          placeholder="z. B. Heidenheim"
          placeholderTextColor={colors.textMuted}
          autoComplete="off"
          textContentType="addressCity"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
        />
        {!!formErrors.town && <Text style={styles.fieldError}>{formErrors.town}</Text>}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleStep2Next} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Weiter zur Bestätigung</Text>
        <ChevronRight size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Zusammenfassung</Text>
      <Text style={styles.stepSub}>Prüfe deine Angaben und registriere dein Team.</Text>

      <View style={styles.summaryCard}>
        <SummaryRow label="Region" value={selectedRegion?.country_unit ?? selectedRegion?.name ?? '–'} styles={styles} />
        <SummaryRow label="Team" value={name} styles={styles} />
        <SummaryRow label="Kürzel" value={shortName} styles={styles} />
        <SummaryRow label="Stadt" value={town} styles={styles} />
        <SummaryRow label="Liga" value={selectedLeague?.name ?? '–'} last styles={styles} />
      </View>

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
        onPress={runMutationPipeline}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting
          ? <ActivityIndicator color="#FFFFFF" />
          : <>
              <Text style={styles.primaryBtnText}>Team registrieren & starten</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 1) onBack();
            else setStep((s) => s - 1);
          }}
          activeOpacity={0.75}
          disabled={isSubmitting}
        >
          <ArrowLeft size={20} color={colors.text} />
          <Text style={styles.backBtnText}>{step === 1 ? 'Abbrechen' : 'Zurück'}</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Schritt {step} / 3</Text>
      </View>

      {renderProgress()}

      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>

      <Modal visible={isSubmitting && !!pipelineStep} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={styles.overlayTitle}>
              {pipelineStep ? PIPELINE_LABELS[pipelineStep] : 'Wird verarbeitet…'}
            </Text>
            <View style={styles.pipelineSteps}>
              {(['team', 'manager', 'profile'] as PipelineStep[]).map((key, idx) => {
                const order = ['team', 'manager', 'profile'];
                const currentIdx = pipelineStep ? order.indexOf(pipelineStep) : -1;
                const done = currentIdx > idx || pipelineStep === 'done';
                const active = pipelineStep === key;
                return (
                  <View key={key} style={styles.pipelineRow}>
                    <View style={[styles.pipelineDot, done && styles.pipelineDotDone, active && styles.pipelineDotActive]} />
                    <Text style={[styles.pipelineLabel, (done || active) && styles.pipelineLabelActive]}>
                      {PIPELINE_LABELS[key].replace('…', '')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  last,
  styles,
}: {
  label: string;
  value: string;
  last?: boolean;
  styles: ReturnType<typeof createCoachOnboardingStyles>;
}) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

type SelectOption = { value: string | number; label: string; imageUrl?: string | null };

type SelectDropdownProps = {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  loading?: boolean;
  error?: string | null;
  fieldError?: string;
  disabled?: boolean;
  emptyText?: string;
  styles: ReturnType<typeof createCoachOnboardingStyles>;
  colors: ThemeColors;
};

function SelectDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  loading = false,
  error = null,
  fieldError,
  disabled = false,
  emptyText = 'Keine Einträge verfügbar.',
  styles,
  colors,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          (fieldError || error) && styles.inputError,
          disabled && styles.dropdownDisabled,
        ]}
        onPress={() => !disabled && !loading && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} style={{ flex: 1 }} />
        ) : (
          <View style={styles.dropdownTriggerContent}>
            {selected?.imageUrl ? (
              <Image
                source={{ uri: selected.imageUrl }}
                style={styles.dropdownTriggerLogo}
                resizeMode="contain"
              />
            ) : null}
            <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]} numberOfLines={1}>
              {selected?.label ?? placeholder}
            </Text>
          </View>
        )}
        <ChevronDown size={18} color={disabled ? colors.textMuted : colors.textMuted} />
      </TouchableOpacity>
      {!!fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
      {!!error && !fieldError && <Text style={styles.fieldError}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownSheetHeader}>
              <Text style={styles.dropdownSheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.dropdownEmpty}>{emptyText}</Text>
              ) : (
                options.map((option) => {
                  const active = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                      onPress={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.dropdownItemLeft}>
                        {option.imageUrl ? (
                          <Image
                            source={{ uri: option.imageUrl }}
                            style={styles.dropdownItemLogo}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.dropdownItemLogoPlaceholder}>
                            <Text style={styles.dropdownItemLogoFallback}>
                              {option.label.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                          {option.label}
                        </Text>
                      </View>
                      {active && <Check size={18} color={colors.accent} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
