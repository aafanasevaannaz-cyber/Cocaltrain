export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface AudioMix {
  masterVolume: number;
  vocalVolume: number;
  instrumentalVolume: number;
}

export class AudioEngine {
  private state: PlaybackState = 'idle';

  get playbackState(): PlaybackState {
    return this.state;
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
