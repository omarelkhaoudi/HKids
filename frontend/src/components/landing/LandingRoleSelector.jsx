import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import KidsButton from '../kids/KidsButton';

const ROLES = [
  {
    id: 'child',
    emoji: '👶',
    labelKey: 'landingRoleChild',
    ariaKey: 'landingRoleChildAria',
    path: '/kids',
    variant: 'primary',
    emphasis: true,
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    labelKey: 'landingRoleParent',
    ariaKey: 'landingRoleParentAria',
    path: '/parent',
    variant: 'glass',
    emphasis: false,
  },
  {
    id: 'admin',
    emoji: '🛠',
    labelKey: 'landingRoleAdmin',
    ariaKey: 'landingRoleAdminAria',
    path: '/admin',
    variant: 'ghost',
    emphasis: false,
  },
];

export function LandingRoleSelector() {
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();

  return (
    <nav
      className="landing-role-selector mb-space-24"
      aria-label={t('landingRoleNavAria')}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <p className="kids-type-meta text-foreground-muted mb-space-12 text-center lg:text-start">
        {t('landingChooseSpace')}
      </p>
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-space-10 sm:gap-space-12"
        role="list"
      >
        {ROLES.map((role) => (
          <div key={role.id} role="listitem" className="w-full sm:w-auto sm:flex-1 sm:max-w-[11.5rem]">
            <KidsButton
              variant={role.variant}
              size={role.emphasis ? 'md' : 'sm'}
              onClick={() => navigate(role.path)}
              aria-label={t(role.ariaKey)}
              className={[
                'group landing-role-btn w-full',
                role.emphasis ? 'landing-role-btn--child sm:shadow-[0_20px_36px_-22px_rgba(36,50,74,0.32)]' : '',
                role.id === 'admin'
                  ? '!bg-[#faf8f5]/88 !border !border-border/70 !text-foreground-secondary hover:!bg-white/90'
                  : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="landing-role-icon me-space-8 shrink-0" aria-hidden="true">
                {role.emoji}
              </span>
              <span>{t(role.labelKey)}</span>
            </KidsButton>
          </div>
        ))}
      </div>
    </nav>
  );
}

export default LandingRoleSelector;
