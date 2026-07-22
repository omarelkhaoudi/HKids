import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsPageEnter } from '../../constants/kidsMotion';
import { PlatformShell } from '../layout/PlatformShell';
import {
  HomeIcon,
  BookIcon,
  AudioIcon,
  SparklesIcon,
  SettingsIcon,
  ClockIcon,
  CategoryIcon,
  StarIcon,
  ShieldIcon,
  XIcon,
} from '../Icons';

const SIDEBAR_LINKS = [
  { id: 'overview', path: '/parent', labelKey: 'home', icon: HomeIcon, match: (p) => p === '/parent' || p === '/parent/' },
  { id: 'profiles', path: '/parent/profiles', labelKey: 'parentNavProfiles', icon: BookIcon },
  { id: 'insights', path: '/parent#insights', labelKey: 'parentInsightsTitle', icon: SparklesIcon, hash: 'insights' },
  { id: 'screentime', path: '/parent#peace', labelKey: 'parentScreenTime', icon: ClockIcon, hash: 'peace' },
  { id: 'content', path: '/parent#peace', labelKey: 'parentReadingPermissions', icon: CategoryIcon, hash: 'peace' },
  { id: 'voices', path: '/parent/voices', labelKey: 'parentNavVoices', icon: AudioIcon },
  { id: 'stories', path: '/parent/story-studio', labelKey: 'parentNavStories', icon: StarIcon },
  { id: 'plans', path: '/abonnements', labelKey: 'parentNavSubscription', icon: ShieldIcon },
];

function NavButton({ item, active, onNavigate, t }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item)}
      className={`parent-side-link ${active ? 'is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{t(item.labelKey)}</span>
    </button>
  );
}

/**
 * Premium Parent shell — sidebar on desktop, drawer on mobile.
 * Soft canvas inspired by Kids DNA + premium calm dashboards.
 */
export function ParentPageShell({
  children,
  isRtl = false,
  className = '',
  userName = '',
  onSettings,
  onLogout,
  subscriptionLabel = null,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = (item) => {
    setDrawerOpen(false);
    if (item.hash && (location.pathname === '/parent' || location.pathname === '/parent/')) {
      const el = document.getElementById(item.hash);
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
    }
    if (item.hash && item.path.includes('#')) {
      navigate('/parent');
      window.setTimeout(() => {
        document.getElementById(item.hash)?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }, 120);
      return;
    }
    navigate(item.path.split('#')[0]);
  };

  const isActive = (item) => {
    if (item.match) return item.match(location.pathname);
    const base = item.path.split('#')[0];
    return location.pathname === base || location.pathname.startsWith(`${base}/`);
  };

  const sidebar = (
    <aside className="parent-sidebar" aria-label={t('parentHubNavLabel')}>
      <div className="parent-sidebar-brand">
        <Link to="/parent" className="inline-flex items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300">
          <Logo size="default" showText />
        </Link>
      </div>

      <nav className="parent-sidebar-nav">
        {SIDEBAR_LINKS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={isActive(item)}
            onNavigate={handleNavigate}
            t={t}
          />
        ))}
        {onSettings && (
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              onSettings();
            }}
            className="parent-side-link"
          >
            <SettingsIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t('parentSettings')}</span>
          </button>
        )}
      </nav>

      <div className="parent-sidebar-footer">
        {subscriptionLabel && (
          <div className="parent-sidebar-promo">
            <p className="parent-sidebar-promo-label">{subscriptionLabel}</p>
            <button
              type="button"
              className="parent-sidebar-promo-btn"
              onClick={() => {
                setDrawerOpen(false);
                navigate('/abonnements');
              }}
            >
              {t('parentManageSubscription')}
            </button>
          </div>
        )}
        <div className="parent-sidebar-user">
          <div className="parent-sidebar-avatar" aria-hidden="true">
            {(userName || 'P').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="parent-sidebar-user-name truncate">{userName || 'Parent'}</p>
            {onLogout && (
              <button type="button" className="parent-sidebar-logout" onClick={onLogout}>
                {t('parentLogout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <PlatformShell
      variant="platform"
      isRtl={isRtl}
      className={`parent-premium-shell parent-home-shell ${className}`}
    >
      <div className="parent-app-frame">
        <div className="parent-sidebar-desktop">{sidebar}</div>

        <div className="parent-main-column">
          <header className="parent-main-topbar">
            <button
              type="button"
              className="parent-icon-btn parent-menu-trigger"
              aria-label={t('parentHubNavLabel')}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <span className="parent-menu-bars" aria-hidden="true" />
            </button>
            <div className="parent-main-topbar-spacer" />
            {onSettings && (
              <button
                type="button"
                className="parent-icon-btn"
                aria-label={t('parentSettings')}
                onClick={onSettings}
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
            )}
          </header>

          <motion.div
            className="parent-main-scroll"
            {...getMotionProps(reducedMotion, kidsPageEnter)}
          >
            {children}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="parent-drawer-backdrop"
            {...getMotionProps(reducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
            })}
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              className="parent-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('parentHubNavLabel')}
              onClick={(e) => e.stopPropagation()}
              {...getMotionProps(reducedMotion, {
                initial: { x: isRtl ? 24 : -24, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: isRtl ? 24 : -24, opacity: 0 },
              })}
            >
              <div className="parent-drawer-head">
                <Logo size="default" showText />
                <button
                  type="button"
                  className="parent-icon-btn"
                  aria-label={t('parentCancel')}
                  onClick={() => setDrawerOpen(false)}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              {sidebar}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlatformShell>
  );
}

export default ParentPageShell;
