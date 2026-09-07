# Offline TTS model assets

The React Native app expects Sherpa-ONNX model files in these directories at runtime:

- `documentDirectory/models/tts/en/`: an English Kokoro model (`model.onnx`, `tokens.txt`, `voices.bin`, and `espeak-ng-data/`)
- `documentDirectory/models/tts/tw/`: an Asante Twi VITS model (`model.onnx`, `tokens.txt`, and `lexicon.txt` when required)

The Twi model is generated from `multilingual-tts/VITS-OpenBible-Twi-Asante` on Hugging Face by running:

```bash
python3 -m pip install -r scripts/tts-conversion-requirements.txt
python3 scripts/convert_twi_tts.py
# or from apps/mobile:
npm run prepare:twi-tts
```

The source model is licensed CC-BY-SA-4.0. It is an offline Asante Twi VITS voice trained on Open Bible speech; it is not a copy of Khaya's proprietary speaker. The converted files are intentionally kept out of source control because `model.onnx` is large. The conversion script writes them into this directory and verifies their checksums before the app bundles them.

The files are already registered in `utils/bootstrapTts.ts` with static `require()` references:

```ts
{ module: require('../assets/models/tts/en/model.onnx'), relativePath: 'en/model.onnx' }
```

The bootstrap copies these bundled files into the app's document directory on first launch,
so `speakOfflineSpeech` can initialize Twi TTS without a network request.

Do not register the original Twi `model_last.pth` checkpoint directly. It is a Coqui TTS checkpoint and must be converted to Sherpa-ONNX VITS format first. Keep the CC-BY-SA-4.0 attribution for `multilingual-tts/VITS-OpenBible-Twi-Asante` with the shipped model.

The mobile app uses the local model first. If a model directory is missing or cannot initialize, it immediately falls back to the device voice and does not call the server TTS endpoint.

## Native build requirement

`@siteed/sherpa-onnx.rn` is a native module. Expo Go cannot load it. Build a custom development client or production binary after installing dependencies:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

Do not rely on a runtime model download if the shipped app must work on first launch without internet access.
