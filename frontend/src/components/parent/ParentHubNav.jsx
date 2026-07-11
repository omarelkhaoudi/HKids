import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { BookIcon, AudioIcon, SettingsIcon } from '../Icons';

const LINKS = [
  { id: 'profiles', path: '/parent/profiles', labelKey: 'parentNavProfiles', descKey: 'parentNavProfilesDesc', icon: BookIcon, gradient: 'from-sky-500 to-cyan-500' },
  { id: 'voices', path: '/parent/voices', labelKey: 'parentNavVoices', descKey: 'parentNavVoicesDesc', icon: AudioIcon, gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'subscription', path: '/abonnements', labelKey: 'parentNavSubscription', descKey: 'parentNavSubscriptionDesc', icon: SettingsIcon, gradient: 'from-amber-500 to-orange-500' },
];

export function ParentHubNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`.trim()}>
      {LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;
        return (
          <motion.button
            key={link.id}
            type="button"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(link.path)}
            className="text-left"
            aria-current={isActive ? 'page' : undefined}
          >
            <Card className={`p-5 bg-gradient-to-br ${link.gradient} text-white border-none shadow-lg h-full ${isActive ? 'ring-4 ring-white/50' : ''}`}>
              <Icon className="w-8 h-8 mb-3 opacity-90" />
              <p className="font-black text-lg">{t(link.labelKey)}</p>
              <p className="text-sm text-white/80 font-medium mt-1">{t(link.descKey)}</p>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}

export default ParentHubNav;
