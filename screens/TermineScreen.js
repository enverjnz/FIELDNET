import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react-native';

export default function TermineScreen() {
  // Testdaten für anstehende Gamedays
  const games = [
    { home: 'Schwäbisch Hall Unicorns', away: 'Potsdam Royals', date: 'Sa, 06. Juni', time: '16:00', league: 'GFL 1', venue: 'Optima Sportpark' },
    { home: 'Stuttgart Surge', away: 'Rhein Fire', date: 'So, 07. Juni', time: '15:00', league: 'ELF', venue: 'GAZi-Stadion' },
    { home: 'Munich Ravens', away: 'Milano Seamen', date: 'So, 07. Juni', time: '16:30', league: 'ELF', venue: 'Unterhaching' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📅 ANSTEHENDE GAMEDAYS</Text>

      {games.map((game, index) => (
        <TouchableOpacity key={index} style={styles.gameCard} activeOpacity={0.8}>
          <View style={styles.leagueHeader}>
            <Text style={styles.leagueBadge}>{game.league}</Text>
            <View style={styles.dateTimeRow}>
              <Calendar size={14} color="#7C8BA1" style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>{game.date}</Text>
              <Clock size={14} color="#7C8BA1" style={{ marginLeft: 8, marginRight: 4 }} />
              <Text style={styles.dateText}>{game.time}</Text>
            </View>
          </View>

          <View style={styles.matchupRow}>
            <View style={styles.teamsColumn}>
              <Text style={styles.teamName}>{game.home}</Text>
              <Text style={styles.vsText}>vs</Text>
              <Text style={styles.teamName}>{game.away}</Text>
            </View>
            <ChevronRight size={20} color="#7C8BA1" />
          </View>

          <View style={styles.venueRow}>
            <MapPin size={14} color="#7C8BA1" style={{ marginRight: 4 }} />
            <Text style={styles.venueText}>{game.venue}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A', padding: 16 },
  sectionTitle: { color: '#7C8BA1', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },
  gameCard: { backgroundColor: '#161F38', borderColor: '#253359', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  leagueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#253359', paddingBottom: 8, marginBottom: 12 },
  leagueBadge: { backgroundColor: 'rgba(158, 240, 26, 0.1)', color: '#9ef01a', borderColor: '#9ef01a', borderWidth: 1, fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: '#7C8BA1', fontSize: 12, fontWeight: '600' },
  matchupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamsColumn: { flex: 1 },
  teamName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  vsText: { color: '#7C8BA1', fontSize: 12, fontWeight: '600', marginVertical: 2, fontStyle: 'italic' },
  減ueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, pt: 8, borderTopWidth: 1, borderTopColor: '#1D2947' },
  venueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  venueText: { color: '#7C8BA1', fontSize: 12, fontWeight: '500' }
});