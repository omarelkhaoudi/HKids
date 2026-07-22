import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { FacebookIcon, InstagramIcon, YouTubeIcon } from '../../components/Icons';
import LanguageSelector from '../../components/LanguageSelector';

export default function FooterSection({ t }) {
  return (
    <footer className="bg-background pt-16 pb-8 border-t border-border mt-auto relative z-10 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8 mb-12">
          <div className="lg:w-1/4">
            <div className="mb-6">
              <Logo size="small" />
            </div>
            <p className="text-sm text-surface-500 mb-8 max-w-xs leading-relaxed">
              {t.footerDescription}
            </p>

            <div className="flex items-center gap-4">
              <a href="https://instagram.com" className="text-surface-400 hover:text-surface-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full p-1" aria-label="Instagram">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" className="text-surface-400 hover:text-surface-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full p-1" aria-label="YouTube">
                <YouTubeIcon className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" className="text-surface-400 hover:text-surface-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full p-1" aria-label="Facebook">
                <FacebookIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="lg:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-surface-900 mb-4">{t.footerProduct}</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><Link to="/stories" className="hover:text-foreground-600 transition-colors">{t.footerLibrary}</Link></li>
                <li><Link to="/features/versions-audio" className="hover:text-foreground-600 transition-colors">{t.footerCreativeAi}</Link></li>
                <li><Link to="/features/aide-lecture" className="hover:text-foreground-600 transition-colors">{t.footerFeatures}</Link></li>
                <li><Link to="/abonnements" className="hover:text-foreground-600 transition-colors">{t.footerPricing}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-surface-900 mb-4">{t.footerResources}</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><span className="text-surface-400">{t.footerBlog} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerParentTips} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerHelpCenter} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerContact} · {t.footerComingSoon}</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-surface-900 mb-4">{t.footerCompany}</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><span className="text-surface-400">{t.footerAbout} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerPress} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerCareers} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerPartners} · {t.footerComingSoon}</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-surface-900 mb-4">{t.footerLegal}</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><span className="text-surface-400">{t.footerPrivacy} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerTerms} · {t.footerComingSoon}</span></li>
                <li><span className="text-surface-400">{t.footerGdpr} · {t.footerComingSoon}</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto flex justify-center md:justify-start">
            <LanguageSelector />
          </div>
          <div className="text-center md:text-right text-xs text-surface-500 font-medium">
            <p>© {new Date().getFullYear()} HKids.</p>
            <p>{t.footerNote}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
