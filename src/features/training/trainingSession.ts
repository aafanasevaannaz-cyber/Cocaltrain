export interface TrainingProgress {
  attempts: number;
  correct: number;
}

export type IntonationVerdict = 'waiting' | 'in_tune' | 'close' | 'off';

export function getAccuracyPercent(progress: TrainingProgress): number {
  if (progress.attempts === 0) {
    return 0;
  }

  return Math.round((progress.correct / progress.attempts) * 100);
}

export function getSemitoneDiff(targetMidi: number | null, actualMidi: number | null): number | null {
  if (targetMidi == null || actualMidi == null) {
    return null;
  }

  return actualMidi - targetMidi;
}

export function getIntonationVerdict(diffInSemitones: number | null): IntonationVerdict {
  if (diffInSemitones == null || Number.isNaN(diffInSemitones)) {
    return 'waiting';
  }

  const cents = Math.abs(diffInSemitones * 100);
  if (cents <= 10) {
    return 'in_tune';
  }
  if (cents <= 30) {
    return 'close';
  }
  return 'off';
}
