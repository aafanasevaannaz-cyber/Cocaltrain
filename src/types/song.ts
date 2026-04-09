export type SongNote = {
  start: number;
  duration: number;
  midi: number;
  text: string;
};

export type SongPhrase = {
  id: number;
  text: string;
  start: number;
  end: number;
  notes: SongNote[];
};

export type SongTracks = {
  fullmix?: string;
  vocal?: string;
  instrumental?: string;
};

export type Song = {
  id: string;
  title: string;
  artist?: string;
  tempo: number;
  defaultKey: string;
  range: {
    minMidi: number;
    maxMidi: number;
  };
  tracks: SongTracks;
  phrases: SongPhrase[];
};
