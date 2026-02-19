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
    { age: '3-5', label: '3-5 ans', color: 'bg-blue-500 hover:bg-blue-600' },
    { age: '6-8', label: '6-8 ans', color: 'bg-orange-500 hover:bg-orange-600' },
    { age: '9-12', label: '9-12 ans', color: 'bg-pink-500 hover:bg-pink-600' }
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
    const ageValue = age.includes('-') ? age.split('-')[0] : age;
    onAgeSelect(ageValue);
    setIsOpen(false);
    scrollToBooksSection();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 text-neutral-100 hover:text-white hover:bg-neutral-800/80 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors font-medium text-sm sm:text-base"
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
              className="absolute top-full left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 mt-2 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[300px] sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-neutral-200 mx-2 sm:mx-0"
            >
              {/* Header avec titre et boutons d'âge */}
              <div className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 p-4 sm:p-6 border-b border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Bibliothèque</h2>
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg hover:bg-neutral-50 transition-colors text-xs sm:text-sm font-medium text-neutral-700 border border-neutral-200">
                      <GlobeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Catalogue anglais</span>
                      <span className="sm:hidden">EN</span>
                    </button>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg hover:bg-neutral-50 transition-colors text-xs sm:text-sm font-medium text-neutral-700 border border-neutral-200">
                      <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Prix</span>
                      <span className="sm:hidden">🏆</span>
                    </button>
                  </div>
                </div>

                {/* Boutons d'âge */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {ageButtons.map((ageBtn) => {
                    const ageValue = ageBtn.age.includes('-') ? ageBtn.age.split('-')[0] : ageBtn.age;
                    const isSelected = selectedAge === ageValue;
                    return (
                      <button
                        key={ageBtn.age}
                        onClick={() => handleAgeClick(ageBtn.age)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white font-semibold text-xs sm:text-sm transition-all flex-1 sm:flex-none ${
                          isSelected ? ageBtn.color + ' ring-2 ring-offset-2 ring-offset-white ring-neutral-900' : ageBtn.color
                        }`}
                      >
                        {ageBtn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contenu : Seulement le lien Accueil */}
              <div className="p-4 sm:p-6">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 transition-colors font-semibold text-neutral-900 text-sm sm:text-base"
                >
                  <BookIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Accueil</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LibraryMenu;

