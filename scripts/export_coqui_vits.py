#!/usr/bin/env python3
"""Export a Coqui VITS checkpoint using its native model implementation."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import onnx
import torch
from TTS.tts.utils.speakers import SpeakerManager
from TTS.utils.synthesizer import Synthesizer


class OnnxModel(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x, x_lengths, noise_scale, length_scale, noise_scale_w, sid):
        return self.model.infer(
            x=x,
            x_lengths=x_lengths,
            sid=sid,
            noise_scale=noise_scale,
            length_scale=length_scale,
            noise_scale_w=noise_scale_w,
        )[0]


def main() -> None:
    config_path, checkpoint, speakers_path, output = map(Path, sys.argv[1:])
    synthesizer = Synthesizer(
        tts_checkpoint=str(checkpoint),
        tts_config_path=str(config_path),
        tts_speakers_file=str(speakers_path),
        use_cuda=False,
    )
    if synthesizer.tts_model.speaker_manager is None:
        synthesizer.tts_model.speaker_manager = SpeakerManager(
            speaker_id_file_path=str(speakers_path)
        )

    model = synthesizer.tts_model
    model.eval()
    symbols = model.args.characters.characters + model.args.characters.punctuations
    token_ids = [max(1, symbols.index(char)) for char in "Mema wo akwaaba!"]
    if model.args.add_blank:
        expanded = []
        for token in token_ids:
            expanded.extend((0, token))
        token_ids = expanded

    x = torch.tensor([token_ids], dtype=torch.long)
    x_lengths = torch.tensor([len(token_ids)], dtype=torch.long)
    wrapper = OnnxModel(model)
    output_path = output / "model.onnx"
    torch.onnx.export(
        wrapper,
        (x, x_lengths, torch.tensor([0.667]), torch.tensor([1.0]), torch.tensor([0.8]), torch.tensor([0])),
        str(output_path),
        opset_version=13,
        input_names=["x", "x_lengths", "noise_scale", "length_scale", "noise_scale_w", "sid"],
        output_names=["y"],
        dynamic_axes={"x": {0: "N", 1: "L"}, "x_lengths": {0: "N"}, "y": {0: "N", 2: "T"}},
    )
    onnx_model = onnx.load(str(output_path))
    metadata = {
        "model_type": "vits",
        "comment": "Open Bible Twi-Asante Coqui VITS converted for Sherpa-ONNX",
        "language": "Twi-Asante",
        "add_blank": int(model.args.add_blank),
        "n_speakers": int(model.num_speakers),
        "sample_rate": int(model.ap.model_args.audio.sample_rate) if hasattr(model, "ap") else 22050,
    }
    for key, value in metadata.items():
        item = onnx_model.metadata_props.add()
        item.key = key
        item.value = str(value)
    onnx.save(onnx_model, str(output_path))

    with (output / "tokens.txt").open("w", encoding="utf-8") as tokens:
        for index, symbol in enumerate(symbols):
            tokens.write(f"{symbol} {index}\n")


if __name__ == "__main__":
    main()