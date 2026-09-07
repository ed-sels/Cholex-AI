import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

type BundledTtsAsset = {
  module: number;
  relativePath: string;
};

// Keep this registry static so Metro bundles every model file into the app.
// Add converted Sherpa-ONNX assets here before shipping the corresponding voice.
const bundledTtsAssets: BundledTtsAsset[] = [];

export async function bootstrapTtsModels(): Promise<void> {
  if (!FileSystem.documentDirectory || bundledTtsAssets.length === 0) return;

  await Promise.all(
    bundledTtsAssets.map(async ({ module, relativePath }) => {
      const destination = `${FileSystem.documentDirectory}models/tts/${relativePath}`;
      const directory = destination.slice(0, destination.lastIndexOf('/'));
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

      const asset = await FileSystem.getInfoAsync(destination);
      if (!asset.exists) {
        const bundledAsset = Asset.fromModule(module);
        await bundledAsset.downloadAsync();
        if (!bundledAsset.localUri) {
          throw new Error(`Unable to resolve bundled TTS asset: ${relativePath}`);
        }
        await FileSystem.copyAsync({ from: bundledAsset.localUri, to: destination });
      }
    }),
  );
}