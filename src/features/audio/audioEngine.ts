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

export class AudioEngine {
  private state: PlaybackState = 'idle';
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
  }

  play() {
    this.state = 'playing';
  }

  pause() {
    this.state = 'paused';
  }

  stop() {
    this.state = 'idle';
  }
}
