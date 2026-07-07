import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, TwitterIcon, YouTubeIcon, LinkedInIcon } from '../../components/Icons';
import LanguageSelector from '../../components/LanguageSelector';

export default function FooterSection({ t }) {
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-surface-100 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="lg:w-1/4">
            <div className="mb-6">
              <Logo size="small" />
            </div>
            <p className="text-sm text-surface-500 mb-8 max-w-xs leading-relaxed">
              Des histoires qui éveillent l'imagination et construisent l'avenir.
            </p>
            
            <div className="flex items-center gap-4">
              <a href="https://tiktok.com" className="text-surface-400 hover:text-surface-900 transition-colors">
                 {/* Fallback for TikTok */}
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.39-3.16-3.8-5.46-.4-2.08-.04-4.26 1.03-6.06 1.09-1.83 2.92-3.15 4.9-3.66.86-.22 1.74-.3 2.62-.3v4.05c-.86.06-1.74.34-2.42.89-.91.73-1.44 1.88-1.4 3.07.03 1.25.68 2.45 1.73 3.1 1.02.63 2.29.74 3.42.34 1.19-.4 2.11-1.42 2.38-2.65.17-.76.19-1.55.19-2.33V.02h-1.38z"/></svg>
              </a>
              <a href="https://instagram.com" className="text-surface-400 hover:text-surface-900 transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" className="text-surface-400 hover:text-surface-900 transition-colors">
                <YouTubeIcon className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" className="text-surface-400 hover:text-surface-900 transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links grid */}
          <div className="lg:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-surface-900 mb-4">Produit</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><Link to="/stories" className="hover:text-foreground-600 transition-colors">Bibliothèque</Link></li>
                <li><Link to="/features" className="hover:text-foreground-600 transition-colors">IA Créative</Link></li>
                <li><Link to="/features" className="hover:text-foreground-600 transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/abonnements" className="hover:text-foreground-600 transition-colors">Tarifs</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-surface-900 mb-4">Ressources</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Blog</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Conseils Parents</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Centre d'aide</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Contact</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-surface-900 mb-4">Entreprise</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">À propos</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Presse</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Carrières</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Partenaires</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-surface-900 mb-4">Légal</h4>
              <ul className="space-y-3 text-sm text-surface-500 font-medium">
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Confidentialité</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Conditions d'utilisation</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">CGU</span></li>
                <li><span className="cursor-pointer hover:text-foreground-600 transition-colors">Politique cookies</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-surface-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto flex justify-center md:justify-start">
            <LanguageSelector />
          </div>
          <div className="text-center md:text-right text-xs text-surface-500 font-medium">
            <p>© {new Date().getFullYear()} HKids.</p>
            <p>Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
