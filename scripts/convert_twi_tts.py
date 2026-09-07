#!/usr/bin/env python3
"""Convert the Open Bible Asante Twi Coqui VITS model for Sherpa-ONNX.

This produces the files consumed by apps/mobile. It requires Python 3.10-3.12,
PyTorch, Coqui TTS, ONNX, and onnxruntime. The generated model is not Khaya's
proprietary speaker; it is the closest redistributable offline Twi model used
by this app.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

REPO_ID = "multilingual-tts/VITS-OpenBible-Twi-Asante"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps/mobile/assets/models/tts/tw"
WORK = ROOT / ".cache/twi-tts"


def run(command: list[str]) -> None:
    print("+", " ".join(command))
    subprocess.run(command, check=True)


def download_inputs() -> tuple[Path, Path, Path]:
    from huggingface_hub import hf_hub_download

    WORK.mkdir(parents=True, exist_ok=True)
    paths = tuple(
        Path(hf_hub_download(REPO_ID, name, local_dir=WORK))
        for name in ("model_last.pth", "config.json", "speakers.pth")
    )
    return paths  # type: ignore[return-value]


def write_generated_registry() -> None:
    target = ROOT / "apps/mobile/utils/bundledTtsAssets.ts"
    target.write_text(
                """export type BundledTtsAsset = { module: number; relativePath: string };

export const bundledTtsAssets: BundledTtsAsset[] = [
    { module: require('../assets/models/tts/tw/model.onnx'), relativePath: 'tw/model.onnx' },
    { module: require('../assets/models/tts/tw/tokens.txt'), relativePath: 'tw/tokens.txt' },
    { module: require('../assets/models/tts/tw/lexicon.txt'), relativePath: 'tw/lexicon.txt' },
];
""",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path)
    parser.add_argument("--config", type=Path)
    parser.add_argument("--speakers", type=Path)
    args = parser.parse_args()

    try:
        import torch  # noqa: F401
        import TTS  # noqa: F401
        import onnx  # noqa: F401
    except ImportError as error:
        raise SystemExit(
            "Install conversion dependencies with Python 3.10-3.12: "
            "python -m pip install torch TTS onnx onnxruntime huggingface_hub"
        ) from error

    checkpoint, config, speakers = (
        args.checkpoint, args.config, args.speakers
    ) if args.checkpoint and args.config and args.speakers else download_inputs()

    exporter = Path(__file__).with_name("export_coqui_vits.py")
    if not exporter.exists():
        raise SystemExit(f"Missing exporter: {exporter}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    run([sys.executable, str(exporter), str(config), str(checkpoint), str(speakers), str(OUTPUT)])

    (OUTPUT / "lexicon.txt").touch()
    manifest = {}
    for file in sorted(OUTPUT.iterdir()):
        if file.is_file() and file.name != "SHA256SUMS.json":
            manifest[file.name] = hashlib.sha256(file.read_bytes()).hexdigest()
    (OUTPUT / "SHA256SUMS.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    write_generated_registry()
    print(f"Generated offline Twi assets in {OUTPUT}")


if __name__ == "__main__":
    main()