export interface LocalResponse {
  response: string;
  english: string;
  intent: string;
  confidence: number;
}

export const RESPONSES_DB: Record<string, { response: string; english: string }> = {
  symptoms_query: {
    response: "Cholera yareɛ no ho nsenkyerɛne titiriw ne ayamtuo kɛseɛ a ɛte sɛ nsuo (a ɛte sɛ nsubɛn) ne ɛfeɛ a ɛnto mpa. Eyi betumi ama wo ho nsuo asa ntɛm (dehydration), na ama woayɛ mmerɛ, w'anofafa awo, na woayɛ basabasa. Sɛ woahu nsenkyerɛne yi a, bɔ mbɔden fa nsuo a wɔaka ORS gu mu ma yarefoɔ no ntɛm ara.",
    english: "The main symptoms of cholera are severe watery diarrhea (like rice-water) and frequent vomiting. This can cause rapid dehydration, leading to weakness, dry mouth, and confusion. If you notice these, give the patient ORS immediately."
  },
  transmission_query: {
    response: "Cholera yareɛ yi fata ntɛm nam nsuo anaa aduane a nfifiseɛ anaa efi (cholera bacteria) firi nipa kɔm bin mu akɔwura mu. Sɛ obi anohoro ne nsa a ɛfi mu, na ɔde aduane anaa nsuo gu ne nsa mu, anaa sɛ aduane a yɛantoto mu yie a nkuku ne nkae akɔgu mu a, obi betumi anya cholera yareɛ no.",
    english: "Cholera spreads through drinking water or eating food contaminated with the cholera bacteria (from human feces). If someone doesn't wash their hands well, touches food, or if food is left uncovered where flies can land on it, one can get cholera."
  },
  prevention_query: {
    response: "Sɛnea yɛbɛbɔ yɛn ho ban afiri cholera ho ne sɛ:\n1. Hohoro wo nsa ne samina ne nsuo pa bere biara a wofiri asuogya, ansa na woadi aduane anaa woayɛ aduane.\n2. Nua wo nsuo ansa na woanom anaa fa nsuo pa (chlorinated/bottled water) di dwuma.\n3. Noa wo nnobae ne nnuane yie, na twere nnuane a awo.\n4. Siesie wo mpɔtam hɔ na mma efi nnantew mmra wo nnuane ho.",
    english: "How to prevent cholera:\n1. Wash your hands with soap and running water after using the toilet and before preparing or eating food.\n2. Boil your drinking water or use safe, treated/bottled water.\n3. Cook your food and vegetables thoroughly, and eat hot meals.\n4. Keep your surroundings clean and prevent flies from getting close to your food."
  },
  treatment_query: {
    response: "Cholera yareɛ ho ano aduru titiriw ne sɛ yɛbɛsan de nsuo a ayera afiri nipadua no mu ahyɛ mu bio. Fa ORS (Oral Rehydration Salts) aduru a wɔahyɛ ho se ma yarefoɔ no ntɛm ara. Sɛ wo nni ORS aduru a, wo betumi ayɛ bi wo fie: fa lita baako nsuo pa, asikre nsa-mmerɛ nsia (6 teaspoons of sugar), ne nkyene nsa-mmerɛ fa (half teaspoon of salt) na fra bom yie ma ɔnom. Kɔ ayaresabea ntɛm ara!",
    english: "The primary treatment for cholera is rehydration to replace lost fluids. Give ORS (Oral Rehydration Salts) immediately. If you don't have ORS, you can make Home-made Rehydration Solution: mix 1 liter of safe water, 6 teaspoons of sugar, and half teaspoon of salt. Go to the hospital immediately!"
  },
  emergency_query: {
    response: "SƐ OBI HO AYƐ MMERƐ KƐSEƐ, N'ANI APƆN, ƆRENYƐ NNYEESOƆ, ANAA ƆREFE NE AYAMTUO A ƐNTO MPA A, EYI NE EMERGENCY! Ma no ORS nsuo na kɔ ayaresabea anaa dɔkota hɔ ntɛm ara! Mmetegwee na kɔ ayaresabea a ɛbɛn wo ntɛm ara na wɔakɔma no nsuo wɔ ne ntin (IV fluids) na ayera n'nkwa!",
    english: "IF SOMEONE BECOMES EXTREMELY WEAK, HAS SUNKEN EYES, IS UNRESPONSIVE, OR HAS UNCONTROLLABLE VOMITING AND DIARRHEA, THIS IS AN EMERGENCY! Give them ORS and go to the hospital or doctor immediately! Hurry to the nearest health facility so they can receive IV fluids to save their life!"
  },
  general_greeting: {
    response: "Mema wo akwaaba! Me ne Cholera Twi Chatbot a metumi abua wo nsɛmmisa afiri cholera ho. Sɛ wopɛ sɛ wubisa ho nsenkyerɛne (symptoms), sɛnea ɛfata (transmission), ho banbɔ (prevention), anaa ano aduru (treatment/ORS) a, wobɛtumi abisa me wo Twi kasa mu. Mebua wo ntɛm ara!",
    english: "Welcome! I am the Cholera Twi Chatbot and I can answer your questions about cholera. If you want to ask about symptoms, transmission, prevention, or treatment/ORS, you can ask me in Twi or English. I will answer you immediately!"
  },
  fallback: {
    response: "Mepa wo kyɛw, mantaase nea woaka no yie. Metumi abua wo nsɛmmisa afiri cholera ho (ho nsenkyerɛne, banbɔ, ano aduru anaa nea ɛfata). Meserɛ wo, bisa saara nsɛm wo Twi mu na mambua wo.",
    english: "I can help answer questions about cholera symptoms, prevention, ORS treatment, or transmission. Please ask me any health question about cholera in Twi or English."
  }
};

const KEYWORDS: Record<string, string[]> = {
  symptoms_query: [
    "nsenkyerɛne", "ahu", "anofafa", "feɛ", "afeɛ", "ayamtuo", "ayamyare", 
    "yamtuo", "nsubɛn", "mmerɛ", "asɛe", "stomach", "vomit", "vomiting", "diarrhea", "symptom", "symptoms", "cramp", "cramps"
  ],
  transmission_query: [
    "fata", "tare", "firi", "he", "ba", "mmoawa", "nsuo", "aduane", 
    "bin", "defi", "efi", "nfifiseɛ", "nfifise", "nkuku", "spread", "transmission", "catch", "cause", "contract"
  ],
  prevention_query: [
    "ban", "bɔ", "hohoro", "nsa", "samina", "pure", "pure water", "purewater", 
    "sachet", "nua", "boil", "kata", "siesie", "mpɔtam", "prevent", "prevention", "wash", "soap", "clean", "hygiene", "protect"
  ],
  treatment_query: [
    "sa", "ano aduru", "aduru", "ors", "asikre", "nkyene", "lita", 
    "fra", "teaspoon", "teaspoons", "fie", "treat", "treatment", "cure", "sugar", "salt", "recipe", "rehydration", "medicine"
  ],
  emergency_query: [
    "emergency", "mmerɛ kɛse", "apɔn", "rente", "nte nsɛm", "basabasa", 
    "mmetegwee", "ntɛm", "ntɛm ara", "mprepren", "ayaresabea", "clinic", "hospital", 
    "doctor", "dɔkota", "ntin", "iv", "wuo", "severe", "unresponsive", "dying", "danger", "critical"
  ],
  general_greeting: [
    "akye", "aha", "adwo", "ete sɛn", "akwaaba", "hello", "hi", "hey",
    "owura", "nua", "kyei", "morning", "afternoon", "evening", "welcome", "greet", "help"
  ]
};

export function classifyQueryLocally(text: string): LocalResponse {
  const cleaned = text.toLowerCase().trim();

  let maxScore = 0;
  let classifiedIntent = "fallback";

  for (const [intent, list] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const kw of list) {
      if (cleaned.includes(kw)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      classifiedIntent = intent;
    }
  }

  const confidence = maxScore > 0 ? Math.min(0.65 + (maxScore * 0.1), 0.95) : 0.45;
  const match = RESPONSES_DB[classifiedIntent] || RESPONSES_DB["fallback"];

  return {
    response: match.response,
    english: match.english,
    intent: classifiedIntent,
    confidence,
  };
}
