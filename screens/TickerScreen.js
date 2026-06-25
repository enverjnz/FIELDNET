import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Trophy, Plus, RotateCcw, ArrowLeft, Flag } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { insertTickerEvents } from '../lib/tickerEvents';
import { finishGame } from '../lib/finishGame';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

const QUARTERS = [
  { key: '1', label: 'Q1' },
  { key: '2', label: 'Q2' },
  { key: '3', label: 'Q3' },
  { key: '4', label: 'Q4' },
];

export default function TickerScreen({ game, onBack, onExit }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [teamRoster, setTeamRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [eventQueue, setEventQueue] = useState([]);

  const [scoreHome, setScoreHome] = useState(game?.home_score ?? 0);
  const [scoreAway, setScoreAway] = useState(game?.away_score ?? 0);
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [selectedQuarter, setSelectedQuarter] = useState('1');

  const isFinished = (game?.status ?? '').toLowerCase() === 'finished';
  const homeName = game?.home_team?.name ?? game?.home_team?.short_name ?? 'Heim';
  const awayName = game?.away_team_name ?? 'Gast';

  const loadRoster = useCallback(async () => {
    if (!game?.home_team_id) {
      setTeamRoster([]);
      setRosterLoading(false);
      return;
    }

    setRosterLoading(true);
    const { data } = await supabase
      .from('team_memberships')
      .select('profiles(id, first_name, last_name, position, jersey_number)')
      .eq('team_id', game.home_team_id)
      .eq('status', 'approved');

    const roster = (data ?? [])
      .map((m) => {
        const p = m.profiles;
        if (!p) return null;
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
        return {
          id: p.id,
          number: p.jersey_number ?? '–',
          name: name || 'Unbekannt',
          pos: p.position ?? '–',
        };
      })
      .filter(Boolean);

    setTeamRoster(roster);
    setRosterLoading(false);
  }, [game?.home_team_id]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  useEffect(() => {
    setScoreHome(game?.home_score ?? 0);
    setScoreAway(game?.away_score ?? 0);
  }, [game?.id, game?.home_score, game?.away_score]);

  const queueEvent = (eventType, points) => {
    const newHome = selectedTeam === 'home' ? scoreHome + points : scoreHome;
    const newAway = selectedTeam === 'away' ? scoreAway + points : scoreAway;

    if (points > 0) {
      setScoreHome(newHome);
      setScoreAway(newAway);
    }

    setEventQueue((q) => [
      ...q,
      {
        eventType,
        points,
        teamSide: selectedTeam,
        homeScore: newHome,
        awayScore: newAway,
        profileId: selectedTeam === 'home' ? selectedPlayer?.id ?? null : null,
        quarter: selectedQuarter,
      },
    ]);
  };

  const resetScore = () => {
    Alert.alert(
      'Zurücksetzen',
      'Spielstand und ausstehende Events wirklich zurücksetzen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          style: 'destructive',
          onPress: () => {
            setScoreHome(0);
            setScoreAway(0);
            setSelectedTeam('home');
            setSelectedQuarter('1');
            setEventQueue([]);
          },
        },
      ],
    );
  };

  const sendUpdate = async () => {
    if (!game?.id) return;
    if (eventQueue.length === 0) {
      Alert.alert('Kein Event', 'Tippe zuerst auf ein Scoring-Event (TD, FG, …).');
      return;
    }

    setSaving(true);
    try {
      await insertTickerEvents(game.id, eventQueue);

      const { error } = await supabase
        .from('games')
        .update({
          home_score: scoreHome,
          away_score: scoreAway,
          status: 'live',
        })
        .eq('id', game.id);

      if (error) throw error;
      setEventQueue([]);
      Alert.alert('Gesendet', `Spielstand aktualisiert: ${scoreHome}:${scoreAway}`);
    } catch (err) {
      Alert.alert(
        'Fehler',
        err?.message?.includes('Network request failed')
          ? 'Keine Verbindung. Bitte prüfe deine Internetverbindung.'
          : err?.message ?? 'Update fehlgeschlagen.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinishGame = () => {
    if (isFinished) {
      Alert.alert('Bereits beendet', 'Dieses Spiel ist schon abgeschlossen.');
      return;
    }

    Alert.alert(
      'Spiel beenden',
      `Spiel wirklich beenden?\nEndstand: ${scoreHome}:${scoreAway}\n\nTeam- und Spieler-Stats werden aktualisiert.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Spiel beenden',
          style: 'destructive',
          onPress: async () => {
            setFinishing(true);
            try {
              await finishGame(game.id, scoreHome, scoreAway, eventQueue, selectedQuarter);
              setEventQueue([]);
              Alert.alert(
                'Spiel beendet',
                'Endstand gespeichert. Stats und Spielverlauf wurden aktualisiert.',
                [{ text: 'OK', onPress: () => onExit?.() }],
              );
            } catch (err) {
              Alert.alert('Fehler', err?.message ?? 'Spiel konnte nicht beendet werden.');
            } finally {
              setFinishing(false);
            }
          },
        },
      ],
    );
  };

  const gameDateStr = game?.game_date
    ? new Date(game.game_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={B} />
          <Text style={styles.backText}>Code</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>Live-Ticker</Text>
          {game?.game_code ? (
            <Text style={styles.topBarCode}>{game.game_code}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={onExit} hitSlop={8} activeOpacity={0.7}>
          <Text style={styles.exitText}>Schließen</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.matchTitle} numberOfLines={2}>
          {homeName} vs {awayName}
        </Text>
        {(gameDateStr || game?.location) ? (
          <Text style={styles.matchMeta}>
            {[gameDateStr, game?.game_time, game?.location].filter(Boolean).join(' · ')}
          </Text>
        ) : null}

        {isFinished ? (
          <View style={styles.finishedBanner}>
            <Flag size={16} color={B} />
            <Text style={styles.finishedBannerText}>Spiel beendet — Ticker gesperrt</Text>
          </View>
        ) : null}

        <View style={styles.scoreboard}>
          <TouchableOpacity
            style={[styles.teamScoreBox, selectedTeam === 'home' && styles.activeTeamBox]}
            onPress={() => !isFinished && setSelectedTeam('home')}
            disabled={isFinished}
          >
            <Text style={styles.teamLabel} numberOfLines={1}>{homeName.toUpperCase()}</Text>
            <Text style={styles.scoreNumber}>{scoreHome}</Text>
          </TouchableOpacity>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
            {!isFinished && (
              <TouchableOpacity style={styles.resetButton} onPress={resetScore}>
                <RotateCcw size={16} color={B} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.teamScoreBox, selectedTeam === 'away' && styles.activeTeamBox]}
            onPress={() => !isFinished && setSelectedTeam('away')}
            disabled={isFinished}
          >
            <Text style={styles.teamLabel} numberOfLines={1}>{awayName.toUpperCase()}</Text>
            <Text style={styles.scoreNumber}>{scoreAway}</Text>
          </TouchableOpacity>
        </View>

        {!isFinished && (
          <>
            <Text style={styles.infoText}>
              Punkte hinzufügen für:{' '}
              <Text style={styles.infoTeamText}>
                {selectedTeam === 'home' ? homeName.toUpperCase() : awayName.toUpperCase()}
              </Text>
            </Text>

            <Text style={styles.inputLabel}>QUARTER</Text>
            <View style={styles.quarterRow}>
              {QUARTERS.map((q) => (
                <TouchableOpacity
                  key={q.key}
                  style={[
                    styles.quarterBtn,
                    selectedQuarter === q.key && styles.quarterBtnActive,
                  ]}
                  onPress={() => setSelectedQuarter(q.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.quarterBtnText,
                    selectedQuarter === q.key && styles.quarterBtnTextActive,
                  ]}>
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {eventQueue.length > 0 && (
              <View style={styles.queueBanner}>
                <Text style={styles.queueBannerText}>
                  {eventQueue.length} Event{eventQueue.length > 1 ? 's' : ''} bereit zum Senden
                </Text>
              </View>
            )}

            <View style={styles.buttonGrid}>
              <TouchableOpacity style={[styles.scoreButton, styles.tdButton]} onPress={() => queueEvent('touchdown', 6)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPoints}>+6</Text>
                  <Trophy size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.buttonLabel}>TOUCHDOWN</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('field_goal', 3)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+3</Text>
                  <Plus size={18} color={R} />
                </View>
                <Text style={styles.buttonLabelSub}>FIELD GOAL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('safety', 2)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+2</Text>
                  <Plus size={18} color={R} />
                </View>
                <Text style={styles.buttonLabelSub}>SAFETY</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('two_point_conversion', 2)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+2</Text>
                  <Plus size={18} color={R} />
                </View>
                <Text style={styles.buttonLabelSub}>2-PT CONVERSION</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('extra_point', 1)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+1</Text>
                  <Plus size={18} color={R} />
                </View>
                <Text style={styles.buttonLabelSub}>POINT AFTER (PAT)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statButton} onPress={() => queueEvent('interception', 0)}>
                <Text style={styles.statButtonText}>INTERCEPTION (Stat)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statButton} onPress={() => queueEvent('sack', 0)}>
                <Text style={styles.statButtonText}>SACK (Stat)</Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Involvierter Spieler (Optional, nur Heimteam)</Text>

              {rosterLoading ? (
                <ActivityIndicator color={B} style={{ marginVertical: 16 }} />
              ) : teamRoster.length === 0 ? (
                <Text style={styles.emptyRoster}>Kein Kader für dieses Team hinterlegt.</Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    activeOpacity={0.8}
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <View style={styles.dropdownButtonContent}>
                      <Text style={selectedPlayer ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                        {selectedPlayer
                          ? `#${selectedPlayer.number} ${selectedPlayer.name} (${selectedPlayer.pos})`
                          : 'Spieler auswählen...'}
                      </Text>
                    </View>
                    <Text style={{ color: isDropdownOpen ? R : MUTED, fontWeight: 'bold' }}>
                      {isDropdownOpen ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {isDropdownOpen && (
                    <View style={styles.dropdownList}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setSelectedPlayer(null); setIsDropdownOpen(false); }}
                      >
                        <Text style={styles.playerName}>Kein Spieler</Text>
                      </TouchableOpacity>
                      {teamRoster.map((player) => (
                        <TouchableOpacity
                          key={player.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedPlayer(player);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.playerNumber}>#{player.number}</Text>
                          <Text style={styles.playerName}>{player.name}</Text>
                          <Text style={styles.playerPos}>{player.pos}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.sendUpdateButton, saving && styles.sendUpdateDisabled]}
              onPress={sendUpdate}
              disabled={saving || finishing}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.sendUpdateDataText}>Spielstand: {scoreHome}:{scoreAway}</Text>
                  <Text style={styles.sendUpdateButtonText}>TICKER UPDATE SENDEN</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.finishButton, (finishing || saving) && styles.sendUpdateDisabled]}
              onPress={handleFinishGame}
              disabled={finishing || saving}
              activeOpacity={0.85}
            >
              {finishing ? (
                <ActivityIndicator color={R} />
              ) : (
                <>
                  <Flag size={18} color={R} />
                  <Text style={styles.finishButtonText}>SPIEL BEENDEN (FT)</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 72 },
  backText: { color: B, fontSize: 14, fontWeight: '700' },
  topBarCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  topBarTitle: { color: B, fontSize: 15, fontWeight: '900' },
  topBarCode: { color: MUTED, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  exitText: { color: R, fontSize: 13, fontWeight: '800', minWidth: 72, textAlign: 'right' },
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  matchTitle: {
    color: B, fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 4,
  },
  matchMeta: {
    color: MUTED, fontSize: 12, textAlign: 'center', marginBottom: 12, fontWeight: '500',
  },
  finishedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  finishedBannerText: { color: B, fontSize: 13, fontWeight: '700' },
  scoreboard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: BG, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 16, marginTop: 8,
  },
  teamScoreBox: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
  },
  activeTeamBox: { borderColor: R, backgroundColor: '#FFF0F2' },
  teamLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' },
  scoreNumber: { color: B, fontSize: 36, fontWeight: '900' },
  vsContainer: { width: 50, alignItems: 'center' },
  vsText: { color: MUTED, fontSize: 14, fontWeight: '800', fontStyle: 'italic' },
  resetButton: { marginTop: 10, padding: 6, backgroundColor: BG, borderRadius: 8 },
  infoText: { color: MUTED, fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: '600' },
  infoTeamText: { color: R, fontWeight: '800' },
  quarterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  quarterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  quarterBtnActive: {
    backgroundColor: B,
    borderColor: B,
  },
  quarterBtnText: {
    color: B,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quarterBtnTextActive: {
    color: '#FFFFFF',
  },
  queueBanner: {
    backgroundColor: '#FFF0F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  queueBannerText: { color: R, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  scoreButton: {
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 16, padding: 16, width: '48%', marginBottom: 16,
  },
  tdButton: { width: '100%', backgroundColor: R, borderColor: R },
  statButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  statButtonText: { color: B, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  buttonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  buttonPoints: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  buttonPointsGreen: { color: R, fontSize: 24, fontWeight: '900' },
  buttonLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  buttonLabelSub: { color: B, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  sendUpdateButton: {
    backgroundColor: B, borderColor: B, borderWidth: 2,
    borderRadius: 16, padding: 18, width: '100%', marginTop: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: B, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderColor: R,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginTop: 12,
  },
  finishButtonText: { color: R, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  sendUpdateDisabled: { opacity: 0.6 },
  sendUpdateDataText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  sendUpdateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  inputLabel: { color: B, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5, width: '100%' },
  emptyRoster: { color: MUTED, fontSize: 13, marginBottom: 16, fontStyle: 'italic', width: '100%' },
  dropdownButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG, borderColor: BORDER, borderWidth: 1.5,
    borderRadius: 12, paddingHorizontal: 16, height: 52, width: '100%',
  },
  dropdownButtonContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dropdownPlaceholderText: { color: MUTED, fontSize: 14, fontWeight: '500' },
  dropdownSelectedText: { color: B, fontSize: 14, fontWeight: '600' },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderColor: BORDER, borderWidth: 1,
    borderRadius: 12, marginTop: 4, marginBottom: 8, overflow: 'hidden', width: '100%',
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  playerNumber: { color: R, fontWeight: '800', width: 40, fontSize: 14 },
  playerName: { color: B, flex: 1, fontSize: 14, fontWeight: '500' },
  playerPos: { color: MUTED, fontSize: 12, fontWeight: '700' },
});
