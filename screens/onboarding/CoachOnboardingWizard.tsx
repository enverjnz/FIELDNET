import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

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
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>TEAMNAME *</Text>
        <TextInput
          style={[styles.input, formErrors.name && styles.inputError]}
          value={name}
          onChangeText={(v) => { setName(v); setFormErrors((p) => ({ ...p, name: '' })); }}
          placeholder="z. B. Hellenstein Rascals"
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
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
        <SummaryRow label="Region" value={selectedRegion?.country_unit ?? selectedRegion?.name ?? '–'} />
        <SummaryRow label="Team" value={name} />
        <SummaryRow label="Kürzel" value={shortName} />
        <SummaryRow label="Stadt" value={town} />
        <SummaryRow label="Liga" value={selectedLeague?.name ?? '–'} last />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
          <ArrowLeft size={20} color={B} />
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
            <ActivityIndicator size="large" color={B} />
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

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
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
          <ActivityIndicator size="small" color={B} style={{ flex: 1 }} />
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
        <ChevronDown size={18} color={disabled ? '#C4CAD4' : MUTED} />
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
                <X size={22} color={B} />
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
                      {active && <Check size={18} color={R} />}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },
  stepIndicator: { color: MUTED, fontSize: 12, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 8 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: BORDER },
  progressSegActive: { backgroundColor: R },
  content: { flex: 1 },
  stepScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  stepTitle: { color: B, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  stepSub: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 24 },
  highlight: { color: B, fontWeight: '700' },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: BORDER, minHeight: 50,
  },
  dropdownDisabled: { opacity: 0.55, backgroundColor: '#F8FAFC' },
  dropdownTriggerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
  dropdownTriggerLogo: { width: 28, height: 28, borderRadius: 6 },
  dropdownText: { flex: 1, color: B, fontSize: 15, fontWeight: '600' },
  dropdownPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  dropdownOverlay: { flex: 1, justifyContent: 'flex-end' },
  dropdownBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,47,110,0.4)' },
  dropdownSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', paddingBottom: 24,
  },
  dropdownSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  dropdownSheetTitle: { color: B, fontSize: 16, fontWeight: '800' },
  dropdownList: { maxHeight: 360 },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  dropdownItemActive: { backgroundColor: BG },
  dropdownItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownItemLogo: { width: 36, height: 36, borderRadius: 8 },
  dropdownItemLogoPlaceholder: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center',
  },
  dropdownItemLogoFallback: { color: B, fontSize: 14, fontWeight: '800' },
  dropdownItemText: { color: B, fontSize: 15, fontWeight: '500', flex: 1 },
  dropdownItemTextActive: { color: B, fontWeight: '800' },
  dropdownEmpty: { color: MUTED, fontSize: 14, textAlign: 'center', padding: 24 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    color: B, fontSize: 15, borderWidth: 1.5, borderColor: BORDER,
  },
  inputError: { borderColor: R },
  fieldError: { color: R, fontSize: 11, marginTop: 4 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: R, borderRadius: 14, paddingVertical: 16,
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  errorBox: {
    backgroundColor: '#FFF0F2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FECDD3', marginBottom: 16,
  },
  errorText: { color: R, fontSize: 13, lineHeight: 18 },
  retryBtn: { marginTop: 10, alignSelf: 'flex-start' },
  retryBtnText: { color: B, fontWeight: '700', fontSize: 13 },
  emptyBox: {
    backgroundColor: BG, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 8,
  },
  emptyText: { color: MUTED, fontSize: 13, textAlign: 'center' },
  summaryCard: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 14, gap: 12,
  },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  summaryLabel: { color: MUTED, fontSize: 13, fontWeight: '600' },
  summaryValue: { color: B, fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(26,47,110,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  overlayCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28,
    width: '100%', maxWidth: 340, alignItems: 'center',
  },
  overlayTitle: {
    color: B, fontSize: 16, fontWeight: '800',
    marginTop: 16, marginBottom: 20, textAlign: 'center',
  },
  pipelineSteps: { alignSelf: 'stretch', gap: 10 },
  pipelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pipelineDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: BORDER,
  },
  pipelineDotActive: { backgroundColor: R },
  pipelineDotDone: { backgroundColor: '#10B981' },
  pipelineLabel: { color: MUTED, fontSize: 13 },
  pipelineLabelActive: { color: B, fontWeight: '700' },
});
