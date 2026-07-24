/**
 * Built-in interactive challenges per educational world (offline-friendly).
 */

export function getWorldChallenges(worldId) {
  const packs = {
    alphabet: [
      {
        id: 'alpha-match',
        type: 'match',
        pictogram: '🔤',
        pairs: [
          { id: 'a', left: 'A', right: '🍎' },
          { id: 'b', left: 'B', right: '🎈' },
          { id: 'c', left: 'C', right: '🐱' },
        ],
      },
      {
        id: 'alpha-find',
        type: 'find',
        pictogram: '🔎',
        prompt: 'A',
        options: [
          { id: 'a', label: 'A', correct: true },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' },
          { id: 'd', label: 'D' },
        ],
      },
    ],
    numbers: [
      {
        id: 'num-count',
        type: 'count',
        pictogram: '🔢',
        items: ['⭐', '⭐', '⭐'],
        answer: 3,
        options: [2, 3, 4, 5],
      },
      {
        id: 'num-seq',
        type: 'sequence',
        pictogram: '➕',
        sequence: [1, 2, 3, '?'],
        answer: 4,
        options: [4, 5, 6],
      },
    ],
    colors: [
      {
        id: 'color-match',
        type: 'match',
        pictogram: '🎨',
        pairs: [
          { id: 'r', left: '🔴', right: 'Rouge / Red' },
          { id: 'b', left: '🔵', right: 'Bleu / Blue' },
          { id: 'g', left: '🟢', right: 'Vert / Green' },
        ],
      },
      {
        id: 'color-find',
        type: 'find',
        pictogram: '🌈',
        prompt: '🔴',
        options: [
          { id: 'r', label: '🔴', correct: true },
          { id: 'y', label: '🟡' },
          { id: 'p', label: '🟣' },
          { id: 'o', label: '🟠' },
        ],
      },
    ],
    shapes: [
      {
        id: 'shape-find',
        type: 'find',
        pictogram: '🔷',
        prompt: '○',
        options: [
          { id: 'c', label: '○', correct: true },
          { id: 's', label: '□' },
          { id: 't', label: '△' },
          { id: 'd', label: '◇' },
        ],
      },
      {
        id: 'shape-match',
        type: 'match',
        pictogram: '⬜',
        pairs: [
          { id: '1', left: '○', right: 'Circle' },
          { id: '2', left: '□', right: 'Square' },
          { id: '3', left: '△', right: 'Triangle' },
        ],
      },
    ],
    logic: [
      {
        id: 'logic-seq',
        type: 'sequence',
        pictogram: '🧩',
        sequence: ['🔴', '🔵', '🔴', '?'],
        answer: '🔵',
        options: ['🔵', '🟢', '🟡'],
      },
    ],
    mathematics: [
      {
        id: 'math-count',
        type: 'count',
        pictogram: '➕',
        items: ['🍎', '🍎', '🍎', '🍎'],
        answer: 4,
        options: [3, 4, 5, 6],
      },
      {
        id: 'math-seq',
        type: 'sequence',
        pictogram: '🔢',
        sequence: [2, 4, 6, '?'],
        answer: 8,
        options: [7, 8, 10],
      },
    ],
    animals: [
      {
        id: 'animal-find',
        type: 'find',
        pictogram: '🦁',
        prompt: '🦁',
        options: [
          { id: 'lion', label: '🦁', correct: true },
          { id: 'cat', label: '🐱' },
          { id: 'dog', label: '🐶' },
          { id: 'bird', label: '🐦' },
        ],
      },
      {
        id: 'animal-match',
        type: 'match',
        pictogram: '🐾',
        pairs: [
          { id: '1', left: '🐶', right: 'Woof' },
          { id: '2', left: '🐱', right: 'Meow' },
          { id: '3', left: '🐮', right: 'Moo' },
        ],
      },
    ],
    space: [
      {
        id: 'space-find',
        type: 'find',
        pictogram: '🚀',
        prompt: '🌙',
        options: [
          { id: 'moon', label: '🌙', correct: true },
          { id: 'sun', label: '☀️' },
          { id: 'star', label: '⭐' },
          { id: 'earth', label: '🌍' },
        ],
      },
    ],
    dinosaurs: [
      {
        id: 'dino-find',
        type: 'find',
        pictogram: '🦕',
        prompt: '🦕',
        options: [
          { id: 'dino', label: '🦕', correct: true },
          { id: 'rex', label: '🦖' },
          { id: 'egg', label: '🥚' },
          { id: 'leaf', label: '🌿' },
        ],
      },
    ],
    science: [
      {
        id: 'sci-find',
        type: 'find',
        pictogram: '🔬',
        prompt: '💧',
        options: [
          { id: 'water', label: '💧', correct: true },
          { id: 'fire', label: '🔥' },
          { id: 'rock', label: '🪨' },
          { id: 'wind', label: '💨' },
        ],
      },
    ],
    geography: [
      {
        id: 'geo-find',
        type: 'find',
        pictogram: '🌍',
        prompt: '🌍',
        options: [
          { id: 'earth', label: '🌍', correct: true },
          { id: 'moon', label: '🌙' },
          { id: 'star', label: '⭐' },
          { id: 'sun', label: '☀️' },
        ],
      },
    ],
    music: [
      {
        id: 'music-match',
        type: 'match',
        pictogram: '🎼',
        pairs: [
          { id: '1', left: '🥁', right: 'Drum' },
          { id: '2', left: '🎸', right: 'Guitar' },
          { id: '3', left: '🎹', right: 'Piano' },
        ],
      },
    ],
    nature: [
      {
        id: 'nature-find',
        type: 'find',
        pictogram: '🌱',
        prompt: '🌳',
        options: [
          { id: 'tree', label: '🌳', correct: true },
          { id: 'car', label: '🚗' },
          { id: 'phone', label: '📱' },
          { id: 'book', label: '📘' },
        ],
      },
    ],
    creativity: [
      {
        id: 'create-match',
        type: 'match',
        pictogram: '💡',
        pairs: [
          { id: '1', left: '🎨', right: 'Paint' },
          { id: '2', left: '✏️', right: 'Draw' },
          { id: '3', left: '🎭', right: 'Play' },
        ],
      },
    ],
    emotions: [
      {
        id: 'emo-match',
        type: 'match',
        pictogram: '❤️',
        pairs: [
          { id: '1', left: '😊', right: 'Happy' },
          { id: '2', left: '😢', right: 'Sad' },
          { id: '3', left: '😮', right: 'Surprised' },
        ],
      },
    ],
    kindness: [
      {
        id: 'kind-find',
        type: 'find',
        pictogram: '🤝',
        prompt: '🤝',
        options: [
          { id: 'share', label: '🤝', correct: true },
          { id: 'angry', label: '😠' },
          { id: 'push', label: '👊' },
          { id: 'ignore', label: '🙈' },
        ],
      },
    ],
    culture: [
      {
        id: 'culture-match',
        type: 'match',
        pictogram: '🕌',
        pairs: [
          { id: '1', left: 'سلام', right: 'Peace' },
          { id: '2', left: 'شكرا', right: 'Thanks' },
          { id: '3', left: 'مرحبا', right: 'Hello' },
        ],
      },
    ],
  };

  return packs[worldId] || [
    {
      id: `${worldId}-find`,
      type: 'find',
      pictogram: '⭐',
      prompt: '⭐',
      options: [
        { id: 'yes', label: '⭐', correct: true },
        { id: 'no', label: '○' },
        { id: 'x', label: '△' },
        { id: 'z', label: '□' },
      ],
    },
  ];
}
