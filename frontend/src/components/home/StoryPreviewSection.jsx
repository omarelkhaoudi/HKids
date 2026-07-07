import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, StarIcon } from '../../components/Icons';

export default function StoryPreviewSection({ books, getImageUrl }) {
  if (!books || books.length === 0) return null;

  const displayBooks = books.slice(0, 4); // Show top 4 for the popular stories section

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="popular-stories" className="bg-white py-12 md:py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900">
              Histoires populaires
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link 
              to="/stories"
              className="text-foreground-600 font-bold hover:text-foreground-700 flex items-center gap-1 text-sm sm:text-base transition-colors"
            >
              Voir toute la bibliothèque <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {displayBooks.map((book) => (
            <motion.div
              key={book.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="h-full"
            >
              <Link to={`/book-details/${book.id}`} className="block h-full">
                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.1)] border border-surface-100 transition-all duration-300 h-full flex flex-col group">
                  
                  {/* Image container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
                    {book.cover_image ? (
                      <img
                        src={getImageUrl(book.cover_image)}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* Text content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-surface-900 mb-1 line-clamp-1 group-hover:text-foreground-600 transition-colors">
                      {book.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm font-medium text-surface-500">
                        {book.category_name || "Aventure"}
                      </span>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-xs font-bold text-yellow-700">4.8</span>
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
