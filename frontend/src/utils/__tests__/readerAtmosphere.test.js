import { describe, expect, it } from 'vitest';
import { deriveReaderMood } from '../readerAtmosphere.js';

describe('deriveReaderMood', () => {
  it('maps animal stories to golden sunlight mood', () => {
    expect(deriveReaderMood({ theme: 'animals', title: 'Les abeilles' })).toBe('golden');
  });

  it('maps ocean stories to ocean mood', () => {
    expect(deriveReaderMood({ theme: 'ocean', title: 'Poissons' })).toBe('ocean');
  });

  it('falls back to warm mood', () => {
    expect(deriveReaderMood({ title: 'Histoire sans thème' })).toBe('warm');
  });
});
