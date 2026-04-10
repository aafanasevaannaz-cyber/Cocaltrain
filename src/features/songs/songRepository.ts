import type { Song } from '../../types/song';

export interface SongRepository {
  list(): Promise<Song[]>;
  byId(id: string): Promise<Song | null>;
}

export class InMemorySongRepository implements SongRepository {
  constructor(private songs: Song[]) {}

  async list() {
    return this.songs;
  }

  async byId(id: string) {
    return this.songs.find((song) => song.id === id) ?? null;
  }
}
