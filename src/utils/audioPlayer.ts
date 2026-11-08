/**
 * Web Audio API synthesizer for Morse code playback and WAV export.
 * Follows ITU-R standards with smooth envelope transitions.
 */

import { generateSignalSequence, MorseSignalUnit, getDotDurationMs } from './morse';

export interface PlaybackCallbacks {
  onUnitStart?: (unit: MorseSignalUnit, index: number, total: number) => void;
  onActiveSignalChange?: (active: boolean, symbol?: '.' | '-') => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
}

export class MorseAudioController {
  private audioCtx: AudioContext | null = null;
  private isRunning = false;
  private abortController: AbortController | null = null;
  private manualOscillator: OscillatorNode | null = null;
  private manualGain: GainNode | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Starts playback of a Morse sequence with real-time callbacks
   */
  public async play(
    morse: string,
    wpm = 20,
    frequency = 650,
    callbacks: PlaybackCallbacks = {}
  ): Promise<void> {
    this.stop();

    const sequence = generateSignalSequence(morse, wpm);
    if (sequence.length === 0) {
      callbacks.onComplete?.();
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const ctx = this.getAudioContext();

    try {
      for (let i = 0; i < sequence.length; i++) {
        if (signal.aborted || !this.isRunning) break;

        const unit = sequence[i];
        callbacks.onUnitStart?.(unit, i, sequence.length);

        if (unit.type === 'sound') {
          callbacks.onActiveSignalChange?.(true, unit.symbol);
          await this.playTone(ctx, unit.durationMs, frequency, signal);
          callbacks.onActiveSignalChange?.(false);
        } else {
          callbacks.onActiveSignalChange?.(false);
          await this.sleep(unit.durationMs, signal);
        }
      }

      if (!signal.aborted && this.isRunning) {
        callbacks.onComplete?.();
      }
    } catch (err: unknown) {
      if (!signal.aborted) {
        callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      this.isRunning = false;
      callbacks.onActiveSignalChange?.(false);
    }
  }

  /**
   * Stops playback immediately
   */
  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
    this.stopManualTone();
  }

  public get isPlaying(): boolean {
    return this.isRunning;
  }

  /**
   * Starts a manual tone (for interactive straight telegraph key)
   */
  public startManualTone(frequency = 650): void {
    const ctx = this.getAudioContext();
    if (this.manualOscillator) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Smooth envelope attack (5ms)
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.005);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    this.manualOscillator = osc;
    this.manualGain = gain;
  }

  /**
   * Stops the manual tone
   */
  public stopManualTone(): void {
    if (!this.manualOscillator || !this.manualGain || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const osc = this.manualOscillator;
    const gain = this.manualGain;

    this.manualOscillator = null;
    this.manualGain = null;

    try {
      // Smooth envelope release (5ms)
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.005);

      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore if already disconnected
        }
      }, 15);
    } catch {
      // Ignore
    }
  }

  /**
   * Plays a single tone with smooth attack and release
   */
  private playTone(
    ctx: AudioContext,
    durationMs: number,
    frequency: number,
    abortSignal: AbortSignal
  ): Promise<void> {
    return new Promise((resolve) => {
      if (abortSignal.aborted) {
        resolve();
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      const now = ctx.currentTime;
      const attackSec = 0.005;
      const durationSec = durationMs / 1000;
      const releaseSec = 0.005;

      // Envelope to prevent audible pops
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.7, now + attackSec);
      gain.gain.setValueAtTime(0.7, now + Math.max(attackSec, durationSec - releaseSec));
      gain.gain.linearRampToValueAtTime(0, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec);

      const onAbort = () => {
        try {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
        resolve();
      };

      abortSignal.addEventListener('abort', onAbort, { once: true });

      setTimeout(() => {
        abortSignal.removeEventListener('abort', onAbort);
        resolve();
      }, durationMs);
    });
  }

  private sleep(ms: number, abortSignal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (abortSignal.aborted) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        abortSignal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        resolve();
      };
      abortSignal.addEventListener('abort', onAbort, { once: true });
    });
  }
}

/**
 * Creates and downloads a high-quality 44.1kHz 16-bit PCM WAV audio file of Morse code
 */
export function generateMorseWavBlob(
  morse: string,
  wpm = 20,
  frequency = 650
): Blob {
  const sampleRate = 44100;
  const sequence = generateSignalSequence(morse, wpm);
  const totalDurationMs = sequence.reduce((acc, u) => acc + u.durationMs, 0);
  const totalSamples = Math.ceil((totalDurationMs / 1000) * sampleRate);

  const buffer = new Float32Array(totalSamples);
  let sampleIndex = 0;

  for (const unit of sequence) {
    const unitSamples = Math.round((unit.durationMs / 1000) * sampleRate);
    if (unit.type === 'sound') {
      const attackSamples = Math.round(0.005 * sampleRate);
      const releaseSamples = Math.round(0.005 * sampleRate);

      for (let s = 0; s < unitSamples && sampleIndex + s < totalSamples; s++) {
        const t = s / sampleRate;
        const wave = Math.sin(2 * Math.PI * frequency * t);

        // Envelope multiplier
        let amp = 0.7;
        if (s < attackSamples) {
          amp *= s / attackSamples;
        } else if (s > unitSamples - releaseSamples) {
          amp *= Math.max(0, (unitSamples - s) / releaseSamples);
        }

        buffer[sampleIndex + s] = wave * amp;
      }
    }
    sampleIndex += unitSamples;
  }

  // Convert Float32Array to 16-bit PCM WAV
  const wavBytes = new Uint8Array(44 + buffer.length * 2);
  const view = new DataView(wavBytes.buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + buffer.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat 1 = PCM
  view.setUint16(22, 1, true); // NumChannels = 1 (Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, buffer.length * 2, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([wavBytes], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
