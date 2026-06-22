import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, ListOrdered } from 'lucide-react-native';

export default function LigenScreen() {
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeConference, setActiveConference] = useState(0); // 0 = SÜD, 1 = NORD
  const [activeSubTab, setActiveSubTab] = useState(0); // 0 = TABELLE, 1 = SPIELPLAN (TERMINE)

  const leagues = ['GFL 1', 'GFL 2', 'ELF', 'DBFX (FRAUEN)', '2. DBL', 'REGIONAL'];
  const conferences = ['STAFFEL SÜD', 'STAFFEL NORD'];

  // Mock-Daten Tabelle
  const tableDataGFLSud = [
    { rank: 1, name: 'Schw. Hall Unicorns', logo: 'U', w: 6, l: 0, pts: '12:00' },
    { rank: 2, name: 'Allgäu Comets', logo: 'C', w: 4, l: 2, pts: '08:04' },
    { rank: 3, name: 'Stuttgart Scorpions', logo: 'S', w: 3, l: 3, pts: '06:06' },
    { rank: 4, name: 'Munich Cowboys', logo: 'M', w: 2, l: 4, pts: '04:08' },
  ];

  // Neue Mock-Daten für die Termine / den Spielplan
  const scheduleDataGFLSud = [
    { date: 'SA, 06. JUNI', time: '16:00', home: 'Schw. Hall Unicorns', away: 'Stuttgart Scorpions', field: 'OPTIMA Sportpark' },
    { date: 'SO, 07. JUNI', time: '15:00', home: 'Munich Cowboys', away: 'Allgäu Comets', field: 'Dante导入' },
    { date: 'SA, 13. JUNI', time: '16:00', home: 'Allgäu Comets', away: 'Schw. Hall Unicorns', field: 'Illerstadion' },
  ];

  return (
    <View style={styles.container}>
      {/* 1. HORIZONTALER LIGA-FILTER */}
      <View style={{ marginTop: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {leagues.map((league, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterTab, activeLeague === index && styles.activeFilterTab]}
              onPress={() => setActiveLeague(index)}
            >
              <Text style={[styles.filterTabText, activeLeague === index && styles.activeFilterTabText]}>
                {league}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* NEU: SUB-NAVBAR FÜR TABELLE VS. SPIELPLAN */}
      <View style={styles.subTabContainer}>
        <TouchableOpacity 
          style={[styles.subTab, activeSubTab === 0 && styles.activeSubTab]} 
          onPress={() => setActiveSubTab(0)}
        >
          <ListOrdered size={16} color={activeSubTab === 0 ? '#C01830' : '#6B7280'} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 0 && styles.activeSubTabText]}>TABELLE</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.subTab, activeSubTab === 1 && styles.activeSubTab]} 
          onPress={() => setActiveSubTab(1)}
        >
          <Calendar size={16} color={activeSubTab === 1 ? '#C01830' : '#6B7280'} style={{ marginRight: 6 }} />
          <Text style={[styles.subTabText, activeSubTab === 1 && styles.activeSubTabText]}>SPIELPLAN</Text>
        </TouchableOpacity>
      </View>

      {/* 2. CONFERENCE / STAFFEL SWITCHER */}
      <View style={styles.conferenceContainer}>
        {conferences.map((conf, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.conferenceButton, activeConference === index && styles.activeConferenceButton]}
            onPress={() => setActiveConference(index)}
          >
            <Text style={[styles.conferenceButtonText, activeConference === index && styles.activeConferenceButtonText]}>
              {conf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. DYNAMISCHER INHALT: TABELLE ODER SPIELPLAN */}
      <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
        {activeSubTab === 0 ? (
          // --- TABELLEN ANSICHT ---
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, { width: 30 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'left' }]}>TEAM</Text>
              <Text style={[styles.headerCell, { width: 30 }]}>W</Text>
              <Text style={[styles.headerCell, { width: 30 }]}>L</Text>
              <Text style={[styles.headerCell, { width: 55, textAlign: 'right' }]}>PTS</Text>
            </View>

            {tableDataGFLSud.map((team, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.rankText, team.rank <= 2 && styles.topRankText]}>{team.rank}</Text>
                <View style={styles.teamInfoCell}>
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoLetter}>{team.logo}</Text>
                  </View>
                  <Text style={styles.teamNameText} numberOfLines={1}>{team.name}</Text>
                </View>
                <Text style={styles.statCell}>{team.w}</Text>
                <Text style={styles.statCell}>{team.l}</Text>
                <Text style={styles.ptsCell}>{team.pts}</Text>
              </View>
            ))}
          </View>
        ) : (
          // --- SPIELPLAN / TERMINE ANSICHT ---
          <View>
            {scheduleDataGFLSud.map((game, index) => (
              <View key={index} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleDate}>{game.date}</Text>
                  <Text style={styles.scheduleTime}>{game.time} UHR</Text>
                </View>
                <View style={styles.scheduleMatchup}>
                  <Text style={styles.scheduleTeam}>{game.home}</Text>
                  <Text style={styles.scheduleVs}>vs</Text>
                  <Text style={styles.scheduleTeam}>{game.away}</Text>
                </View>
                <Text style={styles.scheduleField}>📍 {game.field}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={{ height: 150 }} />
      </ScrollView>
    </View>
  );
}

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  filterScroll: { paddingLeft: 16, flexDirection: 'row', height: 48 },
  filterTab: { paddingHorizontal: 16, height: 34, borderRadius: 17, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1.5, borderColor: BORDER },
  activeFilterTab: { backgroundColor: B, borderColor: B },
  filterTabText: { color: MUTED, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  activeFilterTabText: { color: '#FFFFFF' },

  subTabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 4, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  subTab: { flex: 1, flexDirection: 'row', paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  activeSubTab: { borderBottomWidth: 2, borderBottomColor: R },
  subTabText: { color: MUTED, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  activeSubTabText: { color: B },

  conferenceContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 6, marginBottom: 16, backgroundColor: BG, borderRadius: 8, padding: 3 },
  conferenceButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeConferenceButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER },
  conferenceButtonText: { color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  activeConferenceButtonText: { color: B },
  tableScroll: { flex: 1, paddingHorizontal: 16 },
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER, alignItems: 'center' },
  headerCell: { color: MUTED, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  tableRow: { flexDirection: 'row', backgroundColor: BG, borderColor: BORDER, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', marginTop: 8 },
  rankText: { color: MUTED, fontSize: 13, fontWeight: '700', width: 30, textAlign: 'center' },
  topRankText: { color: R },
  teamInfoCell: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 4 },
  logoPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E8EDF8', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoLetter: { color: B, fontSize: 11, fontWeight: '800' },
  teamNameText: { color: B, fontSize: 13, fontWeight: '700' },
  statCell: { color: MUTED, fontSize: 13, fontWeight: '600', width: 30, textAlign: 'center' },
  ptsCell: { color: B, fontSize: 13, fontWeight: '800', width: 55, textAlign: 'right' },

  scheduleCard: { backgroundColor: BG, borderColor: BORDER, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6, marginBottom: 8 },
  scheduleDate: { color: MUTED, fontSize: 10, fontWeight: '800' },
  scheduleTime: { color: R, fontSize: 10, fontWeight: '800' },
  scheduleMatchup: { flexDirection: 'column', marginVertical: 4 },
  scheduleTeam: { color: B, fontSize: 14, fontWeight: '700' },
  scheduleVs: { color: MUTED, fontSize: 11, fontWeight: '600', fontStyle: 'italic', marginVertical: 2 },
  scheduleField: { color: MUTED, fontSize: 11, fontWeight: '500', marginTop: 6 },
});