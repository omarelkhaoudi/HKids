import { motion } from 'framer-motion';
import { ChevronRightIcon } from '../../components/Icons';

export default function BrowseByAgeSection({ t, selectedAge, setSelectedAge }) {
  const ageGroups = [
    { 
      label: '3-5 ans', 
      age: '3-5', 
      title: 'Premières découvertes',
      books: '12 livres',
      image: '/enfant3ans.webp', // Using existing assets
      bgColor: 'bg-[#fffdf2]',
      tagColor: 'bg-yellow-100 text-yellow-700',
      iconFallback: '🧸'
    },
    { 
      label: '6-8 ans', 
      age: '6-8', 
      title: 'Histoires éducatives',
      books: '28 livres',
      image: encodeURI('/enfant 5 8ans.webp'),
      bgColor: 'bg-[#f4fbf4]',
      tagColor: 'bg-green-100 text-green-700',
      iconFallback: '🦖'
    },
    { 
      label: '9-12 ans', 
      age: '9-12', 
      title: 'Aventures & valeurs',
      books: '35 livres',
      image: '/enfant10ans.webp',
      bgColor: 'bg-[#f2f6ff]',
      tagColor: 'bg-blue-100 text-blue-700',
      iconFallback: '🦊'
    },
    { 
      label: 'Pour tous', 
      age: '', 
      title: 'Toute la famille',
      books: 'Explorez',
      image: '/enfant10ans.webp', // Fallback or reuse
      bgColor: 'bg-[#fcf2fa]',
      tagColor: 'bg-purple-100 text-purple-700',
      iconFallback: '🦄'
    }
  ];

  return (
    <section id="books-section" className="bg-white py-12 md:py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900">
              Browse by age
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <button 
              onClick={() => {
                setSelectedAge('');
                document.getElementById('popular-stories')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 text-sm sm:text-base transition-colors"
            >
              Voir toutes les catégories <ChevronRightIcon className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {ageGroups.map((item, i) => {
            const isSelected = selectedAge === item.age;
            
            return (
              <motion.button
                key={i}
                onClick={() => {
                  setSelectedAge(item.age);
                  document.getElementById('popular-stories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full relative overflow-hidden rounded-[2rem] p-6 text-left transition-all duration-300 border-2 
                  ${isSelected ? 'border-primary-500 shadow-lg' : 'border-transparent hover:border-surface-200 hover:shadow-md'} 
                  ${item.bgColor} group h-full min-h-[160px] flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start z-10 relative">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.tagColor}`}>
                    {item.label}
                  </div>
                </div>

                <div className="mt-4 z-10 relative flex-1 flex flex-col justify-end">
                  <h3 className="text-xl font-bold text-surface-900 mb-1 leading-tight">{item.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-semibold text-surface-500">{item.books}</p>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <ChevronRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Background Character/Image representation */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 opacity-40 group-hover:opacity-80 transition-opacity duration-300">
                  {/* Using an emoji as a fallback/placeholder if image doesn't load nicely as an icon */}
                  <div className="absolute inset-0 flex items-center justify-center text-7xl select-none filter drop-shadow-md">
                    {item.iconFallback}
                  </div>
                  {/* We can keep the actual image if we want to layer it, but emojis look closer to the design's 3D assets if we don't have the exact 3D renders */}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
