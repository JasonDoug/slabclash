import { computeHammingDistance } from './phash.utils';

describe('phash utils', () => {
  describe('computeHammingDistance', () => {
    it('should return 0 for identical hashes', () => {
      expect(computeHammingDistance('ffff', 'ffff')).toBe(0);
      expect(computeHammingDistance('0000', '0000')).toBe(0);
      expect(computeHammingDistance('abcd', 'abcd')).toBe(0);
    });

    it('should return correct distance for different hashes', () => {
      // f = 1111, e = 1110 -> 1 bit difference
      expect(computeHammingDistance('f', 'e')).toBe(1);
      // f = 1111, 0 = 0000 -> 4 bits difference
      expect(computeHammingDistance('f', '0')).toBe(4);
      // 1010 (a) vs 0101 (5) -> 4 bits difference
      expect(computeHammingDistance('a', '5')).toBe(4);
    });

    it('should handle multi-character hashes', () => {
      // ff (11111111) vs ee (11101110) -> 2 bits difference
      expect(computeHammingDistance('ff', 'ee')).toBe(2);
      // abcd vs abce (d=1101, e=1110) -> 2 bits difference
      expect(computeHammingDistance('abcd', 'abce')).toBe(2);
    });

    it('should return max distance for hashes of different lengths', () => {
      const h1 = 'abcd';
      const h2 = 'abcdef';
      // 4 characters vs 6 characters -> considered completely different
      expect(computeHammingDistance(h1, h2)).toBe(h2.length * 4);
    });
  });
});
