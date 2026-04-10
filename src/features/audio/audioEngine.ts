export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface AudioMix {
  masterVolume: number;
  vocalVolume: number;
  instrumentalVolume: number;
}

export interface AudioSettings extends AudioMix {
  tempo: number;
  transpose: number;
  toneProfile: ToneProfile;
}

export type ToneProfile = 'wave' | 'piano' | 'voice';

export interface ReferenceNote {
  midi: number;
  duration: number;
}

export interface PlaySequenceOptions {
  onNoteStart?: (index: number) => void;
  onEnd?: () => void;
}

export class AudioEngine {
  private state: PlaybackState = 'idle';
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private timeouts: number[] = [];
  private settings: AudioSettings = {
    masterVolume: 70,
    vocalVolume: 50,
    instrumentalVolume: 60,
    tempo: 100,
    transpose: 0,
    toneProfile: 'wave',
  };

  get playbackState(): PlaybackState {
    return this.state;
  }

  get currentSettings(): AudioSettings {
    return this.settings;
  }

  setSettings(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    if (this.gainNode) {
      this.gainNode.gain.value = this.settings.masterVolume / 100;
    }
  }

  private ensureAudio() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.settings.masterVolume / 100;
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  private playToneAt(startAt: number, midi: number, durationSeconds: number) {
    if (!this.audioContext || !this.gainNode) {
      return;
    }

    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const tone = this.settings.toneProfile;
    if (tone === 'piano') {
      this.playPianoTone(startAt, frequency, durationSeconds);
      return;
    }
    if (tone === 'voice') {
      this.playVoiceTone(startAt, frequency, durationSeconds);
      return;
    }
    this.playWaveTone(startAt, frequency, durationSeconds);
  }

  private playWaveTone(startAt: number, frequency: number, durationSeconds: number) {
    if (!this.audioContext || !this.gainNode) return;
    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    noteGain.gain.setValueAtTime(0.0001, startAt);
    noteGain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.015);
    noteGain.gain.setValueAtTime(0.12, startAt + Math.max(0.02, durationSeconds - 0.035));
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startAt);
    osc.connect(noteGain);
    noteGain.connect(this.gainNode);
    osc.start(startAt);
    osc.stop(startAt + durationSeconds + 0.01);
  }

  private playPianoTone(startAt: number, frequency: number, durationSeconds: number) {
    if (!this.audioContext || !this.gainNode) return;
    const partials = [1, 2, 3];
    partials.forEach((multiplier, idx) => {
      const osc = this.audioContext!.createOscillator();
      const noteGain = this.audioContext!.createGain();
      const level = idx === 0 ? 0.16 : idx === 1 ? 0.06 : 0.03;
      noteGain.gain.setValueAtTime(0.0001, startAt);
      noteGain.gain.exponentialRampToValueAtTime(level, startAt + 0.01);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(0.12, durationSeconds));
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequency * multiplier, startAt);
      osc.connect(noteGain);
      noteGain.connect(this.gainNode!);
      osc.start(startAt);
      osc.stop(startAt + durationSeconds + 0.03);
    });
  }

  private playVoiceTone(startAt: number, frequency: number, durationSeconds: number) {
    if (!this.audioContext || !this.gainNode) return;
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const noteGain = this.audioContext.createGain();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, startAt);
    filter.Q.setValueAtTime(0.9, startAt);
    noteGain.gain.setValueAtTime(0.0001, startAt);
    noteGain.gain.exponentialRampToValueAtTime(0.1, startAt + 0.02);
    noteGain.gain.setValueAtTime(0.1, startAt + Math.max(0.02, durationSeconds - 0.03));
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, startAt);
    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.gainNode);
    osc.start(startAt);
    osc.stop(startAt + durationSeconds + 0.02);
  }

  playSequence(notes: ReferenceNote[], options: PlaySequenceOptions = {}) {
    if (notes.length === 0) {
      options.onEnd?.();
      return;
    }

    this.stop();
    this.ensureAudio();
    if (!this.audioContext) {
      return;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.state = 'playing';
    let elapsed = 0;
    const tempoRatio = this.settings.tempo / 100;

    notes.forEach((note, index) => {
      const adjustedMidi = note.midi + this.settings.transpose;
      const durationSeconds = Math.max(0.08, note.duration / tempoRatio);
      const startAt = this.audioContext!.currentTime + elapsed;
      this.playToneAt(startAt, adjustedMidi, durationSeconds);

      const timeout = window.setTimeout(() => {
        options.onNoteStart?.(index);
      }, elapsed * 1000);

      this.timeouts.push(timeout);
      elapsed += durationSeconds;
    });

    const endTimeout = window.setTimeout(() => {
      this.state = 'idle';
      options.onEnd?.();
    }, elapsed * 1000 + 30);
    this.timeouts.push(endTimeout);
  }

  play() {
    this.state = 'playing';
  }

  pause() {
    this.state = 'paused';
  }

  stop() {
    this.state = 'idle';
    this.timeouts.forEach((timeout) => window.clearTimeout(timeout));
    this.timeouts = [];
  }
}
