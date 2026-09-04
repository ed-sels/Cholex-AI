import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Language = 'tw' | 'en';

interface NotificationsScreenProps {
  language: Language;
  darkMode?: boolean;
}

const notifications = [
  {
    id: 'note-1',
    badge: 'HIGH ALERT',
    badgeBg: 'rgba(239,68,68,0.12)',
    badgeColor: '#ef4444',
    icon: 'warning' as const,
    iconColor: '#ef4444',
    timeEn: 'Today, 08:30 AM',
    timeTw: 'Ndɛ, 08:30 AM',
    titleEn: 'Outbreak Surveillance Alert: Greater Accra',
    titleTw: 'Yareɛ ho Kɔkɔbɔ: Greater Accra Mantam',
    descEn:
      '3 new cholera cases reported in Accra Metro & Ga South. Disease surveillance teams from Ghana Health Service have been deployed.',
    descTw:
      'Yɛahu ayamtuo yarefuo foforɔ mmeae3 wɔ Accra Metro ne Ga South. GHS health teams akɔ hɔ dedaw.',
  },
  {
    id: 'note-2',
    badge: 'DAILY ADVISORY',
    badgeBg: 'rgba(245,158,11,0.12)',
    badgeColor: '#f59e0b',
    icon: 'water' as const,
    iconColor: '#f59e0b',
    timeEn: 'Today, 07:00 AM',
    timeTw: 'Ndɛ, 07:00 AM',
    titleEn: 'Water Boiling & Purification Safety',
    titleTw: 'Nsuo Noa ho Kɔkɔbɔ Afutu',
    descEn:
      'Boil all untreated borehole, well, and river water for at least 1–2 minutes before drinking or preparing food.',
    descTw:
      'Noa asubɔnten anaa abura nsuo kosi sɛ ɛbɛhye paa mu da gyedɔgyedɔ ansa na woanom anaa woanoa aduane.',
  },
  {
    id: 'note-3',
    badge: 'HYGIENE REMINDER',
    badgeBg: 'rgba(59,130,246,0.12)',
    badgeColor: '#3b82f6',
    icon: 'hand-left' as const,
    iconColor: '#3b82f6',
    timeEn: 'Yesterday',
    timeTw: 'Enora',
    titleEn: 'Handwashing & Sanitation Drive',
    titleTw: 'Nsa Hohorɔ ne Ahotew Afutu',
    descEn:
      'Wash hands with soap under clean running water for 20 seconds after using latrines, before meals, and after caregiving.',
    descTw:
      'Hohoro wo nsa ho yie de samina gu nsuo a ɛsen mu mprepren sɛ wufiri tiafi ansa na wodi aduane.',
  },
  {
    id: 'note-4',
    badge: 'FREE ORS DRIVE',
    badgeBg: 'rgba(16,185,129,0.12)',
    badgeColor: '#10b981',
    icon: 'medkit' as const,
    iconColor: '#10b981',
    timeEn: '2 days ago',
    timeTw: 'Nnansa ni',
    titleEn: 'Oral Rehydration Salts (ORS) Distribution',
    titleTw: 'ORS Nsuo Aduru Wɔ Hɔ Kwataa',
    descEn:
      'Free ORS sachets are available at all government polyclinics and community health posts (CHPS compounds).',
    descTw:
      'ORS aduru nsuo wɔ hɔ kwa wɔ amansan ayaresabea ne CHPS compound biara mu ma obiara.',
  },
];

export default function NotificationsScreen({ language, darkMode = true }: NotificationsScreenProps) {
  const isEnglish = language === 'en';
  const [expanded, setExpanded] = useState<string | null>(null);
  const theme = darkMode
    ? { safe: '#121214', container: '#121214', header: 'rgba(255,90,54,0.08)', text: '#e4e4e7', muted: '#a1a1aa', card: '#1C1C1F', border: '#2a2a2e', time: '#52525b' }
    : { safe: '#f5f5f5', container: '#f5f5f5', header: '#fff7ed', text: '#18181b', muted: '#52525b', card: '#ffffff', border: '#e4e4e7', time: '#71717a' };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.safe }]} edges={['bottom']}>
      <ScrollView style={[styles.container, { backgroundColor: theme.container }]} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={[styles.headerBanner, { backgroundColor: theme.header, borderColor: 'rgba(255,90,54,0.2)' }] }>
          <Ionicons name="notifications" size={18} color="#FF5A36" />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEnglish ? 'Health Notifications & Advisories' : 'Kɔkɔbɔ Nsɛm ne Afutu'}
          </Text>
        </View>

        {notifications.map((note) => {
          const isOpen = expanded === note.id;
          return (
            <TouchableOpacity
              key={note.id}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setExpanded(isOpen ? null : note.id)}
              activeOpacity={0.85}
            >
              {/* Badge + time row */}
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: note.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: note.badgeColor }]}>
                    {note.badge}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: theme.time }]}>
                  {isEnglish ? note.timeEn : note.timeTw}
                </Text>
              </View>

              {/* Icon + title */}
              <View style={styles.cardTitle}>
                <View style={[styles.iconBox, { backgroundColor: note.badgeBg }]}>
                  <Ionicons name={note.icon} size={16} color={note.iconColor} />
                </View>
                <Text style={[styles.titleText, { color: theme.text }]}>
                  {isEnglish ? note.titleEn : note.titleTw}
                </Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#52525b"
                />
              </View>

              {/* Expanded description */}
              {isOpen && (
                <Text style={[styles.descText, { color: theme.muted, borderTopColor: theme.border }]}>
                  {isEnglish ? note.descEn : note.descTw}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color="#FF5A36" />
          <Text style={[styles.footerText, { color: theme.time }]}>
            {isEnglish
              ? 'Alerts sourced from Ghana Health Service (GHS)'
              : 'Kɔkɔbɔ wɔ firi Ghana Health Service (GHS)'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121214' },
  container: { flex: 1, backgroundColor: '#121214' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,90,54,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,90,54,0.2)',
    marginBottom: 4,
  },
  headerTitle: { color: '#e4e4e7', fontWeight: '700', fontSize: 13, flex: 1 },

  card: {
    backgroundColor: '#1C1C1F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    gap: 10,
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  timeText: { color: '#52525b', fontSize: 10, fontWeight: '500' },

  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  titleText: { color: '#e4e4e7', fontWeight: '700', fontSize: 13, flex: 1 },

  descText: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2e',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 8,
  },
  footerText: { color: '#52525b', fontSize: 10 },
});
