/**
 * Camera Torch / Flash Controller
 * Controls hardware LED flash on mobile devices via MediaStream ImageCapture/applyConstraints,
 * with graceful detection and fallback.
 */

export class TorchController {
  private stream: MediaStream | null = null;
  private track: MediaStreamTrack | null = null;
  private isTorchSupported: boolean | null = null;
  private torchState = false;

  /**
   * Initializes camera stream and checks for torch capability
   */
  public async initTorch(): Promise<boolean> {
    if (this.track && this.isTorchSupported !== null) {
      return this.isTorchSupported;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.isTorchSupported = false;
      return false;
    }

    try {
      // Request environment (rear) camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      this.stream = stream;
      const track = stream.getVideoTracks()[0];
      if (!track) {
        this.isTorchSupported = false;
        return false;
      }

      this.track = track;
      const capabilities = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      const hasTorch = Boolean(capabilities && capabilities.torch);

      this.isTorchSupported = hasTorch;
      return hasTorch;
    } catch {
      this.isTorchSupported = false;
      return false;
    }
  }

  /**
   * Sets the torch state (true = on, false = off)
   */
  public async setTorch(on: boolean): Promise<boolean> {
    if (!this.track || !this.isTorchSupported) {
      return false;
    }

    try {
      await (this.track as unknown as {
        applyConstraints: (c: { advanced: Array<{ torch?: boolean }> }) => Promise<void>;
      }).applyConstraints({
        advanced: [{ torch: on }],
      });
      this.torchState = on;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Turns the torch on
   */
  public async turnOn(): Promise<boolean> {
    return this.setTorch(true);
  }

  /**
   * Turns the torch off
   */
  public async turnOff(): Promise<boolean> {
    return this.setTorch(false);
  }

  /**
   * Stops the camera stream completely to release battery and hardware
   */
  public release(): void {
    if (this.torchState) {
      this.setTorch(false).catch(() => {});
    }
    if (this.track) {
      this.track.stop();
      this.track = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.isTorchSupported = null;
    this.torchState = false;
  }

  public get isOn(): boolean {
    return this.torchState;
  }

  public get supported(): boolean | null {
    return this.isTorchSupported;
  }
}
