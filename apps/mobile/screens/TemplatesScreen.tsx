import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Language = 'tw' | 'en';

interface TemplatesScreenProps {
  language: Language;
  darkMode?: boolean;
  onSendToChat: (query: string) => void;
}

interface ChecklistState {
  wateryDiarrhea: boolean;
  vomiting: boolean;
  muscleCramps: boolean;
  sunkenEyes: boolean;
  dryMouth: boolean;
}

const symptoms = [
  {
    key: 'wateryDiarrhea' as const,
    titleEn: "Profuse Watery Diarrhea ('Rice-Water Stool')",
    titleTw: 'Ayamtuo a ɛbɔ nsuo gyegyegye',
    descEn: 'Sudden onset of massive painless loose stool.',
    descTw: 'Ayamtuo a ɛba ntɛm ara a enni yaa biara.',
    icon: 'water-outline' as const,
  },
  {
    key: 'vomiting' as const,
    titleEn: 'Severe Vomiting',
    titleTw: 'Afefeɔ (Severe Vomiting)',
    descEn: 'Inability to keep liquids down.',
    descTw: 'Aduane anaa nsuo biara ntumi ntena wo mu.',
    icon: 'alert-circle-outline' as const,
  },
  {
    key: 'muscleCramps' as const,
    titleEn: 'Muscle Cramps & Leg Pain',
    titleTw: 'Honam mmerɛw (Muscle Cramps)',
    descEn: 'Painful cramping in legs, feet, or abdomen.',
    descTw: 'Honam mmerɛw a ɛyɛ ya wɔ nan, nan ase, anaa yafunuhu mu.',
    icon: 'body-outline' as const,
  },
  {
    key: 'sunkenEyes' as const,
    titleEn: 'Sunken Eyes & Dry Skin',
    titleTw: 'Aniwa a ɛtim ne nhwiren (Sunken Eyes)',
    descEn: 'Eyes appear sunken; skin loses elasticity.',
    descTw: 'Aniwa tena fam; nhwiren ntumi nsesa yie.',
    icon: 'eye-outline' as const,
  },
  {
    key: 'dryMouth' as const,
    titleEn: 'Dry Mouth & Intense Thirst',
    titleTw: 'Anofam are (Dry Mouth & Thirst)',
    descEn: 'Extreme thirst with dry mouth, lips, and tongue.',
    descTw: 'Ɔpono kɛseɛ a anofam, nhôma, ne tɛkrɛma are.',
    icon: 'medical-outline' as const,
  },
];

export default function TemplatesScreen({ language, darkMode = true, onSendToChat }: TemplatesScreenProps) {
  const isEnglish = language === 'en';
  const theme = darkMode
    ? { safe: '#121214', container: '#121214', card: '#1C1C1F', text: '#e4e4e7', muted: '#a1a1aa', border: '#2a2a2e', alt: '#0f0f11', panel: 'rgba(255,90,54,0.08)' }
    : { safe: '#f5f5f5', container: '#f5f5f5', card: '#ffffff', text: '#18181b', muted: '#52525b', border: '#e4e4e7', alt: '#f3f4f6', panel: '#fff7ed' };
  const [checklist, setChecklist] = useState<ChecklistState>({
    wateryDiarrhea: false,
    vomiting: false,
    muscleCramps: false,
    sunkenEyes: false,
    dryMouth: false,
  });

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const getRisk = () => {
    if (checkedCount === 0)
      return {
        level: isEnglish ? 'None' : 'Yareɛ biara nni hɔ',
        color: '#52525b',
        bg: '#1C1C1F',
        desc: isEnglish ? 'No dehydration symptoms selected.' : 'Wansese nsenkyerɛne biara.',
      };
    if (checkedCount <= 1)
      return {
        level: isEnglish ? 'Low Risk' : 'Mmerɛwa (Mild)',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        desc: isEnglish
          ? 'Mild hydration loss. Drink plenty of clean water and monitor.'
          : 'Yareɛ ho kwan su kɛseɛ nni hɔ. Nnom nsuo pii na hwɛ wo ho yie.',
      };
    if (checkedCount <= 3)
      return {
        level: isEnglish ? 'Moderate Risk' : 'Mfantom (Moderate)',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        desc: isEnglish
          ? 'Prepare and drink ORS immediately. Seek guidance if symptoms persist.'
          : 'Yɛ ORS nsuo noa ntɛm ara na nom na sɔ hwɛ.',
      };
    return {
      level: isEnglish ? 'HIGH DANGER — CRITICAL' : 'ƆHAFOƆ — HU PAAPA',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      desc: isEnglish
        ? 'Severe dehydration! Administer ORS immediately and go to nearest clinic/hospital NOW.'
        : 'Nsuo asa wo mu kɛseɛ! Nom ORS mprepren na kɔ ayaresabea ntɛm ara.',
    };
  };

  const risk = getRisk();

  const handleSend = () => {
    const query = isEnglish
      ? `I have ${checkedCount} dehydration symptoms (Watery diarrhea: ${checklist.wateryDiarrhea ? 'yes' : 'no'}, Vomiting: ${checklist.vomiting ? 'yes' : 'no'}, Muscle cramps: ${checklist.muscleCramps ? 'yes' : 'no'}, Sunken eyes: ${checklist.sunkenEyes ? 'yes' : 'no'}, Dry mouth: ${checklist.dryMouth ? 'yes' : 'no'}). What should I do?`
      : `Mahwehwɛ nsenkyerɛne ${checkedCount} (Ayamtuo: ${checklist.wateryDiarrhea ? 'yiw' : 'daabi'}, Afefeɔ: ${checklist.vomiting ? 'yiw' : 'daabi'}). Mmoa dɛn na mɛnya?`;
    onSendToChat(query);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.safe }]} edges={['bottom']}>
      <ScrollView style={[styles.container, { backgroundColor: theme.container }]} contentContainerStyle={styles.content}>

        {/* Intro Banner */}
        <View style={[styles.introBanner, { backgroundColor: theme.panel, borderColor: 'rgba(255,90,54,0.2)' }]}>
          <Ionicons name="shield-half" size={18} color="#FF5A36" />
          <View style={styles.introText}>
            <Text style={[styles.introTitle, { color: theme.text }]}>
              {isEnglish ? 'Bilingual Symptom Assessment' : 'Yareɛ Nsenkyerɛne Sɔhwɛ'}
            </Text>
            <Text style={[styles.introDesc, { color: theme.muted }]}>
              {isEnglish
                ? 'Select the symptoms being experienced. Our system will evaluate your dehydration risk.'
                : 'Sesa nsenkyerɛne a woahu. System yi bɛhwɛ sɛnea nsuo firi wo mu kɔ.'}
            </Text>
          </View>
        </View>

        {/* Risk Score Panel */}
        <View style={[styles.scoreCard, { backgroundColor: risk.bg, borderColor: risk.color + '40' }]}>

          <Text style={[styles.scoreLabel, { color: theme.muted }]}> 
            {isEnglish ? 'Dehydration Danger Score' : 'Nsuo-Asadie Hazard'}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color: '#FF5A36' }]}>
              {checkedCount}
              <Text style={styles.scoreMax}> / 5</Text>
            </Text>
            <View style={[styles.riskBadge, { borderColor: risk.color + '50' }]}>
              <Text style={[styles.riskLevel, { color: risk.color }]}>{risk.level}</Text>
            </View>
          </View>
          <Text style={[styles.riskDesc, { color: theme.muted }]}>{risk.desc}</Text>

          <TouchableOpacity
            style={[styles.sendBtn, checkedCount === 0 && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={checkedCount === 0}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={15} color={checkedCount === 0 ? '#52525b' : '#fff'} />
            <Text style={[styles.sendBtnText, checkedCount === 0 && styles.sendBtnTextDisabled]}>
              {isEnglish ? 'Send Symptom Report to AI' : 'Soma diagnostic afutu yi kɔ AI ho'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Symptoms Checklist */}
        <View style={[styles.checklistCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.checklistTitle, { color: theme.text }]}>
            {isEnglish ? 'Select Experienced Symptoms:' : 'Yi Nsenkyerɛne a woahu:'}
            <Text style={styles.checklistCount}> ({checkedCount} {isEnglish ? 'selected' : 'ayi'})</Text>
          </Text>

          {symptoms.map((s, idx) => {
            const checked = checklist[s.key];
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.symptomRow, { backgroundColor: theme.alt, borderColor: theme.border }, checked && styles.symptomRowActive]}
                onPress={() => setChecklist({ ...checklist, [s.key]: !checked })}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                  {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={styles.symptomInfo}>
                  <Text style={[styles.symptomTitle, { color: theme.text }]}>
                    {isEnglish ? s.titleEn : s.titleTw}
                  </Text>
                  <Text style={[styles.symptomDesc, { color: theme.muted }]}>
                    {isEnglish ? s.descEn : s.descTw}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121214' },
  container: { flex: 1, backgroundColor: '#121214' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,90,54,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,90,54,0.2)',
  },
  introText: { flex: 1 },
  introTitle: { color: '#e4e4e7', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  introDesc: { color: '#a1a1aa', fontSize: 12, lineHeight: 17 },

  scoreCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  scoreLabel: { color: '#71717a', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreNum: { fontSize: 48, fontWeight: '900', lineHeight: 52 },
  scoreMax: { fontSize: 20, fontWeight: '400', color: '#71717a' },
  riskBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  riskLevel: { fontSize: 11, fontWeight: '800' },
  riskDesc: { color: '#a1a1aa', fontSize: 12, lineHeight: 17 },
  sendBtn: {
    backgroundColor: '#FF5A36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  sendBtnDisabled: { backgroundColor: '#2a2a2e' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sendBtnTextDisabled: { color: '#52525b' },

  checklistCard: {
    backgroundColor: '#1C1C1F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    gap: 10,
  },
  checklistTitle: { color: '#e4e4e7', fontWeight: '700', fontSize: 13 },
  checklistCount: { color: '#71717a', fontWeight: '400' },

  symptomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#0f0f11',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  symptomRowActive: {
    backgroundColor: 'rgba(255,90,54,0.06)',
    borderColor: 'rgba(255,90,54,0.3)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  symptomInfo: { flex: 1 },
  symptomTitle: { color: '#e4e4e7', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  symptomDesc: { color: '#71717a', fontSize: 11, lineHeight: 15 },
});
