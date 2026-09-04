import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

type BundledTtsAsset = {
  module: number;
  relativePath: string;
};

const TTS_ROOT = `${FileSystem.documentDirectory}models/tts/`;

// Add model files here once the converted Sherpa-ONNX assets are committed.
// Keep the Twi model attribution in assets/models/tts/README.md.
const BUNDLED_TTS_ASSETS: BundledTtsAsset[] = [];

async function copyBundledAsset(asset: BundledTtsAsset): Promise<void> {
  const destination = `${TTS_ROOT}${asset.relativePath}`;
  const destinationDirectory = destination.slice(0, destination.lastIndexOf('/'));
  await FileSystem.makeDirectoryAsync(destinationDirectory, { intermediates: true });

  const existing = await FileSystem.getInfoAsync(destination);
  if (existing.exists) return;

  const bundledAsset = Asset.fromModule(asset.module);
  await bundledAsset.downloadAsync();
  if (!bundledAsset.localUri) {
    throw new Error(`Bundled TTS asset could not be resolved: ${asset.relativePath}`);
  }

  await FileSystem.copyAsync({
    from: bundledAsset.localUri,
    to: destination,
  });
}

export async function bootstrapTtsModels(): Promise<void> {
  for (const asset of BUNDLED_TTS_ASSETS) {
    try {
      await copyBundledAsset(asset);
    } catch (error) {
      console.warn(`TTS asset bootstrap failed for ${asset.relativePath}`, error);
    }
  }
}