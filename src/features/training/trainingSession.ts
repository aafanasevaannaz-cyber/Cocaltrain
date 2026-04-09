export interface TrainingProgress {
  attempts: number;
  correct: number;
}

export function getAccuracyPercent(progress: TrainingProgress): number {
  if (progress.attempts === 0) {
    return 0;
  }

  return Math.round((progress.correct / progress.attempts) * 100);
}
