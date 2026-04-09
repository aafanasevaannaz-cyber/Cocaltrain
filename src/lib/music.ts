const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export const freqToMidi = (freq: number | null) => {
  if (!freq || freq <= 0) return null;
  return 69 + 12 * Math.log2(freq / 440);
};

export function midiToNoteName(midi: number | null) {
  if (midi == null || Number.isNaN(midi)) return '--';
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${name}${octave}`;
}

export function getAccuracy(diffInSemitones: number | null) {
  if (diffInSemitones == null || Number.isNaN(diffInSemitones)) {
    return {
      label: 'ЖДУ ГОЛОС',
      color: '#94a3b8',
      bg: '#f8fafc',
      dot: '#94a3b8'
    };
  }

  const cents = Math.abs(diffInSemitones * 100);

  if (cents <= 10) {
    return { label: 'В НОТУ', color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' };
  }

  if (cents <= 30) {
    return { label: 'ПОЧТИ', color: '#ca8a04', bg: '#fef9c3', dot: '#eab308' };
  }

  return { label: 'МИМО', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' };
}
