export interface PitchSample {
  frequency: number | null;
  midi: number | null;
  cents: number | null;
  timestampMs: number;
}

export interface PitchDetector {
  start(): Promise<void>;
  stop(): void;
  getCurrentSample(): PitchSample;
}

export class StubPitchDetector implements PitchDetector {
  private sample: PitchSample = {
    frequency: null,
    midi: null,
    cents: null,
    timestampMs: Date.now(),
  };

  async start() {
    this.sample = { ...this.sample, timestampMs: Date.now() };
  }

  stop() {
    this.sample = { ...this.sample, timestampMs: Date.now() };
  }

  getCurrentSample() {
    return this.sample;
  }
}
