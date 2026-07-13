import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const BookCard = memo(function BookCard({
 book, 
 onClick, 
 progress = null, 
 isNew = false,
 isRecommended = false,
 className = ''
}) {
 const reducedMotion = useReducedMotion();
 const hoverMotion = reducedMotion ? {} : { whileHover: { y: -8, scale: 1.02 } };

 return (
 <motion.div
 onClick={onClick}
 {...hoverMotion}
 className={`group relative flex flex-col w-[160px] sm:w-[180px] lg:w-[220px] rounded-3xl overflow-hidden cursor-pointer bg-surface-secondary shadow-soft hover:shadow-floating transition-all ${className}`}
 >
 <div className="relative aspect-[3/4] overflow-hidden rounded-t-3xl bg-surface-200">
 <img
 src={book.cover_image_url || '/placeholder.png'}
 alt={book.title}
 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
 loading="lazy"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

 {/* Badges */}
 <div className="absolute top-3 left-3 flex flex-col gap-2">
 {isNew && <Badge variant="primary" size="sm">Nouveau</Badge>}
 {isRecommended && <Badge variant="premium" size="sm">Recommande</Badge>}
 </div>

 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
 <button 
 className="p-2 rounded-full bg-card/20 backdrop-blur-md text-white hover:bg-card/40 transition-colors"
 aria-label="Favori"
 onClick={(e) => {
 e.stopPropagation();
 // handle favorite
 }}
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
 </svg>
 </button>
 </div>

 {/* Play Button */}
 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
 <div className="w-14 h-14 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-glow pl-1">
 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
 <path d="M8 5v14l11-7z"/>
 </svg>
 </div>
 </div>
 </div>

 {progress !== null && (
 <div className="h-1.5 w-full bg-surface-200">
 <div 
 className="h-full bg-primary-500 rounded-r-full" 
 style={{ width: `${Math.max(5, progress)}%` }}
 />
 </div>
 )}

 <div className="p-4 flex flex-col grow bg-card">
 <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-foreground-500 transition-colors">
 {book.title}
 </h3>
 <p className="text-sm text-foreground-muted mt-1 line-clamp-1">
 {book.age_group} ans • {book.duration_minutes || '?'} min
 </p>
 </div>
 </motion.div>
 );
});
