import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import type { AudioPlayer } from 'expo-audio';
import { speakLocalSpeech, speakOfflineSpeech, stopAndUnloadSpeech } from '../constants/tts';

type Language = 'tw' | 'en';

export interface HealthTip {
  id: number;
  english: string;
  twi: string;
}

export const HEALTH_TIPS: HealthTip[] = [
  {
    id: 1,
    english: 'Drink only safe water. Boil it, chlorinate it, or use bottled water for drinking, brushing teeth, and cooking.',
    twi: 'Nnom nsuo a ɛho tew nko ara. Noa wo nsuo, de chlorine gu mu, anaa nnom nsuo a ɛwɔ tumpan mu na mfa hohoro wo se anaa mfa noa aduane.',
  },
  {
    id: 2,
    english: 'Wash your hands with soap and clean running water frequently, especially before eating or preparing food, and after using the toilet.',
    twi: 'Hohoro wo nsa ho dadeɛ kwan so mprepren de samina ne nsuo a ɛteɛ hohoro ho, titiriw ansa na woadi aduane, woanoa aduane, ne nea wofi tiafi.',
  },
  {
    id: 3,
    english: 'Cook food thoroughly and eat it while hot. Keep all food covered to prevent flies, and avoid raw unpeeled fruits and vegetables.',
    twi: 'Noa wo nduane yie na di no hye. Kata so na nwansena ankɔgu so, na kyi nnuaba anaa nneɛma a wontumi mmuane ansa na woadi.',
  },
  {
    id: 4,
    english: 'Dispose of feces safely. Always use toilets or latrines, and wash your hands immediately after to prevent contamination.',
    twi: 'Kɔ tiafi ɛfata. Sɛ wofi tiafi a, hohoro wo nsa ho dadeɛ kwan so ntɛm ara ne samina na woantare yareɛ yi mfa mma afoforɔ.',
  },
  {
    id: 5,
    english: 'If you develop watery diarrhea, start drinking Oral Rehydration Salts (ORS) immediately and seek professional medical care.',
    twi: 'Sɛ wowɔ ayamtuo yareɛ a, hyɛ aseɛ nnom ORS nsuo (ano aduru) ntɛm ara, na kɔ ayaresabea kɔhunu dɔkota ansa na nsuo asa wo mu.',
  },
  {
    id: 6,
    english: 'Keep your surroundings clean. Clean and disinfect latrines, handwashing stations, and food preparation surfaces regularly.',
    twi: 'Ma wo mpɔtam hɔ ho ntew daa. Hohoro na kyere tiafi, nsa-hohoro-mmeae, ne mmeae a wɔnoa aduane ho de dwoodwoo yareɛ mmoawa.',
  },
];

interface Props {
  language: Language;
  onClose: () => void;
}

export default function DailyNotificationModal({ language, onClose }: Props) {
  const isEnglish = language === 'en';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<AudioPlayer | null>(null);

  const currentTip = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * HEALTH_TIPS.length);
    return HEALTH_TIPS[randomIndex];
  }, []);

  const tipText = isEnglish ? currentTip.english : currentTip.twi;

  useEffect(() => {
    const timer = setTimeout(() => {
      void handleSpeak();
    }, 250);

    return () => {
      clearTimeout(timer);
      stopAndUnloadSpeech(audioRef.current);
      audioRef.current = null;
      setIsSpeaking(false);
    };
  }, [tipText, isEnglish]);

  const handleSpeak = () => {
    if (isSpeaking) {
      stopAndUnloadSpeech(audioRef.current);
      audioRef.current = null;
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    void (async () => {
      const speechLanguage = isEnglish ? 'en' : 'tw';
      try {
        const player = await speakOfflineSpeech(tipText, speechLanguage, () => setIsSpeaking(false));
        audioRef.current = player;
      } catch {
        setIsSpeaking(false);
      }
    })();
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badge}>
              {isEnglish ? 'DAILY HEALTH ADVISORY' : 'DAA KƆKƆBƆ'}
            </Text>
            <Text style={styles.title}>
              {isEnglish ? 'Cholera Prevention Tip' : 'Cholera Banbɔ Afutu'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {isEnglish ? `Tip ${currentTip.id} of ${HEALTH_TIPS.length}` : `Afutu ${currentTip.id} wɔ ${HEALTH_TIPS.length} mu`}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString(isEnglish ? 'en-US' : 'en-GH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>“{tipText}”</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSpeak} activeOpacity={0.9}>
              <Ionicons name={isSpeaking ? 'stop-circle' : 'volume-high'} size={16} color="#fff" />
              <Text style={styles.secondaryBtnText}>
                {isSpeaking ? (isEnglish ? 'Stop audio' : 'Gyae nnyigyei') : (isEnglish ? 'Read aloud' : 'Kasa mu')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={onClose} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>
                {isEnglish ? 'Got it, continue' : 'Mate aseɛ, toa so'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1c1c1f',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    overflow: 'hidden',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    backgroundColor: '#FF5A36',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.32)',
  },
  metaBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  tipBox: {
    backgroundColor: '#141417',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    padding: 16,
  },
  tipText: {
    color: '#f4f4f5',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#FF5A36',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: '#2a2a2e',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
