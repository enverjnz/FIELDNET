import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Trophy, Plus, ArrowLeftRight, RotateCcw } from 'lucide-react-native';

export default function TickerScreen() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Beispiel-Kader für das Dropdown
  const teamRoster = [
    { id: '1', number: '12', name: 'Tobias Müller', pos: 'QB' },
    { id: '2', number: '28', name: 'Sebastian Kraft', pos: 'RB' },
    { id: '3', number: '84', name: 'Julian Schmid', pos: 'WR' },
    { id: '4', number: '11', name: 'Leon Ginter', pos: 'WR' },
    { id: '5', number: '99', name: 'Max Becker', pos: 'K' },
  ];

  // States für die Spielstände
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  
  // Welches Team ist gerade für die Punkteauswahl ausgewählt? ('home' oder 'away')
  const [selectedTeam, setSelectedTeam] = useState('home');

  // Hilfsfunktion, um dem aktuell ausgewählten Team Punkte hinzuzufügen
  const addPoints = (points) => {
    if (selectedTeam === 'home') {
      setScoreHome(scoreHome + points);
    } else {
      setScoreAway(scoreAway + points);
    }
  };

  // Spielstand zurücksetzen (Reset-Funktion)
  const resetScore = () => {
    setScoreHome(0);
    setScoreAway(0);
    setSelectedTeam('home');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. LIVE SCOREBOARD ANZEIGE */}
      <View style={styles.scoreboard}>
        <TouchableOpacity 
          style={[styles.teamScoreBox, selectedTeam === 'home' && styles.activeTeamBox]}
          onPress={() => setSelectedTeam('home')}
        >
          <Text style={styles.teamLabel}>HEIM</Text>
          <Text style={styles.scoreNumber}>{scoreHome}</Text>
        </TouchableOpacity>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetScore}>
            <RotateCcw size={16} color="#1A2F6E" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.teamScoreBox, selectedTeam === 'away' && styles.activeTeamBox]}
          onPress={() => setSelectedTeam('away')}
        >
          <Text style={styles.teamLabel}>GAST</Text>
          <Text style={styles.scoreNumber}>{scoreAway}</Text>
        </TouchableOpacity>
      </View>

      {/* INFO-TEXT WELCHES TEAM AKTIV IST */}
      <Text style={styles.infoText}>
        Punkte hinzufügen für: <Text style={styles.infoTeamText}>{selectedTeam === 'home' ? 'HEIMTEAM' : 'GASTTEAM'}</Text>
      </Text>

      {/* 2. DIE EINGABEMASKE (SCORING BUTTONS) */}
      <View style={styles.buttonGrid}>
        
        {/* TOUCHDOWN (+6) */}
        <TouchableOpacity style={[styles.scoreButton, styles.tdButton]} onPress={() => addPoints(6)}>
          <View style={styles.buttonHeader}>
            <Text style={styles.buttonPoints}>+6</Text>
            <Trophy size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.buttonLabel}>TOUCHDOWN</Text>
        </TouchableOpacity>

        {/* FIELD GOAL (+3) */}
        <TouchableOpacity style={styles.scoreButton} onPress={() => addPoints(3)}>
          <View style={styles.buttonHeader}>
            <Text style={styles.buttonPointsGreen}>+3</Text>
            <Plus size={18} color="#C01830" />
          </View>
          <Text style={styles.buttonLabelSub}>FIELD GOAL</Text>
        </TouchableOpacity>

        {/* SAFETY (+2) */}
        <TouchableOpacity style={styles.scoreButton} onPress={() => addPoints(2)}>
          <View style={styles.buttonHeader}>
            <Text style={styles.buttonPointsGreen}>+2</Text>
            <Plus size={18} color="#C01830" />
          </View>
          <Text style={styles.buttonLabelSub}>SAFETY</Text>
        </TouchableOpacity>

        {/* TWO-POINT CONVERSION (+2) */}
        <TouchableOpacity style={styles.scoreButton} onPress={() => addPoints(2)}>
          <View style={styles.buttonHeader}>
            <Text style={styles.buttonPointsGreen}>+2</Text>
            <Plus size={18} color="#C01830" />
          </View>
          <Text style={styles.buttonLabelSub}>2-PT CONVERSION</Text>
        </TouchableOpacity>

        {/* PAT (+1) */}
        <TouchableOpacity style={styles.scoreButton} onPress={() => addPoints(1)}>
          <View style={styles.buttonHeader}>
            <Text style={styles.buttonPointsGreen}>+1</Text>
            <Plus size={18} color="#C01830" />
          </View>
          <Text style={styles.buttonLabelSub}>POINT AFTER (PAT)</Text>
        </TouchableOpacity>

        {/* SPIELER DROP-DOWN MENÜ */}
        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Involvierter Spieler (Optional)</Text>
        
        <TouchableOpacity 
          style={styles.dropdownButton} 
          activeOpacity={0.8}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <View style={styles.dropdownButtonContent}>
            <Text style={selectedPlayer ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
              {selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name} (${selectedPlayer.pos})` : 'Spieler auswählen...'}
            </Text>
          </View>
          <Text style={{ color: isDropdownOpen ? '#C01830' : '#6B7280', fontWeight: 'bold' }}>
            {isDropdownOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* AUSKLAPPBARE LISTE */}
        {isDropdownOpen && (
          <View style={styles.dropdownList}>
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

      </View>

      {/* BUTTON: TICKER UPDATE SENDEN */}
        <TouchableOpacity 
          style={styles.sendUpdateButton} 
          onPress={() => alert(`📢 Ticker-Update gesendet! Spielstand: ${scoreHome}:${scoreAway}`)}
        >
          <Text style={styles.sendUpdateDataText}>Spielstand: {scoreHome}:{scoreAway}</Text>
          <Text style={styles.sendUpdateButtonText}>TICKER UPDATE SENDEN </Text>
        </TouchableOpacity>

      {/* PLATZHALTER UNTEN WEGEN NAVBAR */}
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
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
  teamLabel: { color: MUTED, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  scoreNumber: { color: B, fontSize: 36, fontWeight: '900' },
  vsContainer: { width: 50, alignItems: 'center' },
  vsText: { color: MUTED, fontSize: 14, fontWeight: '800', fontStyle: 'italic' },
  resetButton: { marginTop: 10, padding: 6, backgroundColor: BG, borderRadius: 8 },
  infoText: { color: MUTED, fontSize: 13, textAlign: 'center', marginBottom: 24, fontWeight: '600' },
  infoTeamText: { color: R, fontWeight: '800' },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  scoreButton: {
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 16, padding: 16, width: '48%', marginBottom: 16,
  },
  tdButton: { width: '100%', backgroundColor: R, borderColor: R },
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
  sendUpdateDataText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  sendUpdateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  inputLabel: { color: B, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  dropdownButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG, borderColor: BORDER, borderWidth: 1.5,
    borderRadius: 12, paddingHorizontal: 16, height: 52, width: '100%',
  },
  dropdownButtonContent: { flexDirection: 'row', alignItems: 'center' },
  dropdownPlaceholderText: { color: MUTED, fontSize: 14, fontWeight: '500' },
  dropdownSelectedText: { color: B, fontSize: 14, fontWeight: '600' },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderColor: BORDER, borderWidth: 1,
    borderRadius: 12, marginTop: 4, overflow: 'hidden',
    position: 'absolute', top: 76, left: 0, right: 0, zIndex: 999,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  playerNumber: { color: R, fontWeight: '800', width: 40, fontSize: 14 },
  playerName: { color: B, flex: 1, fontSize: 14, fontWeight: '500' },
  playerPos: { color: MUTED, fontSize: 12, fontWeight: '700' },
  scoreCard: {
    backgroundColor: BG, borderColor: BORDER, borderWidth: 1,
    borderRadius: 14, padding: 12, width: 220, marginRight: 12,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  teamContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  teamLogo: { width: 20, height: 20, borderRadius: 10, marginRight: 8, backgroundColor: '#E8EDF8' },
  teamName: { color: MUTED, fontSize: 13, fontWeight: '500', flex: 1 },
});