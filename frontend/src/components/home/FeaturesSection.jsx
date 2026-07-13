import { motion } from 'framer-motion';

export default function FeaturesSection({ t }) {
  const features = [
    {
      title: 'Histoires personnalisées',
      desc: 'Créées par IA selon l\'âge, les intérêts et les valeurs de votre enfant.',
      icon: '📖',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      borderColor: 'border-pink-50'
    },
    {
      title: 'Éducatif et bienveillant',
      desc: 'Développe l\'empathie, la confiance et l\'amour de l\'apprentissage.',
      icon: '🎓',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-50'
    },
    {
      title: 'Sans publicité',
      desc: 'Un environnement sûr et sans distraction pour apprendre en s\'amusant.',
      icon: '🛡️',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-50'
    },
    {
      title: 'Disponible partout',
      desc: 'Sur mobile, tablette et ordinateur, même hors connexion.',
      icon: '📱',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-50'
    },
    {
      title: 'Créé avec amour',
      desc: 'Conçu par des parents pour accompagner chaque famille.',
      icon: '💜',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-50'
    },
    {
      title: 'Contrôle parental',
      desc: 'Temps d\'écran, contenus autorisés et suivi de lecture depuis votre tableau de bord.',
      icon: '👨‍👩‍👧',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-50'
    }
  ];

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
    <section className="bg-white py-12 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900">
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
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-surface-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} ${feature.color} flex items-center justify-center flex-shrink-0 text-2xl shadow-sm border ${feature.borderColor}`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-surface-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
