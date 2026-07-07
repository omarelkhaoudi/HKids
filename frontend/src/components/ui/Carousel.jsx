import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export function Carousel({ children, gap = 'gap-4', className = '' }) {
 const containerRef = useRef(null);

 const scrollLeft = () => {
 if (containerRef.current) {
 containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
 }
 };

 const scrollRight = () => {
 if (containerRef.current) {
 containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
 }
 };

 return (
 <div className={`relative group ${className}`}>
 {/* Navigation Buttons (visible on desktop hover) */}
 <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={scrollLeft}
 className="p-3 rounded-full bg-card/90 /90 shadow-large text-foreground-secondary hover:scale-110 transition-transform backdrop-blur"
 aria-label="Precedent"
 >
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
 </svg>
 </button>
 </div>

 <div 
 ref={containerRef}
 className={`flex overflow-x-auto snap-x snap-mandatory hide-scrollbar ${gap} pb-8 pt-4 px-2`}
 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
 >
 {React.Children.map(children, (child) => (
 <div className="snap-start shrink-0">
 {child}
 </div>
 ))}
 </div>

 <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={scrollRight}
 className="p-3 rounded-full bg-card/90 /90 shadow-large text-foreground-secondary hover:scale-110 transition-transform backdrop-blur"
 aria-label="Suivant"
 >
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
 </svg>
 </button>
 </div>
 </div>
 );
}
