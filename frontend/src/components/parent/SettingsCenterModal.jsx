import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, SearchIcon, XIcon, ShieldIcon, LockIcon, LanguageIcon, 
  BellIcon, BookIcon, FontIcon, VolumeIcon, SmartphoneIcon, 
  ComputerIcon, MailIcon, CheckCircleIcon, LogOutIcon, ChildIcon, 
  HistoryIcon, StarIcon, ArrowRightIcon
} from '../Icons';
import { Button, Badge, Switch, Input, Avatar } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ToastProvider';

const SECTIONS = [
  { id: 'account', label: 'Compte', icon: UserIcon },
  { id: 'profile', label: 'Profil', icon: ChildIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'privacy', label: 'Confidentialité', icon: ShieldIcon },
  { id: 'security', label: 'Sécurité', icon: LockIcon },
  { id: 'language', label: 'Langues', icon: LanguageIcon },
  { id: 'reading', label: 'Lecture', icon: FontIcon },
  { id: 'subscription', label: 'Abonnement', icon: StarIcon },
  { id: 'support', label: 'Support', icon: MailIcon },
];

export function SettingsCenterModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('account');
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef(null);
  const sectionRefs = useRef({});
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = sectionRefs.current[id];
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 40,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (!contentRef.current) return;
    const scrollPosition = contentRef.current.scrollTop + 100;
    
    let currentActive = activeSection;
    for (const section of SECTIONS) {
      const element = sectionRefs.current[section.id];
      if (element && element.offsetTop <= scrollPosition) {
        currentActive = section.id;
      }
    }
    if (currentActive !== activeSection) {
      setActiveSection(currentActive);
    }
  };

  const handleSaveSimulated = (settingName) => {
    showToast(`${settingName} mis à jour avec succès`, 'success');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-surface-900/40 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl h-full max-h-[90vh] bg-surface-50 dark:bg-surface-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 dark:border-surface-700/50"
        >
          {/* Sidebar */}
          <div className="w-full md:w-72 bg-white/50 dark:bg-surface-900/50 backdrop-blur-xl border-r border-surface-200 dark:border-surface-800 flex flex-col z-10 shrink-0">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-tight">Paramètres</h2>
                <button onClick={onClose} className="md:hidden p-2 bg-surface-100 hover:bg-surface-200 rounded-full transition-colors">
                  <XIcon className="w-5 h-5 text-surface-600" />
                </button>
              </div>
              
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-surface-400"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 custom-scrollbar">
              {SECTIONS.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase())).map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeSection === section.id 
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm' 
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-primary-500' : 'text-surface-400'}`} />
                  {section.label}
                  {activeSection === section.id && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden bg-surface-50 dark:bg-surface-900">
            {/* Header Sticky */}
            <div className="absolute top-0 inset-x-0 h-16 bg-surface-50/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50 z-10 flex items-center justify-between px-8">
              <h3 className="font-bold text-surface-900 dark:text-white capitalize">{SECTIONS.find(s => s.id === activeSection)?.label}</h3>
              <button onClick={onClose} className="hidden md:flex p-2 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 shadow-sm border border-surface-200 dark:border-surface-700 rounded-full transition-colors group">
                <XIcon className="w-5 h-5 text-surface-500 group-hover:text-surface-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
            
            {/* Scrollable Settings */}
            <div 
              ref={contentRef} 
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto pt-24 px-4 sm:px-8 md:px-12 pb-24 scroll-smooth custom-scrollbar"
            >
              <div className="max-w-3xl mx-auto space-y-16">
                
                {/* ACCOUNT */}
                <section id="account" ref={el => sectionRefs.current['account'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Compte</h2>
                    <p className="text-surface-500">Gérez vos informations personnelles et préférences de sécurité.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 md:p-8 shadow-sm border border-surface-200 dark:border-surface-700">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                      <div className="relative group cursor-pointer">
                        <Avatar src={null} fallback={user?.username?.[0] || 'P'} size="2xl" className="border-4 border-surface-50 shadow-md w-32 h-32 text-4xl" />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white text-xs font-bold uppercase tracking-wider">Modifier</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Nom complet</label>
                            <Input defaultValue={user?.username || 'Parent'} className="w-full bg-surface-50 font-medium" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Email</label>
                            <Input defaultValue={user?.email || 'parent@hkids.com'} className="w-full bg-surface-50 font-medium" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Téléphone (Optionnel)</label>
                            <Input placeholder="+33 6 12 34 56 78" className="w-full bg-surface-50 font-medium" />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button onClick={() => handleSaveSimulated('Profil')} className="shadow-md">Enregistrer les modifications</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 md:p-8 shadow-sm border border-danger-200 dark:border-danger-900/50">
                    <h3 className="text-lg font-bold text-danger-600 dark:text-danger-500 mb-4">Zone de danger</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-danger-50/50 dark:bg-danger-900/10 rounded-2xl border border-danger-100 dark:border-danger-900/30">
                        <div>
                          <p className="font-bold text-danger-900 dark:text-danger-400">Modifier le mot de passe</p>
                          <p className="text-sm text-danger-600/80 dark:text-danger-500/80">Il est recommandé de le changer régulièrement.</p>
                        </div>
                        <Button variant="outline" className="text-danger-600 border-danger-200 hover:bg-danger-50">Modifier</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-danger-50/50 dark:bg-danger-900/10 rounded-2xl border border-danger-100 dark:border-danger-900/30">
                        <div>
                          <p className="font-bold text-danger-900 dark:text-danger-400">Supprimer le compte</p>
                          <p className="text-sm text-danger-600/80 dark:text-danger-500/80">Cette action est irréversible et supprimera toutes vos données.</p>
                        </div>
                        <Button className="bg-danger-500 hover:bg-danger-600 text-white shadow-md">Supprimer</Button>
                      </div>
                    </div>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* PROFILE */}
                <section id="profile" ref={el => sectionRefs.current['profile'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Profil</h2>
                    <p className="text-surface-500">Gérez les préférences globales de votre famille.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
                      <h4 className="font-bold mb-4">Fuseau horaire</h4>
                      <select className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                        <option>Europe/Paris (GMT+2)</option>
                        <option>Europe/London (GMT+1)</option>
                        <option>America/New_York (GMT-4)</option>
                      </select>
                    </div>
                    <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
                      <h4 className="font-bold mb-4">Pays de résidence</h4>
                      <select className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                        <option>France</option>
                        <option>Canada</option>
                        <option>Suisse</option>
                        <option>Belgique</option>
                      </select>
                    </div>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* NOTIFICATIONS */}
                <section id="notifications" ref={el => sectionRefs.current['notifications'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Notifications</h2>
                    <p className="text-surface-500">Choisissez comment et quand vous souhaitez être contacté.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-2 shadow-sm border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700/50">
                    {[
                      { title: "Rapports hebdomadaires", desc: "Recevez un résumé de l'activité de lecture de vos enfants.", default: true },
                      { title: "Rappels de lecture", desc: "Soyez notifié si l'objectif de lecture n'est pas atteint.", default: true },
                      { title: "Nouvelles histoires IA", desc: "Alertes lorsqu'une nouvelle histoire générée est prête.", default: true },
                      { title: "Mises à jour des abonnements", desc: "Factures, renouvellements et offres.", default: false },
                      { title: "Nouveautés catalogue", desc: "Soyez le premier informé des nouveaux livres ajoutés.", default: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors rounded-2xl">
                        <div>
                          <p className="font-bold text-surface-900 dark:text-white">{item.title}</p>
                          <p className="text-sm text-surface-500">{item.desc}</p>
                        </div>
                        <Switch defaultChecked={item.default} onChange={() => handleSaveSimulated('Préférence de notification')} />
                      </div>
                    ))}
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* PRIVACY */}
                <section id="privacy" ref={el => sectionRefs.current['privacy'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Confidentialité</h2>
                    <p className="text-surface-500">Contrôlez vos données et celles de vos enfants de manière transparente.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-6 border border-green-100 dark:border-green-800/50">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                        <ShieldIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">Données des enfants</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-4">Les données de lecture et de progression sont strictement confidentielles et ne sont jamais partagées à des tiers.</p>
                      <Button variant="outline" className="bg-white/50 text-green-700 border-green-200">Gérer les autorisations</Button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-6 border border-blue-100 dark:border-blue-800/50">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                        <MailIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Fichiers vocaux</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">Les enregistrements vocaux générés pour la lecture sont stockés de manière sécurisée et vous appartiennent entièrement.</p>
                      <Button variant="outline" className="bg-white/50 text-blue-700 border-blue-200">Supprimer les voix</Button>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold">Télécharger vos données</h4>
                      <p className="text-sm text-surface-500">Obtenez une copie de toutes vos données personnelles au format JSON.</p>
                    </div>
                    <Button variant="outline">Exporter</Button>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* SECURITY */}
                <section id="security" ref={el => sectionRefs.current['security'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Sécurité</h2>
                    <p className="text-surface-500">Protégez l'accès à votre compte familial.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 flex items-center justify-between mb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-12 h-12 bg-surface-100 dark:bg-surface-700 rounded-2xl flex items-center justify-center text-surface-600 dark:text-surface-300 shrink-0">
                        <SmartphoneIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold flex items-center gap-2">Authentification à deux facteurs <Badge variant="primary" className="text-[10px]">Prochainement</Badge></h4>
                        <p className="text-sm text-surface-500">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
                      </div>
                    </div>
                    <Button disabled variant="outline">Configurer</Button>
                  </div>
                  
                  <h4 className="font-bold mt-8 mb-4">Appareils connectés</h4>
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-2 shadow-sm border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700/50">
                    <div className="flex items-center justify-between p-4 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-xl"><ComputerIcon className="w-5 h-5"/></div>
                        <div>
                          <p className="font-bold flex items-center gap-2">MacBook Pro <Badge variant="success" className="text-[10px]">Cet appareil</Badge></p>
                          <p className="text-xs text-surface-500">Paris, France • En ligne maintenant</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-100 text-surface-500 rounded-xl"><SmartphoneIcon className="w-5 h-5"/></div>
                        <div>
                          <p className="font-bold">iPhone 13</p>
                          <p className="text-xs text-surface-500">Paris, France • Actif il y a 2 heures</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-danger-500 hover:text-danger-600 transition-colors">Déconnecter</button>
                    </div>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* LANGUAGE */}
                <section id="language" ref={el => sectionRefs.current['language'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Langues</h2>
                    <p className="text-surface-500">Gérez les langues de l'interface et du contenu.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Français', 'English', 'العربية'].map((lang, i) => (
                      <div key={i} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${i === 0 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-primary-300'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${i === 0 ? 'text-primary-700 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300'}`}>{lang}</span>
                          {i === 0 && <CheckCircleIcon className="w-5 h-5 text-primary-500" />}
                        </div>
                      </div>
                    ))}
                    <div className="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 opacity-50 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-surface-500">Español</span>
                        <Badge variant="secondary" className="text-[10px]">Bientôt</Badge>
                      </div>
                    </div>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* READING PREFERENCES */}
                <section id="reading" ref={el => sectionRefs.current['reading'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Préférences de Lecture</h2>
                    <p className="text-surface-500">Personnalisez l'affichage pour un confort optimal.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 space-y-8">
                    <div>
                      <h4 className="font-bold mb-4">Police par défaut</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center cursor-pointer">
                          <span className="font-bold font-sans">Classique (Inter)</span>
                        </div>
                        <div className="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 hover:border-primary-300 bg-white dark:bg-surface-800 flex items-center justify-center cursor-pointer">
                          <span className="font-bold font-serif">Ludique (Comic)</span>
                        </div>
                        <div className="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 hover:border-primary-300 bg-white dark:bg-surface-800 flex items-center justify-center cursor-pointer relative overflow-hidden">
                          <span className="font-bold" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>Dyslexie</span>
                          <div className="absolute top-0 right-0 w-8 h-8 bg-blue-100 rounded-bl-2xl"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold">Interligne large</h4>
                        <Switch defaultChecked={true} onChange={() => handleSaveSimulated('Interligne')} />
                      </div>
                      <p className="text-sm text-surface-500">Augmente l'espace entre les lignes pour faciliter la lecture.</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold">Lecture audio automatique</h4>
                        <Switch defaultChecked={false} onChange={() => handleSaveSimulated('Lecture audio')} />
                      </div>
                      <p className="text-sm text-surface-500">Démarre la voix off automatiquement à l'ouverture d'un livre.</p>
                    </div>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* SUBSCRIPTION */}
                <section id="subscription" ref={el => sectionRefs.current['subscription'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Abonnement</h2>
                    <p className="text-surface-500">Gérez votre facturation et votre plan actuel.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <Badge variant="glass" className="bg-white/20 border-none font-bold mb-2">Premium Famille</Badge>
                          <h3 className="text-4xl font-black">9.99 € <span className="text-xl font-medium text-white/50">/ mois</span></h3>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
                          <StarIcon className="w-8 h-8 text-yellow-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>Profils enfants illimités</span></div>
                        <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>Génération d'histoires IA</span></div>
                        <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>Clonage vocal (3 voix)</span></div>
                        <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>Statistiques avancées</span></div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
                        <Button className="bg-white text-black hover:bg-surface-100 font-bold">Gérer la facturation</Button>
                        <Button variant="ghost" className="text-white hover:bg-white/10">Voir l'historique des factures</Button>
                      </div>
                    </div>
                  </div>
                </section>
                
                <hr className="border-surface-200 dark:border-surface-800" />
                
                {/* SUPPORT */}
                <section id="support" ref={el => sectionRefs.current['support'] = el} className="scroll-mt-24 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Support</h2>
                    <p className="text-surface-500">Besoin d'aide ? Nous sommes là pour vous.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "Centre d'aide", desc: "Guides et FAQ complets", icon: BookIcon },
                      { title: "Contact", desc: "Envoyez-nous un email", icon: MailIcon },
                      { title: "Signaler un bug", desc: "Aidez-nous à améliorer", icon: AlertIcon },
                    ].map((item, i) => (
                      <div key={i} className="bg-white dark:bg-surface-800 p-6 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="w-10 h-10 bg-surface-100 dark:bg-surface-700 rounded-xl flex items-center justify-center text-surface-600 dark:text-surface-300 mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold mb-1">{item.title}</h4>
                        <p className="text-xs text-surface-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center pt-8">
                    <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">HKids Version 2.4.0</p>
                  </div>
                </section>

                <div className="h-12"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Need to define AlertIcon since I used it but didn't import it from Icons if it wasn't there. I'll add a simple inline or import it.
// Oh wait, AlertIcon is in Icons.jsx. Let me import it.
