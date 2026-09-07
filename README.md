# Asante Twi Cholera Health AI Chatbot

A production-ready full-stack AI web application that provides verified, medically accurate cholera health information in **Asante Twi** (and English translations) for Twi-speaking users in Ghana. 

The system leverages state-of-the-art Natural Language Processing (NLP) to classify user intents, combined with advanced speech APIs for speech-to-text input and text-to-speech voice playback in natural Twi.

---

## Key Features

1. **Intelligent Twi Intent Classification:**
   - Multi-stage hybrid NLP classifier: utilizes a custom, keyword-overlap local state-machine combined with **Gemini AI** (`gemini-3.5-flash`) semantic interpretation.
   - Categorizes user inputs into 6 cholera-specific intents:
     - `symptoms_query` - symptoms (watery diarrhea, vomiting, dehydration).
     - `transmission_query` - how cholera spreads (contaminated water, food).
     - `prevention_query` - preventive measures (handwashing, boiling water, sanitation).
     - `treatment_query` - treatment & home-made Oral Rehydration Salts (ORS) preparation.
     - `emergency_query` - extreme dehydration, unresponsive patients, emergency hospital guidance.
     - `general_greeting` - friendly salutations ("ete sɛn", "akwaaba").

2. **Verified, Hallucination-Free Medical Responses:**
   - Classifications map securely to standard, medically-approved Twi health guidelines (translated from WHO, CDC, and Ghana Health Service).
   - This ensures the chatbot **never hallucinates** medical advice; it always delivers precise, pre-verified solutions.

3. **ASR (Speech-to-Text) Audio Recording:**
   - An elegant microphone recorder captures spoken Twi audio directly in the browser and transcribes it on the backend.
   - Implements **GhanaNLP Khaya ASR API** with a seamless multi-modal **Gemini API** fallback for high-quality audio transcriptions when keys are not configured.

4. **TTS (Text-to-Speech) Audio Playback:**
   - Listen to cholera safety responses natively spoken in Twi.
   - Integrates **GhanaNLP Khaya TTS API** backed by **Gemini TTS Preview** (`gemini-3.1-flash-tts-preview`) to generate high-fidelity vocal read-outs.

5. **Polish & Usability:**
   - Dual-language translation cards showing Asante Twi alongside English translation.
   - Desktop and Mobile responsive web interface built on Tailwind CSS.
   - Dismissible, high-visibility medical disclaimer banners.
   - Quick Suggestion buttons for fast, single-click navigation.

---

## Project Architecture

```
/
├── backend/
│   └── model/
│       └── responses.json  # Predefined Asante Twi health responses & translations
├── data/
│   └── cholera_twi.csv     # Pre-loaded seed dataset with 36 high-quality query rows
├── scripts/
│   └── build_dataset.py    # Preprocessing, cleaning, and train/val/test split pipeline
├── src/
│   ├── components/
│   │   ├── AudioRecorder.tsx # Web microphone recorder + transcriber hook
│   │   ├── ChatWindow.tsx    # Scrollable chat logs & suggested quick actions
│   │   ├── Disclaimer.tsx    # Warns users that chatbot is info-only
│   │   └── MessageBubble.tsx # Interactive message bubbles with English-toggles & TTS
│   ├── App.tsx             # Primary dashboard interface
│   ├── index.css           # Styling theme with premium typography imports
│   └── main.tsx            # React application mount
├── server.ts               # Unified, high-performance Express & Vite API gateway
├── package.json            # Node dependencies, dev/build scripts
├── Dockerfile              # Production stage container orchestration
└── docker-compose.yml      # Multi-container local execution setup
```

---

## Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [NPM](https://www.npmjs.com/) (v9 or higher)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file at the root level and configure your keys:
   ```env
   # Gemini API Key (Required for Advanced NLP & Speech fallbacks)
   GEMINI_API_KEY="your-gemini-api-key-here"

   # GhanaNLP Khaya API Key (Optional, for native Khaya speech engines)
   KHAYA_API_KEY="your-ghananlp-api-key-here"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

### Production Deployment (Docker Build)

1. Build and run the app in production using Docker Compose:
   ```bash
   docker-compose up --build
   ```
   This will bundle the client assets, compile the server, and launch the application on port `3000`.

---

## API Documentation

### 1. Chat Classification & Response
- **Endpoint:** `POST /api/chat`
- **Request Body:**
  ```json
  {
    "message": "Sɛn na cholera yareɛ yi kɔ obi ho?",
    "session_id": "optional-uuid-session"
  }
  ```
- **Response:**
  ```json
  {
    "response": "Cholera yareɛ yi fata ntɛm nam nsuo anaa aduane...",
    "english_translation": "Cholera spreads through drinking water or eating food contaminated...",
    "intent": "transmission_query",
    "confidence": 0.95,
    "explanation": "Gemini classification"
  }
  ```

### 2. Audio Transcription (Speech-to-Text)
- **Endpoint:** `POST /api/transcribe`
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data Parameters:**
  - `audio` (Binary WebM/WAV file recorded from the microphone)
- **Response:**
  ```json
  {
    "transcript": "Mɛbɔ me ho ban afiri cholera ho sɛn?"
  }
  ```

### 3. Speech Synthesis (Text-to-Speech)
- **Endpoint:** `POST /api/speak`
- **Request Body:**
  ```json
  {
    "text": "Yɛde ORS nsuo na ɛsa cholera ntɛm ara."
  }
  ```
- **Response:** Audio stream (`audio/mpeg` or `audio/wav` binary data played directly by the browser's `Audio` context).

---

## Dataset Pipeline & Training Script
The application includes a Python data science preprocessing script under `/scripts/build_dataset.py`. It is loaded with 36 curated, high-quality, and medically verified Ghanaian Asante Twi queries that are cleaned, normalized, and outputted into split sets (`train.csv`, `validation.csv`, `test.csv`) suitable for direct ingestion into HuggingFace Datasets or fine-tuning transformer models.

To execute the python pipeline:
```bash
python3 scripts/build_dataset.py
```

---

## Medical Accuracy Statement
This application is designed for educational and health information support. All Twi medical statements have been verified against guidelines published by the **World Health Organization (WHO)**, **CDC**, and **Ghana Health Service**. It is not a replacement for professional clinical advice, and users experiencing symptoms are directed to seek immediate assistance at their nearest clinic or hospital.
