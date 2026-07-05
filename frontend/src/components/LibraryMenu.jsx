import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookIcon, GlobeIcon, TrophyIcon } from './Icons';

function LibraryMenu({ categories, onCategorySelect, onAgeSelect, selectedCategory, selectedAge }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const ageButtons = [
    { age: '3-5', label: '3-5 ans', color: 'bg-primary-500 hover:bg-primary-600' },
    { age: '6-8', label: '6-8 ans', color: 'bg-accent-500 hover:bg-accent-600' },
    { age: '9-12', label: '9-12 ans', color: 'bg-secondary-500 hover:bg-secondary-600' }
  ];

  const scrollToBooksSection = () => {
    setTimeout(() => {
      const booksSection = document.getElementById('books-section');
      if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleAgeClick = (age) => {
    // Passer la plage complète (ex: "3-5") au lieu de juste le premier nombre
    onAgeSelect(age);
    setIsOpen(false);
    scrollToBooksSection();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 text-surface-800 hover:text-primary-700 hover:bg-primary-50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl transition-colors font-semibold text-sm sm:text-base"
      >
        <BookIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Bibliothèque</span>
        <span className="sm:hidden">Biblio</span>
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:block fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 mt-2 w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-surface-200 mx-2 sm:mx-0"
            >
              {/* Header avec titre et boutons d'âge */}
              <div className="bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 p-4 sm:p-6 border-b border-surface-200">
                <div className="mb-5 space-y-4">
                  <h2 className="text-2xl font-bold text-surface-900">Bibliothèque</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex h-14 items-center justify-center gap-2 rounded-3xl border border-surface-200 bg-white px-3 text-sm font-semibold text-surface-700 shadow-sm transition-colors hover:bg-surface-50">
                      <GlobeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Catalogue anglais</span>
                      <span className="sm:hidden">EN</span>
                    </button>
                    <Link
                      to="/abonnements"
                      onClick={() => setIsOpen(false)}
                      className="flex h-14 items-center justify-center gap-2 rounded-3xl border border-surface-200 bg-white px-3 text-sm font-semibold text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                    >
                      <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Prix</span>
                      <span className="sm:hidden">🏆</span>
                    </Link>
                  </div>
                </div>

                {/* Boutons d'âge */}
                <div className="grid grid-cols-3 gap-3">
                  {ageButtons.map((ageBtn) => {
                    // Comparer avec la plage complète (ex: "3-5") ou juste le premier nombre pour compatibilité
                    const isSelected = selectedAge === ageBtn.age || selectedAge === ageBtn.age.split('-')[0];
                    return (
                      <button
                        key={ageBtn.age}
                        onClick={() => handleAgeClick(ageBtn.age)}
                        className={`h-11 rounded-3xl px-3 text-sm font-bold text-white transition-all ${
                          isSelected ? ageBtn.color + ' ring-2 ring-offset-2 ring-offset-white ring-surface-900' : ageBtn.color
                        }`}
                      >
                        {ageBtn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LibraryMenu;

