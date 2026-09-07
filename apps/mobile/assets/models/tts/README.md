# Offline TTS model assets

The React Native app expects Sherpa-ONNX model files in these directories at runtime:

- `documentDirectory/models/tts/en/`: an English Kokoro model (`model.onnx`, `tokens.txt`, `voices.bin`, and `espeak-ng-data/`)
- `documentDirectory/models/tts/tw/`: an Asante Twi VITS model (`model.onnx`, `tokens.txt`, and `lexicon.txt` when required)

These files are intentionally not committed here because the model weights are large. They must be converted to Sherpa-ONNX format and bundled or copied into the app's document directory during the native build/install step. The Twi source checkpoint currently identified for conversion is `multilingual-tts/VITS-OpenBible-Twi-Asante` on Hugging Face; review its CC-BY-SA-4.0 license and quality before distribution.

After adding the converted files, register each file in `utils/bootstrapTts.ts` with a static `require()` module reference, for example:

```ts
{ module: require('../assets/models/tts/en/model.onnx'), relativePath: 'en/model.onnx' }
```

Register every file needed by the Twi model, including `model.onnx`, `tokens.txt`, and
`lexicon.txt`. The bootstrap copies these bundled files into the app's document directory
on first launch, so `speakOfflineSpeech` can initialize Twi TTS without a network request.

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
