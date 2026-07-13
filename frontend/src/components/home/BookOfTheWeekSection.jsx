import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { StarIcon, ClockIcon, BrainIcon } from '../../components/Icons';

export default function BookOfTheWeekSection({ book, t, getImageUrl, imageError, setImageError }) {
  if (!book) return null;

  return (
    <section className="bg-background py-12 md:py-20 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-br from-primary-50 via-secondary-50/60 to-accent-50/40 rounded-[2.5rem] p-8 md:p-12 lg:p-16 shadow-soft border border-primary-100 relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-200/25 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-5 flex flex-col items-start text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-bold mb-6">
                  <StarIcon className="w-4 h-4 text-accent-500" />
                  Le livre de la semaine
                </div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                  {book.title}
                </h2>
                
                {book.description && (
                  <p className="text-lg text-surface-600 mb-8 leading-relaxed">
                    {book.description.length > 150 
                      ? `${book.description.substring(0, 150)}...` 
                      : book.description}
                  </p>
                )}

                <Link to={`/book-details/${book.id}`} className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white rounded-full font-bold text-lg shadow-[0_8px_20px_-6px_rgba(123,62,184,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(123,62,184,0.6)] transition-all flex items-center justify-center gap-2"
                  >
                    Lire maintenant →
                  </motion.button>
                </Link>
              </div>

              {/* Middle Column: The Image Wrapper */}
              <div className="lg:col-span-4 flex justify-center">
                <motion.div 
                  whileHover={{ scale: 1.02, rotateZ: 1 }}
                  className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-20"
                >
                  <div className="absolute top-4 right-4 z-10 px-4 py-1.5 bg-primary-600 text-white text-sm font-bold rounded-full shadow-lg">
                    Nouveau
                  </div>
                  {book.cover_image && !imageError ? (
                    <img
                      src={getImageUrl(book.cover_image)}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface-200 to-surface-300 flex items-center justify-center">
                      <span className="text-surface-500 font-bold">Image non disponible</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                </motion.div>
              </div>

              {/* Right Column: Stats */}
              <div className="lg:col-span-3 flex flex-col gap-6 pl-0 lg:pl-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Âge recommandé</div>
                    <div className="text-surface-900 font-bold text-lg">
                      {book.age_group_min !== undefined && book.age_group_max !== undefined 
                        ? `${book.age_group_min}-${book.age_group_max} ans` 
                        : "Pour tous"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-surface-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Durée de lecture</div>
                    <div className="text-surface-900 font-bold text-lg">
                      {book.page_count ? `${Math.ceil(book.page_count * 0.5)} min` : "5 min"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <BrainIcon className="w-6 h-6 text-surface-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Valeur éducative</div>
                    <div className="text-surface-900 font-bold text-lg">
                      {book.category_name || "Imagination"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-4 border-t border-surface-200/50">
                  <div className="mt-1 flex-shrink-0">
                    <StarIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-surface-900 font-bold text-xl">4.9</span>
                      <span className="text-surface-500 font-medium text-sm">(1.2K avis)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
