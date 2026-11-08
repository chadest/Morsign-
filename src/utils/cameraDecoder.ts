/**
 * Optical Camera Morse Code Decoder
 * Analyzes real-time video frames from camera, measuring optical luminance in a targeted zone
 * to detect Morse light pulses (torches, beacons, LEDs, screen flashes).
 */

import { morseToText, getDotDurationMs } from './morse';

export interface CameraDecoderCallbacks {
  onLuminanceUpdate?: (luminance: number, threshold: number) => void;
  onSignalState?: (active: boolean) => void;
  onMorseUpdate?: (morse: string) => void;
  onTextUpdate?: (text: string) => void;
  onError?: (err: Error) => void;
}

export class CameraDecoder {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;

  private isRunning = false;
  private threshold = 0.65; // Luminance threshold (0.0 to 1.0)
  private wpm = 20;

  // Signal detection state machine
  private isLightHigh = false;
  private highStartTime: number | null = null;

  // Accumulated symbols
  private currentLetterMorse = '';
  private fullMorse = '';
  private letterTimer: number | null = null;
  private wordTimer: number | null = null;

  private callbacks: CameraDecoderCallbacks = {};

  public async start(
    video: HTMLVideoElement,
    callbacks: CameraDecoderCallbacks,
    options: { threshold?: number; wpm?: number } = {}
  ): Promise<boolean> {
    this.stop();
    this.videoElement = video;
    this.callbacks = callbacks;
    if (options.threshold !== undefined) this.threshold = options.threshold;
    if (options.wpm !== undefined) this.wpm = options.wpm;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      this.stream = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      this.canvas = document.createElement('canvas');
      this.canvas.width = 160;
      this.canvas.height = 120;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.isRunning = true;
      this.processVideoFrame();
      return true;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(error);
      this.stop();
      return false;
    }
  }

  public setThreshold(val: number): void {
    this.threshold = Math.max(0.1, Math.min(0.95, val));
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

  private processVideoFrame = (): void => {
    if (!this.isRunning || !this.videoElement || !this.ctx || !this.canvas) return;

    if (this.videoElement.readyState >= 2) {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      this.ctx.drawImage(this.videoElement, 0, 0, cw, ch);

      // Sample a central 30% x 30% region of interest (ROI)
      const roiW = Math.floor(cw * 0.3);
      const roiH = Math.floor(ch * 0.3);
      const roiX = Math.floor((cw - roiW) / 2);
      const roiY = Math.floor((ch - roiH) / 2);

      const frameData = this.ctx.getImageData(roiX, roiY, roiW, roiH);
      const data = frameData.data;

      let totalLuminance = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard Rec. 601 luma formula
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
      }

      const avgLuminance = totalLuminance / (totalPixels * 255);
      this.callbacks.onLuminanceUpdate?.(avgLuminance, this.threshold);

      // Detection logic with hysteresis
      const isAbove = avgLuminance >= this.threshold;
      const now = Date.now();

      if (isAbove && !this.isLightHigh) {
        this.isLightHigh = true;
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
      } else if (!isAbove && this.isLightHigh) {
        this.isLightHigh = false;
        this.callbacks.onSignalState?.(false);

        if (this.highStartTime) {
          const duration = now - this.highStartTime;
          const dotMs = getDotDurationMs(this.wpm);

          // Ignore optical flicker / micro glints (< 35ms)
          if (duration >= 35) {
            const dashThreshold = dotMs * 1.8;
            const symbol = duration >= dashThreshold ? '-' : '.';
            this.currentLetterMorse += symbol;

            const previewMorse = this.fullMorse
              ? `${this.fullMorse} ${this.currentLetterMorse}`
              : this.currentLetterMorse;
            this.callbacks.onMorseUpdate?.(previewMorse);
            this.callbacks.onTextUpdate?.(morseToText(previewMorse));

            this.scheduleLetterCompletion(dotMs);
          }
        }
      }
    }

    this.animationId = requestAnimationFrame(this.processVideoFrame);
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
    this.isRunning = false;
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
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isLightHigh = false;
    this.callbacks.onSignalState?.(false);
  }

  public get active(): boolean {
    return this.isRunning;
  }
}
