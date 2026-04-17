import type { Song } from '../../types/song';

export type SongCatalogItem = Pick<Song, 'id' | 'title' | 'artist' | 'tempo' | 'defaultKey' | 'range'> & {
  file: string;
};

export class HttpSongRepository {
  private catalogCache: SongCatalogItem[] | null = null;

  constructor(private manifestPath = 'songs/index.json') {}

  async list() {
    if (this.catalogCache) {
      return this.catalogCache;
    }

    const response = await fetch(this.resolvePath(this.manifestPath));
    if (!response.ok) {
      throw new Error(`Каталог песен не загрузился (${response.status}).`);
    }

    const data = (await response.json()) as SongCatalogItem[];
    if (!Array.isArray(data)) {
      throw new Error('Файл каталога песен имеет неверный формат.');
    }

    this.catalogCache = data;
    return data;
  }

  async byId(id: string) {
    const catalog = await this.list();
    const item = catalog.find((song) => song.id === id);
    if (!item) {
      return null;
    }

    const response = await fetch(this.resolvePath(item.file));
    if (!response.ok) {
      throw new Error(`Песня "${item.title}" не загрузилась (${response.status}).`);
    }

    return (await response.json()) as Song;
  }

  private resolvePath(path: string) {
    if (/^https?:\/\//.test(path)) {
      return path;
    }

    const trimmedBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
    const trimmedPath = path.replace(/^\/+/, '');
    return `${trimmedBase}${trimmedPath}`;
  }
}
