import {useParams, Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {
 AudioIcon, BookIcon, MicrophoneIcon, ChevronLeftIcon,
 StarIcon, VolumeIcon, FontIcon, RulerIcon, SparklesIcon
} from '../components/Icons';
import {Logo} from '../components/Logo';
import {useLanguage} from '../context/LanguageContext';

const features = {
 'versions-audio': {
 icon: AudioIcon,
 title: 'featureAudioTitle',
 subtitle: 'featureAudioSubtitle',
 description: 'featureAudioDesc',
 benefits: [
 'featureAudioB1',
 'featureAudioB2',
 'featureAudioB3',
 'featureAudioB4',
 'featureAudioB5'
 ],
 color: 'from-primary-500 to-secondary-500',
 bgColor: 'from-primary-50 to-secondary-50'
},
 'aide-lecture': {
 icon: BookIcon,
 title: 'featureReadingTitle',
 subtitle: 'featureReadingSubtitle',
 description: 'featureReadingDesc',
 benefits: [
 'featureReadingB1',
 'featureReadingB2',
 'featureReadingB3',
 'featureReadingB4',
 'featureReadingB5',
 'featureReadingB6'
 ],
 color: 'from-primary-500 to-secondary-500',
 bgColor: 'from-primary-50 to-secondary-50'
},
 'enregistrer-voix': {
 icon: MicrophoneIcon,
 title: 'featureVoiceTitle',
 subtitle: 'featureVoiceSubtitle',
 description: 'featureVoiceDesc',
 benefits: [
 'featureVoiceB1',
 'featureVoiceB2',
 'featureVoiceB3',
 'featureVoiceB4',
 'featureVoiceB5'
 ],
 color: 'from-primary-500 to-secondary-500',
 bgColor: 'from-primary-50 to-secondary-50',
 comingSoon: true
}
};

function FeatureDetails() {
 const {featureId} = useParams();
 const { t } = useLanguage();
 const feature = features[featureId];

 if (!feature) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-hkids-brown-soft">
 <motion.div
 initial={{opacity: 0, y: 20}}
 animate={{opacity: 1, y: 0}}
 className="text-center"
 >
 <h1 className="text-3xl font-bold text-foreground mb-4">{t('featureNotFound')}</h1>
 <Link to="/" className="text-foreground-600 hover:underline">
 {t('featureBackHome')}
 </Link>
 </motion.div>
 </div>
 );
}

 const IconComponent = feature.icon;

 return (
 <div className="min-h-screen bg-card">
 {/* Header */}
 <motion.header
 initial={{y: -100, opacity: 0}}
 animate={{y: 0, opacity: 1}}
 transition={{duration: 0.5}}
 className="sticky top-0 z-50 shadow-md bg-surface-900/95 backdrop-blur-md"
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
 <Link to="/" className="flex items-center">
 <Logo size="default" />
 </Link>
 <Link to="/" className="text-surface-100 hover:text-white font-medium flex items-center gap-2 transition-colors">
 <ChevronLeftIcon className="w-4 h-4" />
 <span className="hidden sm:inline">{t('back')}</span>
 </Link>
 </div>
 </motion.header>

 {/* Hero Section avec étoiles animées */}
 <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 md:py-16">
 {/* Étoiles animées en arrière-plan */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 {Array.from({length: 20}).map((_, i) => (
 <motion.div
 key={i}
 className="absolute text-hkids-brown"
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
 initial={{opacity: 0, y: 20}}
 animate={{opacity: 1, y: 0}}
 transition={{duration: 0.6}}
 className="text-center mb-12"
 >
 <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-6 shadow-2xl">
 <IconComponent className="w-12 h-12 text-white" />
 </div>
 <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
 <span className="text-foreground-600 drop-shadow-lg">{t(feature.title)}</span>
 </h1>
 <p className="text-xl sm:text-2xl text-foreground-secondary font-medium">
 {t(feature.subtitle)}
 </p>
 {feature.comingSoon && (
 <motion.span
 initial={{scale: 0}}
 animate={{scale: 1}}
 transition={{delay: 0.3, type: 'spring'}}
 className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-semibold shadow-lg"
 >
 {t('comingSoon')}
 </motion.span>
 )}
 </motion.div>
 </div>
 </section>

 {/* Content */}
 <section className="bg-card py-16 md:py-24">
 <div className="max-w-4xl mx-auto px-4 sm:px-6">
 <motion.div
 initial={{opacity: 0, y: 20}}
 whileInView={{opacity: 1, y: 0}}
 viewport={{once: true}}
 transition={{duration: 0.6}}
 className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 md:p-12 shadow-xl border-2 border-primary-100 mb-12"
 >
 <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
 <StarIcon className="w-8 h-8 text-hkids-brown" />
 {t('featureAbout')}
 </h2>
 <p className="text-lg text-foreground-secondary leading-relaxed">
 {t(feature.description)}
 </p>
 </motion.div>

 <motion.div
 initial={{opacity: 0, y: 20}}
 whileInView={{opacity: 1, y: 0}}
 viewport={{once: true}}
 transition={{duration: 0.6, delay: 0.2}}
 className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border-2 border-border"
 >
 <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
 <SparklesIcon className="w-8 h-8 text-foreground-600" />
 {t('featureBenefits')}
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {feature.benefits.map((benefit, index) => (
 <motion.div
 key={index}
 initial={{opacity: 0, x: -20}}
 whileInView={{opacity: 1, x: 0}}
 viewport={{once: true}}
 transition={{delay: index * 0.1}}
 className="flex items-start gap-4 p-4 rounded-3xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100"
 >
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
 <span className="text-white font-bold text-sm">{index + 1}</span>
 </div>
 <p className="text-foreground-secondary font-medium leading-relaxed">{t(benefit)}</p>
 </motion.div>
 ))}
 </div>
 </motion.div>

 <motion.div
 initial={{opacity: 0, y: 20}}
 whileInView={{opacity: 1, y: 0}}
 viewport={{once: true}}
 transition={{duration: 0.6, delay: 0.4}}
 className="mt-12 text-center"
 >
 <Link to="/">
 <motion.button
 whileHover={{scale: 1.05}}
 whileTap={{scale: 0.95}}
 className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
 >
 {t('featureBackHome')}
 </motion.button>
 </Link>
 </motion.div>
 </div>
 </section>
 </div>
 );
}

export default FeatureDetails;
