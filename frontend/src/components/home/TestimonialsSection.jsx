import { motion } from 'framer-motion';
import { ChevronRightIcon } from '../../components/Icons'; // Use as left/right arrows if needed

export default function TestimonialsSection({ t }) {
  const testimonials = [
    {
      quote: "Des histoires magnifiques qui captivent mon fils de 4 ans. L'IA personnalise vraiment les histoires !",
      author: "Sophie M.",
      role: "Maman de Léo, 4 ans",
      avatar: "👩", // Emoji as placeholder for avatar
      rating: 5
    },
    {
      quote: "Une application incroyable pour développer l'imagination et les valeurs chez les enfants.",
      author: "Karim B.",
      role: "Papa de Inès, 6 ans",
      avatar: "👨",
      rating: 5
    },
    {
      quote: "Enfin une app éducative sans publicité. Je la recommande à 100% !",
      author: "Nadia E.",
      role: "Maman de Youssef, 7 ans",
      avatar: "👩🏽",
      rating: 4 // Represented as 4 or 5 stars
    },
    {
      quote: "Mon fils attend chaque soir sa nouvelle histoire. Merci HKids !",
      author: "Thomas L.",
      role: "Papa de Lucas, 5 ans",
      avatar: "👨🏼",
      rating: 5
    }
  ];

  return (
    <section className="bg-white py-12 md:py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900">
            Ils nous font confiance
          </h2>
        </motion.div>

        <div className="relative">
          {/* Scrollable container for testimonials, hiding scrollbar */}
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 pt-2 px-2 -mx-2 snap-x snap-mandatory hide-scrollbar">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="snap-start shrink-0 w-[85vw] sm:w-[350px] md:w-[300px] lg:w-[280px] bg-white rounded-2xl p-6 border border-surface-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
              >
                <p className="text-surface-700 font-medium mb-6 leading-relaxed italic relative">
                  <span className="text-4xl text-primary-200 absolute -top-4 -left-2 font-serif opacity-50">"</span>
                  <span className="relative z-10">{item.quote}</span>
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-xl flex-shrink-0">
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-surface-900 text-sm truncate">{item.author}</h4>
                    <p className="text-xs text-surface-500 truncate">{item.role}</p>
                  </div>
                  <div className="flex text-yellow-400 text-xs">
                    {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Fading edges to indicate scrollability on desktop */}
          <div className="hidden md:block absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
}
