import { describe, it, expect } from 'vitest';
import { isAudioContent, getKidsContentPath, filterComptines } from '../contentRouting';

describe('contentRouting', () => {
  it('detects audio content types with audio_url', () => {
    expect(isAudioContent({ content_type: 'song', audio_url: '/a.mp3' })).toBe(true);
    expect(isAudioContent({ content_type: 'story', audio_url: '/a.mp3' })).toBe(true);
    expect(isAudioContent({ content_type: 'song' })).toBe(false);
  });

  it('routes audio content to listen page', () => {
    expect(getKidsContentPath({ id: 5, content_type: 'song', audio_url: '/a.mp3' })).toBe('/kids/listen/5');
    expect(getKidsContentPath({ id: 3, content_type: 'story' })).toBe('/kids/read/3');
  });

  it('filters comptines', () => {
    const books = [
      { id: 1, content_type: 'song' },
      { id: 2, content_type: 'audio_story' },
      { id: 3, content_type: 'story' },
    ];
    expect(filterComptines(books)).toHaveLength(1);
    expect(filterComptines(books)[0].id).toBe(1);
  });
});
