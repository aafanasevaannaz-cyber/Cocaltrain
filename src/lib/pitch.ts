export function autoCorrelate(buffer: Float32Array, sampleRate: number): number | null {
  let rms = 0;

  for (let i = 0; i < buffer.length; i += 1) {
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return null;

  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;

  for (let i = 0; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {
      r2 = buffer.length - i;
      break;
    }
  }

  const trimmed = buffer.slice(r1, r2);
  const size = trimmed.length;
  if (size === 0) return null;

  const correlation = new Float32Array(size);

  for (let lag = 0; lag < size; lag += 1) {
    let sum = 0;
    for (let i = 0; i < size - lag; i += 1) {
      sum += trimmed[i] * trimmed[i + lag];
    }
    correlation[lag] = sum;
  }

  let dip = 0;
  while (dip + 1 < size && correlation[dip] > correlation[dip + 1]) {
    dip += 1;
  }

  let maxVal = -1;
  let maxPos = -1;

  for (let i = dip; i < size; i += 1) {
    if (correlation[i] > maxVal) {
      maxVal = correlation[i];
      maxPos = i;
    }
  }

  if (maxPos < 1 || maxPos + 1 >= size) return null;

  let t0 = maxPos;
  const x1 = correlation[t0 - 1];
  const x2 = correlation[t0];
  const x3 = correlation[t0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a) {
    t0 -= b / (2 * a);
  }

  return sampleRate / t0;
}
