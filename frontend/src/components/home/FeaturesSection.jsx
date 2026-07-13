import { motion } from 'framer-motion';
import { BRAND_FEATURE_TILES, BRAND_TONES } from '../../constants/brandTheme';

export default function FeaturesSection({ t }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="bg-background py-12 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="brand-section-title">
            Pourquoi les parents et les enfants adorent HKids
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {BRAND_FEATURE_TILES.map((feature, i) => {
            const tone = BRAND_TONES[feature.tone];
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="brand-surface-card flex items-start gap-4 p-5 hover:shadow-medium transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${tone.bgColor} ${tone.color} flex items-center justify-center flex-shrink-0 text-2xl shadow-sm border ${tone.borderColor}`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
