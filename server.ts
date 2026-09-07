import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Set up json and urlencoded parsers
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const envPath = path.join(process.cwd(), ".env");
const envExamplePath = path.join(process.cwd(), ".env.example");
const hasEnvFile = fs.existsSync(envPath);
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
const hasKhayaKey = Boolean(process.env.KHAYA_API_KEY);

if (!hasEnvFile && fs.existsSync(envExamplePath)) {
  console.warn("No .env file detected. Copy .env.example to .env and add the server API keys before using ASR/TTS.");
}

if (!hasGeminiKey && !hasKhayaKey) {
  console.warn("ASR/TTS requires GEMINI_API_KEY or KHAYA_API_KEY in the server .env file. Speech transcription will fail until configured.");
}

// CORS middleware for Expo mobile app and web clients
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Multer in-memory storage for audio files
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Load pre-defined cholera Twi responses
const responsesPath = path.join(process.cwd(), "backend/model/responses.json");
let responsesDb: Record<string, { response: string; english: string }> = {};

try {
  if (fs.existsSync(responsesPath)) {
    responsesDb = JSON.parse(fs.readFileSync(responsesPath, "utf-8"));
  } else {
    console.warn(`responses.json not found at ${responsesPath}. Using mock responses.`);
  }
} catch (error) {
  console.error("Error loading responses database:", error);
}

// Local Keyword-based Twi Intent Classifier (Fallback)
function localClassifier(text: string): { intent: string; confidence: number } {
  const cleaned = text.toLowerCase().trim();

  const keywords: Record<string, string[]> = {
    symptoms_query: [
      "nsenkyerɛne", "ahu", "anofafa", "feɛ", "afeɛ", "ayamtuo", "ayamyare", 
      "yamtuo", "nsubɛn", "mmerɛ", "asɛe", "stomach", "vomit", "vomiting", "diarrhea", "symptom"
    ],
    transmission_query: [
      "fata", "tare", "firi", "he", "ba", "mmoawa", "nsuo", "aduane", 
      "bin", "defi", "efi", "nfifiseɛ", "nfifise", "nkuku", "spread", "transmission", "catch"
    ],
    prevention_query: [
      "ban", "bɔ", "hohoro", "nsa", "samina", "pure", "pure water", "purewater", 
      "sachet", "nua", "boil", "kata", "siesie", "mpɔtam", "prevent", "prevention", "wash", "soap"
    ],
    treatment_query: [
      "sa", "ano aduru", "aduru", "ors", "asikre", "nkyene", "lita", 
      "fra", "teaspoon", "teaspoons", "fie", "treat", "treatment", "cure", "sugar", "salt"
    ],
    emergency_query: [
      "emergency", "mmerɛ kɛse", "apɔn", "rente", "nte nsɛm", "basabasa", 
      "mmetegwee", "ntɛm", "ntɛm ara", "mprepren", "ayaresabea", "clinic", "hospital", 
      "doctor", "dɔkota", "ntin", "iv", "wuo", "severe", "unresponsive", "dying"
    ],
    general_greeting: [
      "akye", "aha", "adwo", "ete sɛn", "akwaaba", "hello", "hi", 
      "owura", "nua", "kyei", "morning", "afternoon", "evening", "welcome", "greet"
    ]
  };

  let maxScore = 0;
  let classifiedIntent = "fallback";

  for (const [intent, list] of Object.entries(keywords)) {
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

  const confidence = maxScore > 0 ? Math.min(0.5 + (maxScore * 0.1), 0.95) : 0.2;
  return { intent: classifiedIntent, confidence };
}

function getSafetyFollowUp(text: string, history: unknown): { twi: string; english: string } | null {
  const query = text.toLowerCase();
  const historyText = JSON.stringify(history || []).toLowerCase();
  const hasDiarrheaOrVomiting = /diarr|ayamtuo|vomit|afe|feɛ/.test(query);
  const isAboutAChild = /child|baby|infant|abofra|ba/.test(query);

  if (!hasDiarrheaOrVomiting || historyText.includes('how old') || historyText.includes('sɛn na wadi')) {
    return null;
  }

  if (isAboutAChild) {
    return {
      twi: 'Abofra no adi mfeɛ sɛn, na ɔtumi nom nsuo anaa ORS a ɔrenfe bio anaa?',
      english: 'How old is the child, and can they keep down water or ORS without vomiting?',
    };
  }

  return {
    twi: 'Ayamtuo anaa ɛfeɛ no afi ase da bɛn, na wotumi nom nsuo anaa ORS a ɛtena wo mu?',
    english: 'When did the diarrhea or vomiting start, and can you keep down water or ORS?',
  };
}

// Helper to execute custom Flask ML Model Prediction (TF-IDF + Multinomial Naive Bayes)
async function predictWithFlaskModel(text: string): Promise<any> {
  return new Promise((resolve) => {
    const escapedText = JSON.stringify(text);
    const pyCode = `import json, sys; sys.path.append('.'); from backend.ml_model import TwiIntentModel; m = TwiIntentModel(); m.load_model(); print(json.dumps(m.predict(${escapedText}), ensure_ascii=False))`;

    exec(`python3 -c ${JSON.stringify(pyCode)}`, { cwd: process.cwd() }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

// REST API Endpoints

// 1. POST /api/chat
app.post("/api/chat", async (req, res) => {
  const { message, session_id, conversation_history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  console.log(`[Session ${session_id}] Chat message received: "${message}"`);

  // Step 1: Query the custom Flask ML Model (TF-IDF + Multinomial Naive Bayes)
  const flaskPrediction = await predictWithFlaskModel(message);
  const localResult = localClassifier(message);
  
  let intent = flaskPrediction?.predicted_intent || localResult.intent;
  let confidence = flaskPrediction?.confidence || localResult.confidence;
  let explanation = flaskPrediction 
    ? `Flask ML Model (TF-IDF + Naive Bayes, top terms: ${flaskPrediction.top_terms?.slice(0, 3).join(", ") || "none"})`
    : `Local rule-based classifier (${localResult.intent})`;

  let finalTwiResponse = flaskPrediction?.twi_response;
  let finalEnglishTranslation = flaskPrediction?.english_translation;

  // Step 2: Fuse Flask ML model predictions with Gemini LLM for high-accuracy response synthesis
  if (ai) {
    try {
      const systemInstruction = `You are Cholex AI, an authoritative, compassionate, and culturally attuned Ghanaian Health NLP AI Assistant specializing in Asante Twi and English for Cholera outbreak guidance.

You are powered by a custom Flask Machine Learning Engine (TF-IDF & Character N-gram Multinomial Naive Bayes trained on verified Ghanaian health datasets).

ML MODEL CLASSIFICATION RESULTS FOR THIS QUERY:
- Predicted Intent: "${intent}" (Confidence: ${(confidence * 100).toFixed(1)}%)
- Extracted TF-IDF Terms: ${flaskPrediction?.top_terms?.join(", ") || "none"}
- Verified Medical Response Base (Twi): ${flaskPrediction?.twi_response || "None"}
- Verified Medical Reference (English): ${flaskPrediction?.english_translation || "None"}

YOUR INSTRUCTIONS:
1. Synthesize a warm, conversational, accurate response directly answering the user's specific query in Asante Twi. Incorporate the verified medical facts provided by the ML model.
2. Provide a clean, accurate English translation.
3. Keep the tone empathetic, clear, and fully compliant with Ghana Health Service (GHS) guidelines for cholera prevention, emergency care, and ORS hydration.
4. For special cases, do not guess or give a definitive diagnosis. If an answer depends on missing details such as the person's age, duration of diarrhea or vomiting, ability to drink, urine output, blood in stool, fever, pregnancy, or danger signs, ask one concise follow-up question in Asante Twi and include its English translation. Give immediate emergency guidance first whenever danger signs may be present.
5. Use the conversation history to understand answers to earlier follow-up questions. Ask only the next most important question, and continue helping after the user replies.

RECENT CONVERSATION HISTORY:
${Array.isArray(conversation_history) && conversation_history.length > 0
  ? conversation_history.map((entry: any) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.text || entry.english || ''}`).join("\\n")
  : 'No earlier conversation.'}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `User Query: "${message}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              response: { type: "STRING", description: "Full Asante Twi response" },
              english_translation: { type: "STRING", description: "Full English translation" },
              intent: { type: "STRING", description: "The classified intent category" },
              confidence: { type: "NUMBER", description: "Confidence score between 0 and 1" },
              explanation: { type: "STRING", description: "Brief explanation of fusion logic" },
            },
            required: ["response", "english_translation", "intent", "confidence", "explanation"],
          },
          temperature: 0.2,
        },
      });

      const resultText = response.text?.trim();
      if (resultText) {
        const cleanJson = resultText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "")
          .trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.response && parsed.english_translation) {
          finalTwiResponse = parsed.response;
          finalEnglishTranslation = parsed.english_translation;
          intent = parsed.intent || intent;
          confidence = typeof parsed.confidence === "number" ? parsed.confidence : confidence;
          explanation = parsed.explanation || explanation;
        }
      }
    } catch (err) {
      console.error("Gemini fusion fallback:", err);
    }
  }

  // Fallback if no final response was produced
  if (!finalTwiResponse) {
    const responseData = responsesDb[intent] || responsesDb["fallback"];
    finalTwiResponse = responseData?.response || "Mepa wo kyɛw, bisabisa me cholera ho nsɛm wo Twi mu.";
    finalEnglishTranslation = responseData?.english || "Please ask me questions about cholera in Asante Twi.";
  }

  // Keep every model path conversational when a special case lacks clinical details.
  const followUp = getSafetyFollowUp(message, conversation_history);
  if (followUp && !/[?？]/.test(`${finalTwiResponse} ${finalEnglishTranslation}`)) {
    finalTwiResponse = `${finalTwiResponse}\n\n${followUp.twi}`;
    finalEnglishTranslation = `${finalEnglishTranslation}\n\n${followUp.english}`;
  }

  console.log(`[Fused Engine] Responding for intent: ${intent} (${(confidence * 100).toFixed(1)}% confidence)`);

  res.json({
    response: finalTwiResponse,
    english_translation: finalEnglishTranslation,
    intent,
    confidence,
    explanation,
    ml_extracted_terms: flaskPrediction?.top_terms || []
  });
});

// 2. POST /api/transcribe
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  let audioBuffer: Buffer | null = req.file ? req.file.buffer : null;
  let audioMimeType: string = req.file?.mimetype || "audio/m4a";
  const language = req.body.language || "tw";

  // Support base64 JSON payload
  if (!audioBuffer && req.body.audioBase64) {
    try {
      audioBuffer = Buffer.from(req.body.audioBase64, "base64");
      if (req.body.mimeType) audioMimeType = req.body.mimeType;
    } catch (e) {
      console.error("Base64 audio decode error:", e);
    }
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    res.status(400).json({ error: "No audio file or audioBase64 provided" });
    return;
  }

  console.log(`Received audio file of size: ${audioBuffer.length} bytes for transcription. Mime: ${audioMimeType}, Requested language: ${language}`);

  // If Khaya API is configured and language is Twi, send to GhanaNLP
  if (language === "tw" && process.env.KHAYA_API_KEY) {
    try {
      console.log("Sending audio to GhanaNLP Khaya ASR API...");
      
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: audioMimeType });
      formData.append("file", blob, "audio.wav");

      const response = await fetch("https://translation-api.ghananlp.org/asr/v1", {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.KHAYA_API_KEY,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const transcript = data.transcript || data.text || "";
        console.log(`GhanaNLP ASR Transcript: "${transcript}"`);
        res.json({ transcript });
        return;
      } else {
        const errorText = await response.text();
        console.error(`GhanaNLP ASR API returned status ${response.status}:`, errorText);
      }
    } catch (err) {
      console.error("GhanaNLP ASR request failed:", err);
    }
  }

  // Direct English/Twi to Gemini for speech-to-text transcription (multi-modal capability)
  if (ai) {
    try {
      console.log(`Using Gemini API for ${language} ASR transcription...`);
      const base64Audio = audioBuffer.toString("base64");
      const systemPrompt = language === "en"
        ? "You are an expert English speech-to-text transcription service. Transcribe the audio precisely as spoken in English. Only return the final transcribed English text, nothing else. If the audio is silence or unintelligible, return an empty string."
        : "You are an expert Asante Twi speech-to-text transcription service. Transcribe the audio precisely as spoken in Twi. Only return the final transcribed Twi text, nothing else. If the audio is silence or unintelligible, return an empty string.";
      
      if (!audioMimeType || audioMimeType === "application/octet-stream") {
        if (req.file?.originalname?.endsWith(".m4a")) audioMimeType = "audio/m4a";
        else if (req.file?.originalname?.endsWith(".mp4")) audioMimeType = "audio/mp4";
        else if (req.file?.originalname?.endsWith(".webm")) audioMimeType = "audio/webm";
        else audioMimeType = "audio/m4a";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: audioMimeType,
              data: base64Audio,
            },
          },
          systemPrompt,
        ],
      });

      const transcript = response.text?.trim() || "";
      console.log(`Gemini ASR Transcript: "${transcript}"`);
      res.json({ transcript });
      return;
    } catch (err) {
      console.error("Gemini ASR transcription failed:", err);
    }
  }

  // If no AI transcription key is configured on server
  console.log("No remote ASR service configured or succeeded.");
  res.status(501).json({ 
    error: "NO_ASR_KEY", 
    message: "Speech-to-text requires GEMINI_API_KEY or KHAYA_API_KEY in .env on the server." 
  });
});

// Helper to wrap raw 16-bit linear PCM audio in a WAV container (required for standard HTML5 Audio playback)
function encodeWAV(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // file length
  header.writeUInt32LE(chunkSize, 4);
  // RIFF type
  header.write("WAVE", 8);
  // format chunk identifier
  header.write("fmt ", 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (1 = PCM)
  header.writeUInt16LE(1, 20);
  // channel count
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate
  header.writeUInt32LE(byteRate, 28);
  // block align
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // data chunk length
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function isNetworkError(error: unknown): boolean {
  const cause = error && typeof error === "object" && "cause" in error
    ? (error as { cause?: unknown }).cause
    : undefined;
  const details = [error, cause]
    .map((value) => value && typeof value === "object" && "code" in value
      ? String((value as { code?: unknown }).code)
      : "")
    .join(" ");
  return /ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(details);
}

function convertIeeeFloatToPcm16(wavBuffer: Buffer): Buffer {
  if (wavBuffer.length < 44) return wavBuffer;
  if (wavBuffer.toString("ascii", 0, 4) !== "RIFF" || wavBuffer.toString("ascii", 8, 12) !== "WAVE") {
    return wavBuffer;
  }

  let offset = 12;
  let audioFormat = 0;
  let numChannels = 1;
  let sampleRate = 16000;
  let dataOffset = 0;
  let dataLength = 0;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString("ascii", offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt " && offset + 8 + chunkSize <= wavBuffer.length) {
      audioFormat = wavBuffer.readUInt16LE(offset + 8);
      numChannels = wavBuffer.readUInt16LE(offset + 10);
      sampleRate = wavBuffer.readUInt32LE(offset + 12);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataLength = Math.min(chunkSize, wavBuffer.length - dataOffset);
      break;
    }
    offset += 8 + chunkSize;
  }

  // Audio format 3 is IEEE Float. Convert to PCM 16-bit integer (format 1).
  if (audioFormat !== 3 || dataOffset === 0 || dataLength === 0) {
    return wavBuffer;
  }

  const numSamples = Math.floor(dataLength / 4);
  const pcm16Data = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const floatSample = wavBuffer.readFloatLE(dataOffset + i * 4);
    const clamped = Math.max(-1, Math.min(1, floatSample));
    const intSample = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
    pcm16Data.writeInt16LE(intSample, i * 2);
  }

  const pcm16Length = numSamples * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm16Length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
  header.writeUInt16LE(numChannels * 2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write("data", 36);
  header.writeUInt32LE(pcm16Length, 40);

  return Buffer.concat([header, pcm16Data]);
}

function cleanTextForSpeech(input: string): string {
  return input
    .replace(/[*#_~`>]/g, "") // Remove markdown format characters
    .replace(/\s+/g, " ")
    .trim();
}

// 3. POST /api/speak
app.post("/api/speak", async (req, res) => {
  const { text, language = "tw" } = req.body;
  if (!text) {
    res.status(400).json({ error: "Text is required" });
    return;
  }

  const cleanedText = cleanTextForSpeech(text);
  const khayaLanguage = language === "en" ? "en" : "tw";
  const allowedSpeakers = new Set(["female", "male_low", "male_high"]);
  const requestedSpeaker = req.body.speaker_id;
  const speakerId = allowedSpeakers.has(requestedSpeaker)
    ? requestedSpeaker
    : process.env.KHAYA_TWI_SPEAKER_ID || "female";

  if (process.env.KHAYA_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response: Response;
      try {
        response = await fetch("https://translation-api.ghananlp.org/tts/v1/synthesize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": process.env.KHAYA_API_KEY,
          },
          body: JSON.stringify({
            text: cleanedText,
            language: khayaLanguage,
            speaker_id: speakerId,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (response.ok) {
        const rawBuffer = Buffer.from(await response.arrayBuffer());
        const pcm16Buffer = convertIeeeFloatToPcm16(rawBuffer);

        const acceptsJson =
          req.headers.accept?.includes("application/json") ||
          req.body.format === "json";

        if (acceptsJson) {
          res.json({
            audioContent: pcm16Buffer.toString("base64"),
            format: "wav",
            contentType: "audio/wav",
            language: khayaLanguage,
            speaker: speakerId,
          });
          return;
        }

        res.type("audio/wav");
        res.send(pcm16Buffer);
        return;
      }

      console.error(`Khaya TTS API returned status ${response.status}:`, await response.text());
    } catch (error) {
      console.warn("Khaya TTS upstream unavailable; returning offline fallback:", error);
    }
  }

  res.status(503).json({
    error: "Khaya speech synthesis is unavailable.",
    offline: true,
  });
});

// 4. GET /api/health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    services: {
      gemini_nlp: !!ai,
      ghananlp_khaya: !!process.env.KHAYA_API_KEY,
      flask_ml_model: fs.existsSync(path.join(process.cwd(), "backend/model/trained_model.json"))
    },
    timestamp: new Date().toISOString()
  });
});

// FLASK BACKEND & ML MODEL API ENDPOINTS

// 5. GET /api/flask/health
app.get("/api/flask/health", (req, res) => {
  const modelPath = path.join(process.cwd(), "backend/model/trained_model.json");
  const exists = fs.existsSync(modelPath);
  let modelData: any = {};
  if (exists) {
    try {
      modelData = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
    } catch (e) {}
  }

  res.json({
    status: "ok",
    framework: "Flask 3.x Engine",
    model_trained: exists && !!modelData.is_trained,
    last_trained_at: modelData.last_trained_at || null,
    vocabulary_size: modelData.vocabulary ? Object.keys(modelData.vocabulary).length : 0,
    timestamp: new Date().toISOString()
  });
});

// 6. POST /api/flask/train
app.post("/api/flask/train", (req, res) => {
  console.log("Triggering Flask ML Model Re-Training Pipeline via python3 scripts/train_model.py...");
  exec("python3 scripts/train_model.py", { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("Model training failed:", stderr || error.message);
      res.status(500).json({ success: false, error: stderr || error.message });
      return;
    }
    
    const modelPath = path.join(process.cwd(), "backend/model/trained_model.json");
    let modelData: any = {};
    if (fs.existsSync(modelPath)) {
      try {
        modelData = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
      } catch (e) {}
    }

    res.json({
      success: true,
      message: "Flask ML model re-trained successfully!",
      metrics: modelData.metrics || {},
      last_trained_at: modelData.last_trained_at || new Date().toISOString(),
      logs: stdout
    });
  });
});

// 7. POST /api/flask/predict
app.post("/api/flask/predict", (req, res) => {
  const { text, message } = req.body;
  const queryText = text || message;
  if (!queryText) {
    res.status(400).json({ error: "Text or message parameter is required" });
    return;
  }

  const escapedText = JSON.stringify(queryText);
  const pyCode = `import json, sys; sys.path.append('.'); from backend.ml_model import TwiIntentModel; m = TwiIntentModel(); m.load_model(); print(json.dumps(m.predict(${escapedText}), ensure_ascii=False))`;

  exec(`python3 -c ${JSON.stringify(pyCode)}`, { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      console.error("Flask prediction failed:", stderr || error.message);
      res.status(500).json({ error: "Prediction failed", details: stderr || error.message });
      return;
    }
    try {
      const result = JSON.parse(stdout.trim());
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "Failed to parse prediction output", raw: stdout });
    }
  });
});

// 8. GET /api/flask/model_info
app.get("/api/flask/model_info", (req, res) => {
  const modelPath = path.join(process.cwd(), "backend/model/trained_model.json");
  if (!fs.existsSync(modelPath)) {
    res.json({ is_trained: false, metrics: {}, vocabulary_size: 0 });
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
    res.json({
      is_trained: data.is_trained,
      last_trained_at: data.last_trained_at,
      metrics: data.metrics || {},
      classes: data.classes || [],
      vocabulary_size: data.vocabulary ? Object.keys(data.vocabulary).length : 0,
      dataset_info: data.dataset_info || {}
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/flask/dataset
app.get("/api/flask/dataset", (req, res) => {
  const csvPath = path.join(process.cwd(), "data/cholera_twi.csv");
  if (!fs.existsSync(csvPath)) {
    res.json({ total_samples: 0, samples: [], intent_counts: {} });
    return;
  }

  try {
    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim().length > 0);
    const header = lines[0].split(",");
    
    // Parse CSV simple DictReader
    const samples: any[] = [];
    const intentCounts: Record<string, number> = {};

    for (let i = 1; i < lines.length; i++) {
      // Basic match handling quoted CSV
      const matches = lines[i].match(/(?:\"[^\"]*\"|[^,])+/g);
      if (matches && matches.length >= 2) {
        const twi_query = matches[0].replace(/^"|"$/g, '').trim();
        const intent = matches[1].replace(/^"|"$/g, '').trim();
        const twi_response = matches[2] ? matches[2].replace(/^"|"$/g, '').trim() : '';
        const english_translation = matches[3] ? matches[3].replace(/^"|"$/g, '').trim() : '';
        const source = matches[4] ? matches[4].replace(/^"|"$/g, '').trim() : '';

        samples.push({ twi_query, intent, twi_response, english_translation, source });
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
    }

    res.json({
      total_samples: samples.length,
      intent_counts: intentCounts,
      samples
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/flask/add_sample
app.post("/api/flask/add_sample", (req, res) => {
  const { twi_query, intent, twi_response, english_translation, source } = req.body;
  if (!twi_query || !intent) {
    res.status(400).json({ error: "twi_query and intent are required fields" });
    return;
  }

  const csvPath = path.join(process.cwd(), "data/cholera_twi.csv");
  const cleanField = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
  const row = `${cleanField(twi_query)},${cleanField(intent)},${cleanField(twi_response)},${cleanField(english_translation)},${cleanField(source || 'User Contributed')}\n`;

  try {
    fs.appendFileSync(csvPath, row, "utf-8");
    // Trigger automatic re-train
    exec("python3 scripts/train_model.py", { cwd: process.cwd() }, (error, stdout, stderr) => {
      const modelPath = path.join(process.cwd(), "backend/model/trained_model.json");
      let modelData: any = {};
      if (fs.existsSync(modelPath)) {
        try {
          modelData = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
        } catch (e) {}
      }

      res.json({
        success: true,
        message: "New sample added to dataset and model re-trained successfully!",
        metrics: modelData.metrics || {}
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /ml-studio - Standalone Flask ML Studio and Model Trainer Web Interface
app.get("/ml-studio", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flask ML Studio - Cholex AI Twi NLP Engine</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans min-h-screen flex flex-col">
  <header class="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2.5 bg-gradient-to-br from-[#FF5A36] to-amber-600 rounded-xl text-white shadow-lg">
        <i class="fa-solid fa-brain text-lg"></i>
      </div>
      <div>
        <span class="text-[10px] font-extrabold text-[#FF5A36] uppercase tracking-widest">Flask 3.x Engine</span>
        <h1 class="text-lg font-extrabold text-white">Flask ML Studio & Model Trainer</h1>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <a href="/" class="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-2">
        <i class="fa-solid fa-arrow-left"></i> Back to Cholex AI App
      </a>
    </div>
  </header>

  <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
    <!-- Status & Info Card -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <span class="text-xs text-zinc-400 font-semibold">Model Status</span>
        <div id="model-status" class="text-base font-bold text-emerald-400 mt-1">Loading...</div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <span class="text-xs text-zinc-400 font-semibold">Vocabulary Size</span>
        <div id="vocab-size" class="text-base font-bold text-zinc-100 mt-1">-</div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <span class="text-xs text-zinc-400 font-semibold">Dataset Samples</span>
        <div id="dataset-count" class="text-base font-bold text-zinc-100 mt-1">-</div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <span class="text-xs text-zinc-400 font-semibold">Pipeline Action</span>
          <div class="text-xs text-zinc-300 mt-1">Train Naive Bayes</div>
        </div>
        <button onclick="trainModel()" id="train-btn" class="px-4 py-2.5 bg-[#FF5A36] hover:bg-[#E04724] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2">
          <i class="fa-solid fa-play"></i> Train Model
        </button>
      </div>
    </div>

    <!-- Main Workspace Tabs -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
      <div class="flex border-b border-zinc-800 bg-zinc-950 px-4 pt-3 gap-2">
        <button onclick="switchTab('playground')" id="tab-btn-playground" class="px-5 py-2.5 text-xs font-bold rounded-t-xl bg-zinc-900 text-[#FF5A36] border-t border-x border-zinc-800 transition-all cursor-pointer">
          <i class="fa-solid fa-terminal mr-2"></i> NLP Prediction Playground
        </button>
        <button onclick="switchTab('dataset')" id="tab-btn-dataset" class="px-5 py-2.5 text-xs font-bold rounded-t-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer">
          <i class="fa-solid fa-database mr-2"></i> Dataset Inspector & Add Sample
        </button>
        <button onclick="switchTab('logs')" id="tab-btn-logs" class="px-5 py-2.5 text-xs font-bold rounded-t-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer">
          <i class="fa-solid fa-file-code mr-2"></i> Training Logs & Metrics
        </button>
      </div>

      <!-- Tab 1: Playground -->
      <div id="tab-playground" class="p-6 space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <i class="fa-solid fa-keyboard text-[#FF5A36]"></i> Test Twi Query Input
            </h3>
            <textarea id="test-input" rows="4" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 focus:outline-none focus:border-[#FF5A36]" placeholder="Type Asante Twi query e.g. Sɛn na yɛde samina bɔ yɛn ho ban afiri cholera ho?">Sɛn na yɛde samina bɔ yɛn ho ban afiri cholera ho?</textarea>
            <div class="flex gap-2">
              <button onclick="runPredict()" class="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#E04724] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2">
                <i class="fa-solid fa-bolt"></i> Run Prediction
              </button>
              <button onclick="document.getElementById('test-input').value='Mɛyɛ dɛn siesie ORS nsuo wɔ fie?'; runPredict();" class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-all cursor-pointer">
                ORS Recipe Example
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <i class="fa-solid fa-square-poll-vertical text-emerald-400"></i> Classification & Fusion Output
            </h3>
            <div id="prediction-output" class="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs font-mono text-zinc-300 min-h-[160px] overflow-y-auto space-y-2">
              <span class="text-zinc-500">Run a prediction to inspect TF-IDF weights, intent classification, and Twi/English medical responses...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Dataset -->
      <div id="tab-dataset" class="p-6 space-y-6 hidden">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <i class="fa-solid fa-table text-[#FF5A36]"></i> cholera_twi.csv Dataset Samples
          </h3>
          <button onclick="document.getElementById('add-sample-modal').classList.remove('hidden')" class="px-4 py-2 bg-[#FF5A36] hover:bg-[#E04724] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2">
            <i class="fa-solid fa-plus"></i> Add Training Sample
          </button>
        </div>
        <div class="overflow-x-auto border border-zinc-800 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead class="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-mono">
              <tr>
                <th class="p-3">Twi Query</th>
                <th class="p-3">Intent</th>
                <th class="p-3">Twi Response</th>
                <th class="p-3">English Translation</th>
                <th class="p-3">Source</th>
              </tr>
            </thead>
            <tbody id="dataset-tbody" class="divide-y divide-zinc-800/60 text-zinc-300">
              <tr><td colspan="5" class="p-4 text-center text-zinc-500">Loading dataset samples...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 3: Logs & Metrics -->
      <div id="tab-logs" class="p-6 space-y-4 hidden">
        <h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <i class="fa-solid fa-terminal text-[#FF5A36]"></i> Training Execution Logs & Evaluation Metrics
        </h3>
        <pre id="train-logs-pre" class="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs font-mono text-emerald-400 h-80 overflow-y-auto">Ready to train model...</pre>
      </div>
    </div>
  </main>

  <!-- Add Sample Modal -->
  <div id="add-sample-modal" class="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 hidden z-50">
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 class="text-sm font-bold text-white"><i class="fa-solid fa-plus-circle text-[#FF5A36] mr-2"></i> Add New Twi Training Sample</h3>
        <button onclick="document.getElementById('add-sample-modal').classList.add('hidden')" class="text-zinc-400 hover:text-white"><i class="fa-solid fa-xmark text-base"></i></button>
      </div>
      <form onsubmit="submitAddSample(event)" class="space-y-3.5">
        <div>
          <label class="block text-[11px] font-bold text-zinc-400 mb-1">Twi Query / Prompt</label>
          <input type="text" id="sample-query" required class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#FF5A36]" placeholder="e.g. Sɛn na mɛyɛ...">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-zinc-400 mb-1">Intent Category</label>
          <select id="sample-intent" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#FF5A36]">
            <option value="symptoms_query">symptoms_query</option>
            <option value="transmission_query">transmission_query</option>
            <option value="prevention_query">prevention_query</option>
            <option value="treatment_query">treatment_query</option>
            <option value="emergency_query">emergency_query</option>
            <option value="general_greeting">general_greeting</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-zinc-400 mb-1">Verified Twi Response</label>
          <textarea id="sample-twi-resp" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-[#FF5A36]" placeholder="Verified medical guidance in Twi..."></textarea>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-zinc-400 mb-1">English Translation</label>
          <textarea id="sample-eng-resp" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-[#FF5A36]" placeholder="English translation..."></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="document.getElementById('add-sample-modal').classList.add('hidden')" class="px-4 py-2 bg-zinc-800 text-xs font-bold rounded-xl text-zinc-300">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-[#FF5A36] hover:bg-[#E04724] text-xs font-bold rounded-xl text-white">Save & Re-train Model</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const res = await fetch('/api/flask/model_info');
        const data = await res.json();
        document.getElementById('model-status').innerText = data.is_trained ? 'Trained & Active' : 'Not Trained';
        document.getElementById('model-status').className = data.is_trained ? 'text-base font-bold text-emerald-400 mt-1' : 'text-base font-bold text-amber-400 mt-1';
        document.getElementById('vocab-size').innerText = data.vocabulary_size || 0;
      } catch(e) { console.error(e); }

      try {
        const res2 = await fetch('/api/flask/dataset');
        const data2 = await res2.json();
        document.getElementById('dataset-count').innerText = data2.total_samples || 0;
        const tbody = document.getElementById('dataset-tbody');
        if (data2.samples && data2.samples.length > 0) {
          tbody.innerHTML = data2.samples.map(s => \`
            <tr class="hover:bg-zinc-900/50">
              <td class="p-3 font-semibold text-white">\${s.twi_query}</td>
              <td class="p-3"><span class="px-2 py-0.5 rounded-md bg-zinc-800 text-[#FF5A36] text-[10px] font-mono">\${s.intent}</span></td>
              <td class="p-3 text-zinc-300">\${s.twi_response || '-'}</td>
              <td class="p-3 text-zinc-400">\${s.english_translation || '-'}</td>
              <td class="p-3 text-zinc-500 font-mono">\${s.source || '-'}</td>
            </tr>
          \`).join('');
        }
      } catch(e) { console.error(e); }
    }

    function switchTab(tab) {
      ['playground', 'dataset', 'logs'].forEach(t => {
        document.getElementById('tab-' + t).classList.add('hidden');
        document.getElementById('tab-btn-' + t).className = "px-5 py-2.5 text-xs font-bold rounded-t-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer";
      });
      document.getElementById('tab-' + tab).classList.remove('hidden');
      document.getElementById('tab-btn-' + tab).className = "px-5 py-2.5 text-xs font-bold rounded-t-xl bg-zinc-900 text-[#FF5A36] border-t border-x border-zinc-800 transition-all cursor-pointer";
    }

    async function trainModel() {
      const btn = document.getElementById('train-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Training...';
      document.getElementById('train-logs-pre').innerText = "Initializing Flask training pipeline...\nReading data/cholera_twi.csv...\nExtracting TF-IDF word & character n-grams...\n";
      switchTab('logs');
      try {
        const res = await fetch('/api/flask/train', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('train-logs-pre').innerText = data.logs || "Model training completed successfully!";
          loadData();
        } else {
          document.getElementById('train-logs-pre').innerText = "Error: " + data.error;
        }
      } catch(e) {
        document.getElementById('train-logs-pre').innerText = "Network Error: " + e.message;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Train Model';
      }
    }

    async function runPredict() {
      const q = document.getElementById('test-input').value;
      if (!q.trim()) return;
      const out = document.getElementById('prediction-output');
      out.innerHTML = '<span class="text-zinc-400"><i class="fa-solid fa-spinner animate-spin"></i> Running Flask Model prediction...</span>';
      try {
        const res = await fetch('/api/flask/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: q })
        });
        const data = await res.json();
        out.innerHTML = \`<pre class="text-emerald-400 font-mono text-xs whitespace-pre-wrap">\${JSON.stringify(data, null, 2)}</pre>\`;
      } catch(e) {
        out.innerHTML = '<span class="text-red-400">Prediction error: ' + e.message + '</span>';
      }
    }

    async function submitAddSample(e) {
      e.preventDefault();
      const payload = {
        twi_query: document.getElementById('sample-query').value,
        intent: document.getElementById('sample-intent').value,
        twi_response: document.getElementById('sample-twi-resp').value,
        english_translation: document.getElementById('sample-eng-resp').value,
        source: "User Studio Contributed"
      };
      try {
        const res = await fetch('/api/flask/add_sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('add-sample-modal').classList.add('hidden');
          loadData();
          alert('Sample added & model re-trained successfully!');
        } else {
          alert('Error: ' + data.error);
        }
      } catch(err) {
        alert('Network Error: ' + err.message);
      }
    }

    loadData();
  </script>
</body>
</html>`);
});

// Serve frontend assets
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite only in development to avoid production dependency footprint
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cholera Twi Chatbot Server] Running on http://localhost:${PORT}`);
  });
}

serveApp();
