import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookIcon, CategoryIcon, GlobeIcon, TrophyIcon } from './Icons';

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
    { age: '9-12', label: '9-12 ans', color: 'bg-pink-500 hover:bg-pink-600' },
    { age: '13-15', label: '13-15 ans', color: 'bg-green-500 hover:bg-green-600' }
  ];

  // Organiser les catégories en colonnes (comme Storyplay'r)
  const categoriesPerColumn = Math.ceil(categories.length / 3);
  const categoryColumns = [
    categories.slice(0, categoriesPerColumn),
    categories.slice(categoriesPerColumn, categoriesPerColumn * 2),
    categories.slice(categoriesPerColumn * 2)
  ];

  const handleCategoryClick = (categoryId) => {
    onCategorySelect(categoryId);
    setIsOpen(false);
  };

  const handleAgeClick = (age) => {
    const ageValue = age.includes('-') ? age.split('-')[0] : age;
    onAgeSelect(ageValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-neutral-100 hover:text-white hover:bg-neutral-800/80 px-4 py-2 rounded-lg transition-colors font-medium"
      >
        <BookIcon className="w-5 h-5" />
        <span>Bibliothèque</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[90vw] max-w-5xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-neutral-200"
            >
              {/* Header avec titre et boutons d'âge */}
              <div className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-neutral-900">Bibliothèque</h2>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700 border border-neutral-200">
                      <GlobeIcon className="w-4 h-4" />
                      <span>Catalogue anglais</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700 border border-neutral-200">
                      <TrophyIcon className="w-4 h-4" />
                      <span>Prix</span>
                    </button>
                  </div>
                </div>

                {/* Boutons d'âge */}
                <div className="flex gap-3">
                  {ageButtons.map((ageBtn) => {
                    const ageValue = ageBtn.age.includes('-') ? ageBtn.age.split('-')[0] : ageBtn.age;
                    const isSelected = selectedAge === ageValue;
                    return (
                      <button
                        key={ageBtn.age}
                        onClick={() => handleAgeClick(ageBtn.age)}
                        className={`px-4 py-2 rounded-lg text-white font-semibold text-sm transition-all ${
                          isSelected ? ageBtn.color + ' ring-2 ring-offset-2 ring-offset-white ring-neutral-900' : ageBtn.color
                        }`}
                      >
                        {ageBtn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contenu : Catégories en colonnes */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Colonne 1 */}
                  <div className="space-y-0">
                    <Link
                      to="/"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 transition-colors mb-4 font-semibold text-neutral-900"
                    >
                      <BookIcon className="w-5 h-5" />
                      <span>Accueil</span>
                    </Link>
                    {categoryColumns[0]?.map((category, index) => (
                      <div key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(String(category.id))}
                          className={`w-full flex items-center gap-2 text-left p-3 rounded-lg transition-colors ${
                            selectedCategory === String(category.id)
                              ? 'bg-red-50 text-red-700 font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <CategoryIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{category.name}</span>
                        </button>
                        {index < categoryColumns[0].length - 1 && (
                          <div className="h-px bg-neutral-200 my-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Colonne 2 */}
                  <div className="space-y-0">
                    {categoryColumns[1]?.map((category, index) => (
                      <div key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(String(category.id))}
                          className={`w-full flex items-center gap-2 text-left p-3 rounded-lg transition-colors ${
                            selectedCategory === String(category.id)
                              ? 'bg-red-50 text-red-700 font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <CategoryIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{category.name}</span>
                        </button>
                        {index < categoryColumns[1].length - 1 && (
                          <div className="h-px bg-neutral-200 my-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Colonne 3 */}
                  <div className="space-y-0">
                    {categoryColumns[2]?.map((category, index) => (
                      <div key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(String(category.id))}
                          className={`w-full flex items-center gap-2 text-left p-3 rounded-lg transition-colors ${
                            selectedCategory === String(category.id)
                              ? 'bg-red-50 text-red-700 font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <CategoryIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{category.name}</span>
                        </button>
                        {index < categoryColumns[2].length - 1 && (
                          <div className="h-px bg-neutral-200 my-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Colonne 4 : Âges */}
                  <div className="space-y-0 border-l border-neutral-200 pl-6">
                    <h3 className="font-semibold text-neutral-900 mb-4 text-sm uppercase tracking-wide">Âges</h3>
                    {ageButtons.map((ageBtn) => {
                      const ageValue = ageBtn.age.includes('-') ? ageBtn.age.split('-')[0] : ageBtn.age;
                      const isSelected = selectedAge === ageValue;
                      return (
                        <div key={ageBtn.age}>
                          <button
                            onClick={() => handleAgeClick(ageBtn.age)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-red-50 text-red-700 font-semibold'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            {ageBtn.label}
                          </button>
                          {ageBtn.age !== ageButtons[ageButtons.length - 1].age && (
                            <div className="h-px bg-neutral-200 my-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
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

