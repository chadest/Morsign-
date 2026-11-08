/**
 * Audio Morse Code Decoder
 * Analyzes live microphone input using Web Audio API (Bandpass filter + FFT Analyser),
 * detecting tone frequency, measuring signal intervals, and decoding International Morse Code.
 */

import { morseToText, getDotDurationMs } from './morse';

export interface AudioDecoderCallbacks {
  onLevelUpdate?: (level: number, threshold: number) => void;
  onSignalState?: (active: boolean) => void;
  onMorseUpdate?: (morse: string) => void;
  onTextUpdate?: (text: string) => void;
  onError?: (err: Error) => void;
}

export class AudioDecoder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationId: number | null = null;

  private isListening = false;
  private threshold = 0.25; // Default threshold (0.0 to 1.0)
  private targetFreq = 650; // Expected Morse tone frequency (Hz)
  private wpm = 20;

  // Signal detection state machine
  private isSignalHigh = false;
  private highStartTime: number | null = null;
  private lowStartTime: number | null = null;

  // Accumulated symbols
  private currentLetterMorse = '';
  private fullMorse = '';
  private letterTimer: number | null = null;
  private wordTimer: number | null = null;

  private callbacks: AudioDecoderCallbacks = {};

  public async start(
    callbacks: AudioDecoderCallbacks,
    options: { threshold?: number; targetFreq?: number; wpm?: number } = {}
  ): Promise<boolean> {
    this.stop();
    this.callbacks = callbacks;
    if (options.threshold !== undefined) this.threshold = options.threshold;
    if (options.targetFreq !== undefined) this.targetFreq = options.targetFreq;
    if (options.wpm !== undefined) this.wpm = options.wpm;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.mediaStream = stream;
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      this.audioCtx = ctx;

      const source = ctx.createMediaStreamSource(stream);
      this.source = source;

      // Bandpass filter centered around target Morse frequency
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(this.targetFreq, ctx.currentTime);
      bandpass.Q.setValueAtTime(5.0, ctx.currentTime);
      this.bandpass = bandpass;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.4;
      this.analyser = analyser;

      source.connect(bandpass);
      bandpass.connect(analyser);

      this.isListening = true;
      this.runDetectionLoop();
      return true;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(error);
      this.stop();
      return false;
    }
  }

  public setThreshold(val: number): void {
    this.threshold = Math.max(0.02, Math.min(0.98, val));
  }

  public setTargetFrequency(freq: number): void {
    this.targetFreq = freq;
    if (this.bandpass && this.audioCtx) {
      this.bandpass.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    }
  }

  public setWpm(wpm: number): void {
    this.wpm = wpm;
  }

  public resetDecoded(): void {
    this.currentLetterMorse = '';
    this.fullMorse = '';
    this.callbacks.onMorseUpdate?.('');
    this.callbacks.onTextUpdate?.('');
  }

  private runDetectionLoop = (): void => {
    if (!this.isListening || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS volume level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length) * 3; // Scaled for usability
    const currentLevel = Math.min(1.0, rms);

    this.callbacks.onLevelUpdate?.(currentLevel, this.threshold);

    // Evaluate tone state
    const now = Date.now();
    const isAbove = currentLevel >= this.threshold;

    if (isAbove && !this.isSignalHigh) {
      // Transition from silence to tone
      this.isSignalHigh = true;
      this.highStartTime = now;
      this.callbacks.onSignalState?.(true);

      if (this.letterTimer) {
        clearTimeout(this.letterTimer);
        this.letterTimer = null;
      }
      if (this.wordTimer) {
        clearTimeout(this.wordTimer);
        this.wordTimer = null;
      }
    } else if (!isAbove && this.isSignalHigh) {
      // Transition from tone to silence
      this.isSignalHigh = false;
      this.lowStartTime = now;
      this.callbacks.onSignalState?.(false);

      if (this.highStartTime) {
        const duration = now - this.highStartTime;
        const dotMs = getDotDurationMs(this.wpm);
        // Minimum debounce (ignore noise spikes < 25ms)
        if (duration >= 25) {
          const dashThreshold = dotMs * 1.8;
          const symbol = duration >= dashThreshold ? '-' : '.';
          this.currentLetterMorse += symbol;

          // Notify live stream
          const previewMorse = this.fullMorse
            ? `${this.fullMorse} ${this.currentLetterMorse}`
            : this.currentLetterMorse;
          this.callbacks.onMorseUpdate?.(previewMorse);
          this.callbacks.onTextUpdate?.(morseToText(previewMorse));

          this.scheduleLetterCompletion(dotMs);
        }
      }
    }

    this.animationId = requestAnimationFrame(this.runDetectionLoop);
  };

  private scheduleLetterCompletion(dotMs: number): void {
    if (this.letterTimer) clearTimeout(this.letterTimer);
    if (this.wordTimer) clearTimeout(this.wordTimer);

    const letterBreakMs = dotMs * 2.8;
    const wordBreakMs = dotMs * 6.5;

    this.letterTimer = window.setTimeout(() => {
      if (this.currentLetterMorse) {
        this.fullMorse = this.fullMorse
          ? `${this.fullMorse} ${this.currentLetterMorse}`
          : this.currentLetterMorse;
        this.currentLetterMorse = '';

        this.callbacks.onMorseUpdate?.(this.fullMorse);
        this.callbacks.onTextUpdate?.(morseToText(this.fullMorse));
      }

      this.wordTimer = window.setTimeout(() => {
        if (this.fullMorse && !this.fullMorse.endsWith(' / ')) {
          this.fullMorse += ' / ';
          this.callbacks.onMorseUpdate?.(this.fullMorse);
          this.callbacks.onTextUpdate?.(morseToText(this.fullMorse));
        }
      }, wordBreakMs - letterBreakMs);
    }, letterBreakMs);
  }

  public stop(): void {
    this.isListening = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.letterTimer) {
      clearTimeout(this.letterTimer);
      this.letterTimer = null;
    }
    if (this.wordTimer) {
      clearTimeout(this.wordTimer);
      this.wordTimer = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {}
      this.source = null;
    }
    if (this.bandpass) {
      try {
        this.bandpass.disconnect();
      } catch {}
      this.bandpass = null;
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {}
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      if (this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
      }
      this.audioCtx = null;
    }
    this.isSignalHigh = false;
    this.callbacks.onSignalState?.(false);
  }

  public get active(): boolean {
    return this.isListening;
  }
}
