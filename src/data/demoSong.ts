import type { Song } from '../types/song';

export const demoSong: Song = {
  id: 'net-bez-trevog',
  title: 'Нет без тревог ни сна, ни дня',
  artist: 'Demo',
  tempo: 92,
  defaultKey: 'C',
  range: {
    minMidi: 59,
    maxMidi: 64,
  },
  tracks: {
    fullmix: '',
    vocal: '',
    instrumental: '',
  },
  phrases: [
    {
      id: 0,
      text: 'Нет без тревог',
      start: 0,
      end: 2.8,
      notes: [
        { start: 0.0, duration: 0.6, midi: 60, text: 'Нет' },
        { start: 0.8, duration: 0.6, midi: 62, text: 'без' },
        { start: 1.6, duration: 1.0, midi: 64, text: 'тревог' }
      ]
    },
    {
      id: 1,
      text: 'Ни сна, ни дня',
      start: 3.0,
      end: 5.8,
      notes: [
        { start: 0.0, duration: 0.5, midi: 62, text: 'ни' },
        { start: 0.6, duration: 0.5, midi: 60, text: 'сна,' },
        { start: 1.2, duration: 0.5, midi: 59, text: 'ни' },
        { start: 1.8, duration: 1.0, midi: 60, text: 'дня' }
      ]
    }
  ]
};
