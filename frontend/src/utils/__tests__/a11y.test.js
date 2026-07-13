import { describe, it, expect } from 'vitest';
import { getFocusableElements } from '../a11y.js';

describe('a11y focus helpers', () => {
  it('collects focusable elements inside a container', () => {
    document.body.innerHTML = `
      <div id="modal">
        <button type="button">First</button>
        <a href="/next">Link</a>
        <button type="button" disabled>Disabled</button>
      </div>
    `;

    const modal = document.getElementById('modal');
    const focusable = getFocusableElements(modal);

    expect(focusable).toHaveLength(2);
    expect(focusable[0].textContent).toBe('First');
    expect(focusable[1].textContent).toBe('Link');
  });
});
