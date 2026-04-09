export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface AudioMix {
  masterVolume: number;
  vocalVolume: number;
  instrumentalVolume: number;
}

export interface AudioSettings extends AudioMix {
  tempo: number;
  transpose: number;
}

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
