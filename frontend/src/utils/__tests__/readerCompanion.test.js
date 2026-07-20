import { describe, expect, it } from 'vitest';
import {
  detectReadingMilestone,
  getReadingPhaseKey,
  getReadingPhaseLabelKey,
} from '../readerCompanion';

describe('readerCompanion', () => {
  describe('getReadingPhaseKey', () => {
    it('returns beginning on first page', () => {
      expect(getReadingPhaseKey(0, 8)).toBe('beginning');
    });

    it('returns exploring after page 3', () => {
      expect(getReadingPhaseKey(2, 8)).toBe('exploring');
    });

    it('returns halfway at midpoint', () => {
      expect(getReadingPhaseKey(4, 8)).toBe('halfway');
    });

    it('returns almost near the end', () => {
      expect(getReadingPhaseKey(6, 8)).toBe('almost');
    });

    it('returns end on last page', () => {
      expect(getReadingPhaseKey(7, 8)).toBe('end');
    });
  });

  describe('getReadingPhaseLabelKey', () => {
    it('maps phase keys to translation keys', () => {
      expect(getReadingPhaseLabelKey('beginning')).toBe('readerPhaseBeginning');
      expect(getReadingPhaseLabelKey('exploring')).toBe('readerPhaseExploring');
      expect(getReadingPhaseLabelKey('halfway')).toBe('readerPhaseHalfway');
      expect(getReadingPhaseLabelKey('almost')).toBe('readerPhaseAlmost');
      expect(getReadingPhaseLabelKey('end')).toBe('readerPhaseEnd');
    });
  });

  describe('detectReadingMilestone', () => {
    it('fires page3 milestone on third page', () => {
      const shown = new Set();
      const milestone = detectReadingMilestone(2, 6, shown);
      expect(milestone).toEqual({ id: 'page3', messageKey: 'companionPage3' });
    });

    it('does not repeat milestones', () => {
      const shown = new Set(['page3']);
      expect(detectReadingMilestone(2, 6, shown)).toBeNull();
    });

    it('fires halfway milestone at midpoint', () => {
      const shown = new Set();
      expect(detectReadingMilestone(3, 6, shown)).toEqual({
        id: 'halfway',
        messageKey: 'companionHalfway',
      });
    });

    it('fires almostEnd on penultimate page', () => {
      const shown = new Set();
      expect(detectReadingMilestone(4, 6, shown)).toEqual({
        id: 'almostEnd',
        messageKey: 'companionAlmostEnd',
      });
    });

    it('fires lastPage on final page', () => {
      const shown = new Set();
      expect(detectReadingMilestone(5, 6, shown)).toEqual({
        id: 'lastPage',
        messageKey: 'companionLastPage',
      });
    });
  });
});
