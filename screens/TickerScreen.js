import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Trophy, Plus, RotateCcw, ArrowLeft, Flag } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { insertTickerEvents } from '../lib/tickerEvents';
import { finishGame } from '../lib/finishGame';
import { fetchTickerGameById } from '../lib/validateTickerAccess';
import { useTheme } from '../context/ThemeContext';
import { createTickerStyles } from '../theme/tickerStyles';

const QUARTERS = [
  { key: '1', label: 'Q1' },
  { key: '2', label: 'Q2' },
  { key: '3', label: 'Q3' },
  { key: '4', label: 'Q4' },
];

function TeamScoreLogo({ uri, label, styles }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.scoreTeamLogo} resizeMode="contain" />;
  }
  return (
    <View style={styles.scoreTeamLogoPlaceholder}>
      <Text style={styles.scoreTeamLogoText}>{(label ?? '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export default function TickerScreen({ game, onBack, onExit, onGameUpdated }) {
  const { colors } = useTheme();

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [teamRoster, setTeamRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [eventQueue, setEventQueue] = useState([]);
  const [awayLogoUrl, setAwayLogoUrl] = useState(null);

  const [scoreHome, setScoreHome] = useState(game?.home_score ?? 0);
  const [scoreAway, setScoreAway] = useState(game?.away_score ?? 0);
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [selectedQuarter, setSelectedQuarter] = useState('1');

  const styles = useMemo(() => createTickerStyles(colors, selectedTeam), [colors, selectedTeam]);
  const teamAccent = selectedTeam === 'home' ? colors.primary : colors.accent;

  const isFinished = (game?.status ?? '').toLowerCase() === 'finished';
  const homeName = game?.home_team?.name ?? game?.home_team?.short_name ?? 'Heim';
  const awayName = game?.away_team_name ?? 'Gast';
  const homeLogoUrl = game?.home_team?.avatar_teamlogo ?? null;

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
    let cancelled = false;
    (async () => {
      const name = game?.away_team_name?.trim();
      if (!name) {
        if (!cancelled) setAwayLogoUrl(null);
        return;
      }

      const { data: byName } = await supabase
        .from('teams')
        .select('avatar_teamlogo')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();

      if (byName?.avatar_teamlogo) {
        if (!cancelled) setAwayLogoUrl(byName.avatar_teamlogo);
        return;
      }

      const { data: byShort } = await supabase
        .from('teams')
        .select('avatar_teamlogo')
        .ilike('short_name', name)
        .limit(1)
        .maybeSingle();

      if (!cancelled) setAwayLogoUrl(byShort?.avatar_teamlogo ?? null);
    })();
    return () => { cancelled = true; };
  }, [game?.away_team_name]);

  useEffect(() => {
    setScoreHome(game?.home_score ?? 0);
    setScoreAway(game?.away_score ?? 0);
  }, [game?.id, game?.home_score, game?.away_score]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!game?.id) return;
      const fresh = await fetchTickerGameById(game.id);
      if (cancelled || !fresh) return;
      setScoreHome(fresh.home_score ?? 0);
      setScoreAway(fresh.away_score ?? 0);
      onGameUpdated?.(fresh);
    })();
    return () => { cancelled = true; };
  }, [game?.id]);

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
      setSelectedPlayer(null);
      setIsDropdownOpen(false);
      onGameUpdated?.({
        ...game,
        home_score: scoreHome,
        away_score: scoreAway,
        status: 'live',
      });
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
              onGameUpdated?.({
                ...game,
                home_score: scoreHome,
                away_score: scoreAway,
                status: 'finished',
              });
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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.text} />
          <Text style={styles.backText}>Zurück</Text>
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
            <Flag size={16} color={colors.text} />
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
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{scoreHome}</Text>
              <TeamScoreLogo uri={homeLogoUrl} label={homeName} styles={styles} />
            </View>
          </TouchableOpacity>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
            {!isFinished && (
              <TouchableOpacity style={styles.resetButton} onPress={resetScore}>
                <RotateCcw size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.teamScoreBox, selectedTeam === 'away' && styles.activeTeamBox]}
            onPress={() => !isFinished && setSelectedTeam('away')}
            disabled={isFinished}
          >
            <Text style={styles.teamLabel} numberOfLines={1}>{awayName.toUpperCase()}</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{scoreAway}</Text>
              <TeamScoreLogo uri={awayLogoUrl} label={awayName} styles={styles} />
            </View>
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
                  <Plus size={18} color={teamAccent} />
                </View>
                <Text style={styles.buttonLabelSub}>FIELD GOAL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('safety', 2)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+2</Text>
                  <Plus size={18} color={teamAccent} />
                </View>
                <Text style={styles.buttonLabelSub}>SAFETY</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('two_point_conversion', 2)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+2</Text>
                  <Plus size={18} color={teamAccent} />
                </View>
                <Text style={styles.buttonLabelSub}>2-PT CONVERSION</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scoreButton} onPress={() => queueEvent('extra_point', 1)}>
                <View style={styles.buttonHeader}>
                  <Text style={styles.buttonPointsGreen}>+1</Text>
                  <Plus size={18} color={teamAccent} />
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
                <ActivityIndicator color={colors.text} style={{ marginVertical: 16 }} />
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
                    <Text style={{ color: isDropdownOpen ? teamAccent : colors.textMuted, fontWeight: 'bold' }}>
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
                <ActivityIndicator color={teamAccent} />
              ) : (
                <>
                  <Flag size={18} color={teamAccent} />
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
