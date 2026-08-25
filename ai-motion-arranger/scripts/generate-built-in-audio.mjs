#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const inputRoot = join(here, "..", "..", "public", "input");
const sampleRate = 24000;

const clampSample = (value) => Math.max(-1, Math.min(1, value));

const wavBuffer = (durationSeconds, sampleAt) => {
  const sampleCount = Math.round(durationSeconds * sampleRate);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const value = clampSample(sampleAt(time, durationSeconds));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  return buffer;
};

let noiseState = 0x12345678;
const noise = () => {
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
};

const assets = [
  {
    file: "sfx/impact.wav",
    duration: 0.42,
    sample: (time) => {
      const envelope = Math.exp(-time * 11);
      return (
        Math.sin(2 * Math.PI * (92 - time * 42) * time) * envelope * 0.72 +
        noise() * envelope * 0.08
      );
    },
  },
  {
    file: "sfx/whoosh-soft.wav",
    duration: 0.55,
    sample: (time, duration) => {
      const progress = time / duration;
      const envelope = Math.sin(Math.PI * progress) ** 1.5;
      return noise() * envelope * (0.06 + progress * 0.2);
    },
  },
  {
    file: "sfx/tick.wav",
    duration: 0.12,
    sample: (time) =>
      (Math.sin(2 * Math.PI * 1700 * time) + noise() * 0.25) *
      Math.exp(-time * 42) *
      0.34,
  },
];

for (const asset of assets) {
  const target = join(inputRoot, ...asset.file.split("/"));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, wavBuffer(asset.duration, asset.sample));
  process.stdout.write(`✓ ${asset.file}\n`);
}
