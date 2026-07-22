import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useModalA11y } from '../../hooks/useModalA11y';
import { getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import KidsButton from '../kids/KidsButton';

const ROLES = [
  {
    id: 'child',
    emoji: '👶',
    labelKey: 'landingRoleChild',
    hintKey: 'landingRoleChildHint',
    ariaKey: 'landingRoleChildAria',
    intentBodyKey: 'landingRoleIntentBodyChild',
    variant: 'primary',
    emphasis: true,
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    labelKey: 'landingRoleParent',
    hintKey: 'landingRoleParentHint',
    ariaKey: 'landingRoleParentAria',
    intentBodyKey: 'landingRoleIntentBodyParent',
    variant: 'glass',
    emphasis: false,
  },
  {
    id: 'admin',
    emoji: '🛠',
    labelKey: 'landingRoleAdmin',
    hintKey: 'landingRoleAdminHint',
    ariaKey: 'landingRoleAdminAria',
    intentBodyKey: 'landingRoleIntentBodyAdmin',
    variant: 'ghost',
    emphasis: false,
  },
];

function resolveDestination(roleId, user) {
  if (roleId === 'child') {
    if (user?.role === 'kid') return '/kids';
    return '/welcome';
  }
  if (roleId === 'parent') {
    if (user?.role === 'parent' || user?.role === 'admin') return '/parent';
    return '/parent/login';
  }
  if (roleId === 'admin') {
    if (user?.role === 'admin') return '/admin';
    return '/admin/login';
  }
  return '/';
}

function needsIntentStep(roleId, user) {
  if (roleId === 'child') return false;
  if (roleId === 'parent') return !user || (user.role !== 'parent' && user.role !== 'admin');
  if (roleId === 'admin') return !user || user.role !== 'admin';
  return false;
}

export function LandingRoleSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [pendingRole, setPendingRole] = useState(null);
  const intentRef = useRef(null);
  const dismissIntent = useCallback(() => setPendingRole(null), []);

  const navigateForRole = useCallback((roleId) => {
    navigate(resolveDestination(roleId, user), { replace: false });
  }, [navigate, user]);

  const handleRolePress = (role) => {
    if (needsIntentStep(role.id, user)) {
      setPendingRole(role);
      return;
    }
    navigateForRole(role.id);
  };

  const pendingRoleConfig = ROLES.find((role) => role.id === pendingRole?.id);
  useModalA11y(Boolean(pendingRole), dismissIntent, intentRef);

  return (
    <nav
      className="landing-role-selector mb-space-24"
      aria-label={t('landingRoleNavAria')}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <p className="kids-type-meta text-foreground-muted mb-space-4 text-center lg:text-start">
        {t('landingChooseSpace')}
      </p>
      <p className="text-sm text-foreground-secondary mb-space-12 text-center lg:text-start max-w-xl">
        {t('landingRoleSubtitle')}
      </p>

      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-start justify-center lg:justify-start gap-space-10 sm:gap-space-12"
        role="list"
      >
        {ROLES.map((role) => (
          <div
            key={role.id}
            role="listitem"
            className="w-full sm:w-auto sm:flex-1 sm:max-w-[12rem]"
          >
            <KidsButton
              variant={role.variant}
              size={role.emphasis ? 'md' : 'sm'}
              onClick={() => handleRolePress(role)}
              aria-label={t(role.ariaKey)}
              aria-describedby={`landing-role-hint-${role.id}`}
              className={[
                'group landing-role-btn w-full flex-col !gap-space-4 !py-space-16',
                role.emphasis ? 'landing-role-btn--child sm:shadow-[0_20px_36px_-22px_rgba(36,50,74,0.32)]' : '',
                role.id === 'admin'
                  ? '!bg-[#faf8f5]/88 !border !border-border/70 !text-foreground-secondary hover:!bg-white/90'
                  : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="landing-role-icon shrink-0" aria-hidden="true">
                {role.emoji}
              </span>
              <span className="font-bold">{t(role.labelKey)}</span>
            </KidsButton>
            <p
              id={`landing-role-hint-${role.id}`}
              className="mt-space-8 text-xs text-foreground-muted text-center lg:text-start leading-snug px-space-4"
            >
              {t(role.hintKey)}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {pendingRoleConfig && (
          <motion.div
            ref={intentRef}
            {...getMotionProps(reducedMotion, kidsCardAppear)}
            className="mt-space-16 rounded-[1.75rem] border border-primary-100/80 bg-white/85 backdrop-blur-md p-space-20 shadow-[0_18px_40px_-28px_rgba(36,50,74,0.22)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-role-intent-title"
            aria-describedby="landing-role-intent-body"
          >
            <h3 id="landing-role-intent-title" className="kids-type-h2 mb-space-8">
              {t('landingRoleIntentTitle')}
            </h3>
            <p id="landing-role-intent-body" className="kids-type-body text-foreground-secondary mb-space-20">
              {t(pendingRoleConfig.intentBodyKey)}
            </p>
            <div className="flex flex-col sm:flex-row gap-space-10">
              <KidsButton
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  navigateForRole(pendingRoleConfig.id);
                  setPendingRole(null);
                }}
              >
                {t('landingRoleIntentContinue')}
              </KidsButton>
              <KidsButton
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setPendingRole(null)}
              >
                {t('landingRoleIntentCancel')}
              </KidsButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default LandingRoleSelector;
