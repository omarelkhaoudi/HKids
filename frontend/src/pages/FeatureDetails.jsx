import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AudioIcon, BookIcon, MicrophoneIcon, ChevronLeftIcon, 
  StarIcon, VolumeIcon, FontIcon, RulerIcon, SparklesIcon 
} from '../components/Icons';
import { Logo } from '../components/Logo';

const features = {
  'versions-audio': {
    icon: AudioIcon,
    title: 'Des versions audio',
    subtitle: 'Écoutez et lisez en même temps',
    description: 'Les histoires ont des versions audio enregistrées par des conteurs professionnels. La fonction karaoké permet d\'afficher les mots en surbrillance en synchronisation avec la narration.',
    benefits: [
      'Narration professionnelle par des conteurs expérimentés',
      'Synchronisation parfaite entre l\'audio et le texte',
      'Fonction karaoké avec surbrillance des mots',
      'Aide à la compréhension et à la prononciation',
      'Accessible pour les enfants ayant des difficultés de lecture'
    ],
    color: 'from-red-500 to-pink-500',
    bgColor: 'from-red-50 to-pink-50'
  },
  'aide-lecture': {
    icon: BookIcon,
    title: 'Aide à la lecture',
    subtitle: 'Personnalisez votre expérience de lecture',
    description: 'Les textes peuvent s\'afficher dans des polices, tailles, et couleurs personnalisables. Syllabisation et aide à la prononciation par synthèse vocale pour accompagner tous les enfants dans leur apprentissage.',
    benefits: [
      'Polices adaptées (Arial, Times, Comic Sans, Open Dyslexic)',
      'Taille de texte ajustable selon les besoins',
      'Schémas de couleurs personnalisables (standard, sépia, sombre, contraste élevé)',
      'Syllabisation automatique pour faciliter la lecture',
      'Espacement des lignes et des mots ajustable',
      'Synthèse vocale pour l\'aide à la prononciation'
    ],
    color: 'from-red-500 to-pink-500',
    bgColor: 'from-red-50 to-pink-50'
  },
  'enregistrer-voix': {
    icon: MicrophoneIcon,
    title: 'Enregistrer sa voix',
    subtitle: 'Devenez le narrateur de vos histoires',
    description: 'Adulte ou enfant, enregistrez votre voix et devenez le narrateur de nos histoires. Partagez vos moments de lecture en famille et créez des souvenirs inoubliables.',
    benefits: [
      'Enregistrement vocal simple et intuitif',
      'Narration personnalisée pour chaque histoire',
      'Partage avec la famille et les amis',
      'Création de souvenirs audio précieux',
      'Encouragement de la participation active des enfants'
    ],
    color: 'from-red-500 to-pink-500',
    bgColor: 'from-red-50 to-pink-50',
    comingSoon: true
  }
};

function FeatureDetails() {
  const { featureId } = useParams();
  const feature = features[featureId];

  if (!feature) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Fonctionnalité non trouvée</h1>
          <Link to="/" className="text-red-600 hover:underline">
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  const IconComponent = feature.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 shadow-md bg-neutral-900/95 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          <Link to="/" className="text-neutral-100 hover:text-white font-medium flex items-center gap-2 transition-colors">
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section avec étoiles animées */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 py-12 md:py-16">
        {/* Étoiles animées en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <StarIcon className="w-6 h-6" />
            </motion.div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 mb-6 shadow-2xl">
              <IconComponent className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
              <span className="text-red-600 drop-shadow-lg">{feature.title}</span>
            </h1>
            <p className="text-xl sm:text-2xl text-neutral-700 font-medium">
              {feature.subtitle}
            </p>
            {feature.comingSoon && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-sm font-semibold shadow-lg"
              >
                Bientôt disponible
              </motion.span>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 md:p-12 shadow-xl border-2 border-red-100 mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4 flex items-center gap-3">
              <StarIcon className="w-8 h-8 text-yellow-500" />
              À propos
            </h2>
            <p className="text-lg text-neutral-700 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-neutral-200"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-8 flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-red-600" />
              Avantages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feature.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-100"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-neutral-700 font-medium leading-relaxed">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Retour à l'accueil
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default FeatureDetails;

