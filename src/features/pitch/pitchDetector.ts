import { autoCorrelate } from '../../lib/pitch';
import { freqToMidi } from '../../lib/music';

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

export class BrowserPitchDetector implements PitchDetector {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private rafId: number | null = null;
  private readonly fftSize = 2048;

  private sample: PitchSample = {
    frequency: null,
    midi: null,
    cents: null,
    timestampMs: Date.now(),
  };

  async start() {
    if (this.rafId != null) {
      return;
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
      },
    });

    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.source.connect(this.analyser);

    const read = () => {
      if (!this.analyser || !this.audioContext) {
        return;
      }

      const buffer = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buffer);

      const frequency = autoCorrelate(buffer, this.audioContext.sampleRate);
      const midi = freqToMidi(frequency);
      const roundedMidi = midi == null ? null : Math.round(midi);
      const cents = midi == null || roundedMidi == null ? null : Math.round((midi - roundedMidi) * 100);

      this.sample = {
        frequency,
        midi,
        cents,
        timestampMs: Date.now(),
      };

      this.rafId = requestAnimationFrame(read);
    };

    this.rafId = requestAnimationFrame(read);
  }

  stop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;

    this.source?.disconnect();
    this.analyser?.disconnect();
    this.audioContext?.close();
    this.stream?.getTracks().forEach((track) => track.stop());

    this.source = null;
    this.analyser = null;
    this.audioContext = null;
    this.stream = null;
    this.sample = { ...this.sample, frequency: null, midi: null, cents: null, timestampMs: Date.now() };
  }

  getCurrentSample() {
    return this.sample;
  }
}
