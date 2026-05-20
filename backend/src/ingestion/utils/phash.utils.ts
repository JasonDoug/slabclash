/**
 * Computes the Hamming distance between two hex-encoded hashes.
 * Each hex character represents 4 bits.
 */
export function computeHammingDistance(h1: string, h2: string): number {
  if (h1.length !== h2.length) {
    // If lengths differ, they are considered completely different
    // (e.g., comparing a 16-char imghash with a 64-char SHA256 fallback)
    return Math.max(h1.length, h2.length) * 4;
  }

  let distance = 0;
  for (let i = 0; i < h1.length; i++) {
    let n = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
    // Count set bits in the XOR result
    while (n > 0) {
      distance++;
      n &= n - 1;
    }
  }
  return distance;
}
