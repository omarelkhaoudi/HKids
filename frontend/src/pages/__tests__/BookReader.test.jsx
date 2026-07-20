import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookReader from '../BookReader.jsx';
import { LanguageProvider } from '../../context/LanguageContext.jsx';

const mockBook = {
  id: 83,
  slug: 'comptine-16',
  title: 'Les abeilles',
  content_type: 'song',
  cover_image: 'https://example.com/comptine-16-cover.svg',
  pages: [
    {
      page_number: 1,
      image_path: 'https://example.com/page-1.svg',
      content: 'Deux canetons suivent leur maman en file indienne.',
    },
    {
      page_number: 2,
      image_path: 'https://example.com/page-2.svg',
      content: 'Deux canetons suivent leur maman en file indienne.',
    },
    {
      page_number: 3,
      image_path: 'https://example.com/page-3.svg',
      content: 'Les abeilles butinent les fleurs du matin.',
    },
    {
      page_number: 4,
      image_path: 'https://example.com/page-4.svg',
      content: 'Le jour se termine en douceur.',
    },
  ],
};

vi.mock('../../api/books', () => ({
  booksAPI: {
    getBook: vi.fn(async () => ({ data: structuredClone(mockBook) })),
    getPublishedBooks: vi.fn(async () => ({ data: [] })),
  },
}));

vi.mock('../../api/subscriptions', () => ({
  subscriptionsAPI: {
    unlockBook: vi.fn(async () => ({})),
  },
}));

vi.mock('../../api/parental', () => ({
  parentalAPI: {
    recordReadingProgress: vi.fn(async () => ({})),
  },
}));

vi.mock('../../services/parental/kidActivitySyncService', () => ({
  syncOrQueueKidMutation: vi.fn(),
}));

vi.mock('../../api/voices', () => ({
  voicesAPI: {
    getAvailableVoices: vi.fn(async () => ({ data: [] })),
  },
}));

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    playing: false,
    duration: 0,
    currentTime: 0,
    play: vi.fn(),
    stop: vi.fn(),
    seekTo: vi.fn(),
    toggle: vi.fn(),
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('../../components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => ({
    recognize: vi.fn(async () => ({ data: { text: 'ocr text' } })),
    terminate: vi.fn(),
  })),
}));

function renderKidReader() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/kids/read/83']}>
          <Routes>
            <Route path="/kids/read/:id" element={<BookReader />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    );
  });

  return { container, root };
}

describe('BookReader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    mockBook.pages = [
      {
        page_number: 1,
        image_path: 'https://example.com/page-1.svg',
        content: 'Deux canetons suivent leur maman en file indienne.',
      },
      {
        page_number: 2,
        image_path: 'https://example.com/page-2.svg',
        content: 'Deux canetons suivent leur maman en file indienne.',
      },
      {
        page_number: 3,
        image_path: 'https://example.com/page-3.svg',
        content: 'Les abeilles butinent les fleurs du matin.',
      },
      {
        page_number: 4,
        image_path: 'https://example.com/page-4.svg',
        content: 'Le jour se termine en douceur.',
      },
    ];
  });

  it('renders book 83 without crashing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = renderKidReader();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Les abeilles');
    expect(consoleError.mock.calls.some(([message]) => String(message).includes('Objects are not valid'))).toBe(false);

    consoleError.mockRestore();
  });

  it('renders object page content as text', async () => {
    mockBook.pages[0] = {
      page_number: 1,
      image_path: null,
      content: { text: 'Une phrase objet.' },
    };

    const { container } = renderKidReader();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Une phrase objet');
  });
});
