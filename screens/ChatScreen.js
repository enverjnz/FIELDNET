import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MessageSquare, Users, MessageCirclePlus, Search } from 'lucide-react-native';

export default function ChatScreen() {
  // Beispielhafte Daten für die Direktnachrichten (DMs) oben
  const directMessages = [
    { id: 1, name: 'Coach Thomas', avatar: 'T', online: true, unread: true },
    { id: 2, name: 'Max (Unicorns Fan)', avatar: 'M', online: true, unread: false },
    { id: 3, name: 'Sarah_GFL', avatar: 'S', online: false, unread: false },
    { id: 4, name: 'RunningBack_99', avatar: 'R', online: true, unread: true },
    { id: 5, name: 'Lisa (Stuttgart)', avatar: 'L', online: false, unread: false },
  ];

  // Deine bestehenden Community-Kanäle
  const communityChannels = [
    { id: 'gfl1', name: 'GFL 1 - Hauptchat', members: '1.240', lastMsg: 'Habt ihr das Game-Winning Field Goal gesehen?!', time: '14:32' },
    { id: 'bawu', name: 'BaWü-Football Talk', members: '430', lastMsg: 'Wann kommt der neue Spielplan für die Oberliga?', time: 'Gestern' },
    { id: 'dbfx', name: 'DBFX Frauen-Bundesliga', members: '280', lastMsg: 'Starkes Spiel der Kobra Ladies am Wochenende!', time: '2 Tage' },
  ];

  return (
    <View style={styles.container}>
      {/* 1. SEKTION: DIREKTNACHRICHTEN (DMs) - HORIZONTAL */}
      <View style={styles.dmSection}>
        <Text style={styles.sectionTitle}>💬 DIREKTNACHRICHTEN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dmScroll}>
          {directMessages.map((dm) => (
            <TouchableOpacity key={dm.id} style={styles.dmAvatarWrapper} activeOpacity={0.7}>
              <View style={styles.avatarContainer}>
                {/* Runder Avatar-Kreis */}
                <View style={[styles.avatarCircle, dm.unread && styles.unreadAvatarBorder]}>
                  <Text style={styles.avatarLetter}>{dm.avatar}</Text>
                </View>
                
                {/* Grüner Online-Punkt */}
                {dm.online && <View style={styles.onlineBadge} />}
                
                {/* Ungelesen-Indikator-Punkt */}
                {dm.unread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.dmName} numberOfLines={1}>{dm.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TRENNELEMENT */}
      <View style={styles.divider} />

      {/* 2. SEKTION: COMMUNITY KANÄLE - VERTIKAL */}
      <View style={styles.channelSection}>
        <View style={styles.channelHeader}>
          <Text style={styles.sectionTitle}>👥 COMMUNITY CHATS</Text>
          <TouchableOpacity>
            <MessageCirclePlus size={20} color="#C01830" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.channelScroll} showsVerticalScrollIndicator={false}>
          {communityChannels.map((channel) => (
            <TouchableOpacity key={channel.id} style={styles.channelCard} activeOpacity={0.8}>
              <View style={styles.channelIconCircle}>
                <Users size={20} color="#1A2F6E" />
              </View>
              <View style={styles.channelInfo}>
                <View style={styles.channelMetaRow}>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.channelTime}>{channel.time}</Text>
                </View>
                <Text style={styles.channelSubText}>{channel.members} Mitglieder</Text>
                <Text style={styles.channelLastMsg} numberOfLines={1}>{channel.lastMsg}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 150 }} />
        </ScrollView>
      </View>
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
  sectionTitle: { color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 10 },
  dmSection: { marginTop: 16, paddingBottom: 4 },
  dmScroll: { paddingLeft: 16, flexDirection: 'row' },
  dmAvatarWrapper: { alignItems: 'center', marginRight: 16, width: 65 },
  avatarContainer: { position: 'relative', width: 52, height: 52 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: BG, borderColor: BORDER, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  unreadAvatarBorder: { borderColor: B, borderWidth: 2.5 },
  avatarLetter: { color: B, fontSize: 16, fontWeight: '800' },
  onlineBadge: {
    position: 'absolute', bottom: 0, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF',
  },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: R, borderWidth: 2, borderColor: '#FFFFFF',
  },
  dmName: { color: MUTED, fontSize: 10, fontWeight: '600', marginTop: 6, textAlign: 'center', width: '100%' },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 16 },
  channelSection: { flex: 1 },
  channelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
  channelScroll: { flex: 1, paddingHorizontal: 16 },
  channelCard: {
    flexDirection: 'row', backgroundColor: BG,
    borderColor: BORDER, borderWidth: 1, borderRadius: 14,
    padding: 12, alignItems: 'center', marginBottom: 10,
  },
  channelIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E8EDF8', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  channelInfo: { flex: 1 },
  channelMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  channelName: { color: B, fontSize: 14, fontWeight: '800' },
  channelTime: { color: MUTED, fontSize: 10, fontWeight: '500' },
  channelSubText: { color: MUTED, fontSize: 11, fontWeight: '600', marginTop: 2 },
  channelLastMsg: { color: '#9CA3AF', fontSize: 12, fontWeight: '500', marginTop: 4 },
});