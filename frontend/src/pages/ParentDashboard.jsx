import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge, ProgressBar, Switch, Input, Skeleton, Avatar, EmptyState } from '../components/ui';

import { useAuth } from '../context/AuthContext';
import { parentalAPI } from '../api/parental';
import { categoriesAPI } from '../api/books';
import { learningAPI } from '../api/learning';
import { useToast } from '../components/ToastProvider';
import { CONTENT_LANGUAGES, CONTENT_THEMES } from '../constants/contentOptions';
import { buildKidPayload, createEmptyKidForm, kidToForm } from '../utils/kidProfiles';
import { 
  UserIcon, LogOutIcon, PlusIcon, XIcon, CheckIcon, 
  ChildIcon, LockIcon, EditIcon, TrashIcon, BookIcon,
  HistoryIcon, MicrophoneIcon, AudioIcon, ClockIcon, BrainIcon, StarIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { KidAvatar } from '../components/parent/KidAvatar';
import { SettingsCenterModal } from '../components/parent/SettingsCenterModal';
import { SettingsIcon } from '../components/Icons';

const bedtimeLanguages = CONTENT_LANGUAGES.map((language) => ({
  id: language.id,
  label: language.shortLabel,
}));

const bedtimeThemes = CONTENT_THEMES.map((theme) => ({
  id: theme.id,
  label: theme.libraryLabel || theme.label,
}));

function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [kids, setKids] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [kidActivity, setKidActivity] = useState(null);
  const [learningActivity, setLearningActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showKidModal, setShowKidModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const emptyKidForm = createEmptyKidForm();
  const [kidForm, setKidForm] = useState(emptyKidForm);
  const [accountForm, setAccountForm] = useState({ username: '', password: '' });
  const [goalForm, setGoalForm] = useState({
    goal_type: 'minutes',
    target_value: 20,
    period: 'weekly'
  });
  const [rulesForm, setRulesForm] = useState({
    daily_screen_time_minutes: 30,
    quiet_start_time: '19:00',
    quiet_end_time: '21:00',
    allowed_languages: [],
    allowed_themes: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return;
    }
    if (user.role !== 'parent' && user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kidsRes, categoriesRes] = await Promise.all([
        parentalAPI.getKids(),
        categoriesAPI.getAll()
      ]);
      const kidsData = kidsRes.data || [];
      const categoriesData = categoriesRes.data || [];
      setKids(kidsData);
      setCategories(categoriesData);

      if (!selectedKid && kidsData.length > 0) {
        setSelectedKid(kidsData[0]);
        setActiveSection('overview');
        loadApprovals(kidsData[0].id, categoriesData);
        loadKidActivity(kidsData[0].id);
        loadLearningActivity(kidsData[0].id);
        loadRules(kidsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async (kidId, availableCategories = categories) => {
    try {
      const res = await parentalAPI.getApprovals(kidId);
      const approvalsData = res.data;
      
      // Create a map of all categories with their approval status
      const approvalsMap = new Map();
      approvalsData.forEach(approval => {
        approvalsMap.set(approval.category_id, approval.approved);
      });

      // Create approvals array for all categories
      const allApprovals = availableCategories.map(cat => ({
        category_id: cat.id,
        category_name: cat.name,
        category_description: cat.description || '',
        approved: approvalsMap.get(cat.id) || false
      }));

      setApprovals(allApprovals);
    } catch (error) {
      console.error('Error loading approvals:', error);
      showToast('Erreur lors du chargement des approbations', 'error');
    }
  };

  const loadKidActivity = async (kidId) => {
    try {
      setActivityLoading(true);
      const res = await parentalAPI.getKidActivity(kidId);
      setKidActivity(res.data);
      if (res.data?.goal) {
        setGoalForm({
          goal_type: res.data.goal.goal_type || 'minutes',
          target_value: res.data.goal.target_value || 20,
          period: res.data.goal.period || 'weekly'
        });
      } else {
        setGoalForm({ goal_type: 'minutes', target_value: 20, period: 'weekly' });
      }
    } catch (error) {
      console.error('Error loading kid activity:', error);
      setKidActivity(null);
      showToast('Erreur lors du chargement du suivi de lecture', 'error');
    } finally {
      setActivityLoading(false);
    }
  };

  const loadRules = async (kidId) => {
    try {
      setRulesLoading(true);
      const res = await parentalAPI.getRules(kidId);
      setRulesForm({
        daily_screen_time_minutes: res.data?.daily_screen_time_minutes ?? 30,
        quiet_start_time: res.data?.quiet_start_time || '19:00',
        quiet_end_time: res.data?.quiet_end_time || '21:00',
        allowed_languages: res.data?.allowed_languages || [],
        allowed_themes: res.data?.allowed_themes || []
      });
    } catch (error) {
      console.error('Error loading parental rules:', error);
      showToast('Erreur lors du chargement des regles', 'error');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleSelectKid = (kid) => {
    setSelectedKid(kid);
    setActiveSection('overview');
    loadApprovals(kid.id);
    loadKidActivity(kid.id);
    loadLearningActivity(kid.id);
    loadRules(kid.id);
  };

  const loadLearningActivity = async (kidId) => {
    try {
      const response = await learningAPI.getParentSummary(kidId);
      setLearningActivity(response.data);
    } catch (error) {
      console.warn('Learning activity unavailable:', error);
      setLearningActivity(null);
    }
  };

  const handleToggleApproval = async (categoryId, approved) => {
    try {
      await parentalAPI.updateApproval(selectedKid.id, categoryId, approved);
      setApprovals(prev => 
        prev.map(approval => 
          approval.category_id === categoryId 
            ? { ...approval, approved }
            : approval
        )
      );
      showToast(`Catégorie ${approved ? 'approuvée' : 'désapprouvée'}`, 'success');
    } catch (error) {
      console.error('Error updating approval:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleSaveKid = async () => {
    const payload = buildKidPayload(kidForm);

    if (!payload.name) {
      showToast('Le prenom est obligatoire', 'error');
      return;
    }

    try {
      if (editingKid) {
        await parentalAPI.updateKid(editingKid.id, payload);
        showToast('Profil enfant mis à jour', 'success');
      } else {
        await parentalAPI.createKid(payload);
        showToast('Profil enfant créé', 'success');
      }
      setShowKidModal(false);
      setEditingKid(null);
      setKidForm(emptyKidForm);
      loadData();
    } catch (error) {
      console.error('Error saving kid:', error);
      showToast(error.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDeleteKid = async (kidId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) return;
    
    try {
      await parentalAPI.deleteKid(kidId);
      showToast('Profil supprimé', 'success');
      if (selectedKid?.id === kidId) {
        setSelectedKid(null);
        setApprovals([]);
        setKidActivity(null);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting kid:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleCreateAccount = async () => {
    try {
      await parentalAPI.createKidAccount(selectedKid.id, accountForm.username, accountForm.password);
      showToast('Compte enfant créé avec succès', 'success');
      setShowAccountModal(false);
      setAccountForm({ username: '', password: '' });
    } catch (error) {
      console.error('Error creating account:', error);
      showToast(error.response?.data?.error || 'Erreur lors de la création du compte', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  const handleSaveGoal = async () => {
    if (!selectedKid) return;

    try {
      setGoalSaving(true);
      await parentalAPI.saveReadingGoal(selectedKid.id, goalForm);
      showToast('Objectif de lecture enregistre', 'success');
      await loadKidActivity(selectedKid.id);
    } catch (error) {
      console.error('Error saving reading goal:', error);
      showToast("Erreur lors de l'enregistrement de l'objectif", 'error');
    } finally {
      setGoalSaving(false);
    }
  };

  const handleClearGoal = async () => {
    if (!selectedKid) return;

    try {
      setGoalSaving(true);
      await parentalAPI.clearReadingGoal(selectedKid.id);
      showToast('Objectif desactive', 'success');
      await loadKidActivity(selectedKid.id);
    } catch (error) {
      console.error('Error clearing reading goal:', error);
      showToast("Erreur lors de la desactivation de l'objectif", 'error');
    } finally {
      setGoalSaving(false);
    }
  };

  const toggleRuleValue = (field, value) => {
    setRulesForm((current) => {
      const values = current[field] || [];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return { ...current, [field]: nextValues };
    });
  };

  const handleSaveRules = async () => {
    if (!selectedKid) return;

    try {
      setRulesSaving(true);
      const res = await parentalAPI.saveRules(selectedKid.id, rulesForm);
      setRulesForm({
        daily_screen_time_minutes: res.data?.daily_screen_time_minutes ?? rulesForm.daily_screen_time_minutes,
        quiet_start_time: res.data?.quiet_start_time || rulesForm.quiet_start_time,
        quiet_end_time: res.data?.quiet_end_time || rulesForm.quiet_end_time,
        allowed_languages: res.data?.allowed_languages || [],
        allowed_themes: res.data?.allowed_themes || []
      });
      showToast('Regles du coucher enregistrees', 'success');
    } catch (error) {
      console.error('Error saving parental rules:', error);
      showToast("Erreur lors de l'enregistrement des regles", 'error');
    } finally {
      setRulesSaving(false);
    }
  };

  const formatDuration = (seconds = 0) => {
    const totalMinutes = Math.floor(Number(seconds || 0) / 60);
    if (totalMinutes < 1) return '0 min';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
  };

  const formatDate = (value) => {
    if (!value) return 'Jamais';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const approvedCount = approvals.filter((approval) => approval.approved).length;
  const totalCategories = approvals.length || categories.length || 0;
  const latestActivityDate = kidActivity?.recent_sessions?.[0]?.created_at
    || kidActivity?.progress?.[0]?.last_read_at
    || null;
  const parentSummaryCards = [
    {
      label: 'Enfants',
      value: kids.length,
      detail: kids.length === 1 ? 'profil actif' : 'profils actifs',
      icon: ChildIcon,
      tone: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
    },
    {
      label: 'Derniere activite',
      value: latestActivityDate ? formatDate(latestActivityDate) : 'Aucune',
      detail: selectedKid ? selectedKid.name : 'Selectionnez un enfant',
      icon: HistoryIcon,
      tone: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
    },
    {
      label: "Temps d'ecoute",
      value: formatDuration(kidActivity?.summary?.total_time_seconds),
      detail: selectedKid ? `suivi de ${selectedKid.name}` : 'pas encore de suivi',
      icon: AudioIcon,
      tone: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300'
    },
    {
      label: 'Regle quotidienne',
      value: `${rulesForm.daily_screen_time_minutes || 0} min`,
      detail: `${rulesForm.quiet_start_time || '--:--'} - ${rulesForm.quiet_end_time || '--:--'}`,
      icon: ClockIcon,
      tone: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300'
    },
    {
      label: 'Jeux educatifs',
      value: learningActivity?.summary?.attempts || 0,
      detail: `${learningActivity?.summary?.successes || 0} reussites`,
      icon: BrainIcon,
      tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300'
    }
  ];
  const parentSections = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'account', label: 'Compte enfant' },
    { id: 'access', label: 'Acces aux livres' },
    { id: 'rules', label: 'Regles' },
    { id: 'reading', label: 'Suivi' },
    { id: 'learning', label: 'Jeux' },
    { id: 'subscription', label: 'Abonnement' },
    { id: 'voice', label: 'Voix' },
    { id: 'notifications', label: 'Notifications' }
  ];

  const getCategoryGuidance = (approval) => {
    const name = (approval.category_name || '').toLowerCase();
    const guides = [
      {
        match: ['educational', 'education'],
        description: 'Histoires utiles pour apprendre, decouvrir des notions simples et renforcer la curiosite.',
        advice: 'Tres adapte',
        tone: 'green'
      },
      {
        match: ['animals', 'animal'],
        description: 'Recits autour des animaux, de la nature et de l empathie. Souvent rassurant pour les jeunes enfants.',
        advice: 'Tres adapte',
        tone: 'green'
      },
      {
        match: ['fairy tales', 'fairy', 'conte'],
        description: 'Contes imaginaires avec morale, magie et personnages symboliques. A verifier si l histoire est douce.',
        advice: 'Bon avec selection',
        tone: 'blue'
      },
      {
        match: ['adventure', 'aventure'],
        description: 'Histoires dynamiques avec exploration, courage et petits defis. Peut etre excellent si le ton reste calme.',
        advice: 'A accompagner',
        tone: 'amber'
      },
      {
        match: ['comedy', 'humour'],
        description: 'Lectures legeres et amusantes qui motivent l enfant a lire sans pression.',
        advice: 'Tres adapte',
        tone: 'green'
      },
      {
        match: ['fantasy', 'fantaisie'],
        description: 'Univers imaginaires avec magie ou personnages fictifs. Bien pour l imagination, a filtrer selon l age.',
        advice: 'A verifier',
        tone: 'amber'
      },
      {
        match: ['fiction'],
        description: 'Histoires inventees variees. Le niveau depend du theme, du vocabulaire et de la duree du livre.',
        advice: 'Selon le livre',
        tone: 'blue'
      },
      {
        match: ['mystery', 'mystere'],
        description: 'Enquetes et enigmes. Interessant pour reflechir, mais certains sujets peuvent etre moins rassurants.',
        advice: 'A verifier',
        tone: 'amber'
      },
      {
        match: ['science'],
        description: 'Contenus de decouverte pour comprendre le monde avec des mots simples.',
        advice: 'Tres adapte',
        tone: 'green'
      }
    ];
    const guide = guides.find((item) => item.match.some((keyword) => name.includes(keyword)));
    return {
      description: approval.category_description || guide?.description || 'Categorie generale. Le parent peut l autoriser apres avoir verifie que les livres correspondent a l age et au niveau de l enfant.',
      advice: guide?.advice || 'A verifier',
      tone: guide?.tone || 'amber'
    };
  };

  const guidanceToneClasses = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    blue: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    amber: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
  };


  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const totalReadingTime = kidActivity?.summary?.total_time_seconds || 0;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-8 flex flex-col gap-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 font-sans pb-24">
      {/* 1. Dashboard Hero */}
      <div className="relative bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 text-white pb-24 pt-8 px-6 md:px-12 overflow-hidden shadow-lg">
        {/* Animated background elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }} className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: 'linear' }} className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar src={null} fallback={user?.username?.[0] || 'P'} size="xl" className="border-4 border-white/20 shadow-xl" />
            <div>
              <p className="text-white/80 font-medium capitalize">{currentDate}</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Bonjour, {user?.username || 'Parent'} !</h1>
              <div className="flex items-center gap-3">
                <Badge variant="glass" className="bg-white/20 text-white border-none font-bold">
                  {kids.length} {kids.length > 1 ? 'Enfants' : 'Enfant'}
                </Badge>
                <Badge variant="glass" className="bg-green-500/80 text-white border-none font-bold">Abonnement Actif</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="glass" onClick={() => setShowSettingsModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold border-none shrink-0">
              <SettingsIcon className="w-5 h-5 mr-2" /> Paramètres
            </Button>
            <Button variant="glass" onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white font-bold border-none shrink-0">Déconnexion</Button>
            <Button variant="glass" onClick={() => { setEditingKid(null); setKidForm(emptyKidForm); setShowKidModal(true); }} className="bg-white hover:bg-surface-100 text-primary-600 font-bold border-none shadow-xl shrink-0">
              <PlusIcon className="w-5 h-5 mr-2" /> Ajouter un enfant
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-16 relative z-20 flex flex-col gap-8">
        
        {/* 2. Quick Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-6 shadow-floating hover:-translate-y-1 transition-transform border-none overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-xl"></div>
            <div className="flex items-center gap-4 mb-4 relative">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/50 text-primary-600 rounded-2xl"><ClockIcon className="w-6 h-6" /></div>
              <h3 className="font-bold text-surface-500 dark:text-surface-400">Temps de lecture</h3>
            </div>
            <p className="text-3xl font-black relative">{formatDuration(totalReadingTime)}</p>
          </Card>
          <Card className="p-6 shadow-floating hover:-translate-y-1 transition-transform border-none overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-success-100 dark:bg-success-900/30 rounded-full blur-xl"></div>
            <div className="flex items-center gap-4 mb-4 relative">
              <div className="p-3 bg-success-100 dark:bg-success-900/50 text-success-600 rounded-2xl"><BookIcon className="w-6 h-6" /></div>
              <h3 className="font-bold text-surface-500 dark:text-surface-400">Histoires lues</h3>
            </div>
            <p className="text-3xl font-black relative">{learningActivity?.summary?.attempts || 0}</p>
          </Card>
          <Card className="p-6 shadow-floating hover:-translate-y-1 transition-transform border-none overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-100 dark:bg-secondary-900/30 rounded-full blur-xl"></div>
            <div className="flex items-center gap-4 mb-4 relative">
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 text-secondary-600 rounded-2xl"><StarIcon className="w-6 h-6" /></div>
              <h3 className="font-bold text-surface-500 dark:text-surface-400">Série de lecture</h3>
            </div>
            <p className="text-3xl font-black relative">3 Jours <span className="text-sm font-medium text-success-500 ml-2">🔥 En cours</span></p>
          </Card>
          <Card className="p-6 shadow-floating hover:-translate-y-1 transition-transform border-none overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-warning-100 dark:bg-warning-900/30 rounded-full blur-xl"></div>
            <div className="flex items-center gap-4 mb-4 relative">
              <div className="p-3 bg-warning-100 dark:bg-warning-900/50 text-warning-600 rounded-2xl"><BrainIcon className="w-6 h-6" /></div>
              <h3 className="font-bold text-surface-500 dark:text-surface-400">Jeux éducatifs</h3>
            </div>
            <p className="text-3xl font-black relative">{learningActivity?.summary?.successes || 0}</p>
          </Card>
        </div>

        {/* 3. Children Profiles Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Profils Enfants</h2>
          {kids.length === 0 ? (
            <EmptyState 
              title="Aucun profil enfant" 
              description="Créez un profil pour votre enfant afin de suivre sa progression et personnaliser son expérience." 
              actionLabel="Ajouter un enfant" 
              onAction={() => { setEditingKid(null); setKidForm(emptyKidForm); setShowKidModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {kids.map(kid => (
                <Card 
                  key={kid.id} 
                  className={`p-0 overflow-hidden shadow-floating transition-all ${selectedKid?.id === kid.id ? 'ring-4 ring-primary-500' : 'hover:shadow-xl'}`}
                  onClick={() => handleSelectKid(kid)}
                >
                  <div className="p-6 cursor-pointer bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-800/80">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <KidAvatar kid={kid} size="lg" />
                        <div>
                          <h3 className="text-xl font-bold">{kid.name}</h3>
                          <div className="flex gap-2 mt-1">
                            {kid.age && <Badge variant="secondary">{kid.age} ans</Badge>}
                            <Badge variant="outline">Niveau 2</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm font-bold mb-1">
                          <span className="text-surface-500">Lecture hebdo</span>
                          <span className="text-primary-600">45 / 60 min</span>
                        </div>
                        <ProgressBar progress={75} color="bg-primary-500" />
                      </div>
                      
                      {selectedKid?.id === kid.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 grid grid-cols-2 gap-2 border-t border-surface-100 dark:border-surface-700">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingKid(kid); setKidForm(kidToForm(kid)); setShowKidModal(true); }} className="font-bold text-xs"><EditIcon className="w-4 h-4 mr-1"/> Modifier</Button>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowAccountModal(true); }} className="font-bold text-xs"><LockIcon className="w-4 h-4 mr-1"/> Compte</Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteKid(kid.id); }} className="font-bold text-xs text-danger-500 hover:bg-danger-50 hover:text-danger-600 col-span-2 border border-transparent hover:border-danger-200"><TrashIcon className="w-4 h-4 mr-1"/> Supprimer</Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selectedKid && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* 4. Analytics & Goals */}
              <Card className="p-6 shadow-floating">
                <h2 className="text-xl font-bold mb-6">Activité de {selectedKid.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Fake Bar Chart */}
                  <div className="flex flex-col h-48 justify-end gap-2 border-b border-l border-surface-200 dark:border-surface-700 p-4">
                    <div className="flex items-end justify-between h-full w-full gap-2">
                      {[30, 45, 20, 60, 80, 40, 90].map((h, i) => (
                        <div key={i} className="w-full bg-primary-100 dark:bg-primary-900/30 rounded-t-md relative group">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className="absolute bottom-0 inset-x-0 bg-primary-500 rounded-t-md" />
                          <div className="absolute -top-8 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-surface-800 text-white py-1 rounded">{h}m</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-surface-500 font-bold mt-2">
                      <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                    </div>
                  </div>

                  {/* Circular Goal */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-100 dark:text-surface-700" />
                        <motion.circle initial={{ strokeDashoffset: 351 }} animate={{ strokeDashoffset: 351 - (351 * 75 / 100) }} transition={{ duration: 1, ease: 'easeOut' }} cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="351" strokeLinecap="round" className="text-secondary-500" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black">75%</span>
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Objectif</span>
                      </div>
                    </div>
                    <p className="mt-4 font-bold text-center text-sm text-surface-600 dark:text-surface-400">Objectif de {goalForm.target_value} minutes {goalForm.period === 'daily' ? 'par jour' : 'par semaine'}</p>
                  </div>
                </div>
              </Card>

              {/* 5. Parental Controls */}
              <Card className="p-6 shadow-floating">
                <h2 className="text-xl font-bold mb-6">Paramètres Parentaux</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                    <div>
                      <h4 className="font-bold">Temps d'écran quotidien</h4>
                      <p className="text-sm text-surface-500">Limite de lecture (minutes)</p>
                    </div>
                    <Input 
                      type="number" 
                      value={rulesForm.daily_screen_time_minutes} 
                      onChange={(e) => setRulesForm({...rulesForm, daily_screen_time_minutes: parseInt(e.target.value) || 30})}
                      className="w-24 text-center font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                      <h4 className="font-bold mb-2">Début pause</h4>
                      <Input type="time" value={rulesForm.quiet_start_time} onChange={(e) => setRulesForm({...rulesForm, quiet_start_time: e.target.value})} className="w-full font-bold" />
                    </div>
                    <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                      <h4 className="font-bold mb-2">Fin pause</h4>
                      <Input type="time" value={rulesForm.quiet_end_time} onChange={(e) => setRulesForm({...rulesForm, quiet_end_time: e.target.value})} className="w-full font-bold" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-100 dark:border-surface-700 flex justify-end">
                    <Button variant="primary" onClick={handleSaveRules} disabled={rulesSaving}>
                      {rulesSaving ? 'Enregistrement...' : 'Enregistrer les règles'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Theme & Language Permissions */}
              <Card className="p-6 shadow-floating">
                 <h2 className="text-xl font-bold mb-6">Autorisations de lecture</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="font-bold mb-3">Langues autorisées</h4>
                     <div className="flex flex-wrap gap-2">
                       {bedtimeLanguages.map(lang => (
                         <div key={lang.id} onClick={() => toggleRuleValue('allowed_languages', lang.id)} className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors border-2 ${rulesForm.allowed_languages.includes(lang.id) ? 'bg-primary-500 border-primary-500 text-white' : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 hover:border-primary-300'}`}>
                           {lang.label}
                         </div>
                       ))}
                     </div>
                   </div>
                   <div>
                     <h4 className="font-bold mb-3">Thèmes autorisés</h4>
                     <div className="flex flex-wrap gap-2">
                       {bedtimeThemes.map(theme => (
                         <div key={theme.id} onClick={() => toggleRuleValue('allowed_themes', theme.id)} className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors border-2 ${rulesForm.allowed_themes.includes(theme.id) ? 'bg-secondary-500 border-secondary-500 text-white' : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 hover:border-secondary-300'}`}>
                           {theme.label}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
              </Card>
            </div>

            {/* Sidebar (Right) */}
            <div className="flex flex-col gap-8">
              {/* Subscription Card */}
              <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl"></div>
                <Badge variant="glass" className="bg-white/20 text-white border-none font-bold mb-4">Premium</Badge>
                <h2 className="text-2xl font-black mb-1">Illimité</h2>
                <p className="text-white/70 text-sm mb-6">Renouvellement le 14 Août 2026</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Livres IA générés</span>
                    <span>12 / 100</span>
                  </div>
                  <ProgressBar progress={12} color="bg-yellow-400" />
                </div>
                <Button variant="outline" fullWidth className="bg-white hover:bg-surface-100 text-black border-none font-bold">Gérer l'abonnement</Button>
              </div>

              {/* AI Insights & Timeline */}
              <Card className="p-6 shadow-floating">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BrainIcon className="w-6 h-6 text-primary-500" /> Recommandations IA
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-900/50">
                    <p className="text-sm font-bold text-primary-800 dark:text-primary-300">💡 {selectedKid.name} adore les histoires sur les animaux en ce moment. Vous devriez lui proposer une histoire sur la jungle.</p>
                  </div>
                  <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-2xl border border-secondary-100 dark:border-secondary-900/50">
                    <p className="text-sm font-bold text-secondary-800 dark:text-secondary-300">📈 Son vocabulaire progresse bien. Essayez des livres de Niveau 3 la semaine prochaine.</p>
                  </div>
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-6 shadow-floating">
                <h2 className="text-xl font-bold mb-6">Activités récentes</h2>
                <div className="relative border-l-2 border-surface-200 dark:border-surface-700 ml-3 space-y-6">
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-success-500 ring-4 ring-white dark:ring-surface-800"></div>
                    <p className="font-bold text-sm">A terminé "Le Lion Courageux"</p>
                    <p className="text-xs text-surface-500">Aujourd'hui, 14h30</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary-500 ring-4 ring-white dark:ring-surface-800"></div>
                    <p className="font-bold text-sm">A gagné le badge Lecteur Assidu</p>
                    <p className="text-xs text-surface-500">Hier</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-warning-500 ring-4 ring-white dark:ring-surface-800"></div>
                    <p className="font-bold text-sm">A joué à "Mots croisés"</p>
                    <p className="text-xs text-surface-500">Il y a 3 jours</p>
                  </div>
                </div>
              </Card>
            </div>

          </motion.div>
        )}
      </div>

      {/* Modals from old implementation */}
      <AnimatePresence>
        {showKidModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowKidModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-surface-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black">{editingKid ? 'Modifier le profil' : 'Créer un profil'}</h3>
                <button onClick={() => setShowKidModal(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Prénom</label>
                  <Input type="text" value={kidForm.name} onChange={(e) => setKidForm({...kidForm, name: e.target.value})} placeholder="Prénom" className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Âge (optionnel)</label>
                  <Input type="number" value={kidForm.age} onChange={(e) => setKidForm({...kidForm, age: e.target.value})} placeholder="Âge" className="w-full" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowKidModal(false)}>Annuler</Button>
                  <Button variant="primary" className="flex-1" onClick={handleSaveKid}>{editingKid ? 'Modifier' : 'Créer'}</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccountModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAccountModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-surface-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black">Compte de {selectedKid?.name}</h3>
                <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Nom d'utilisateur</label>
                  <Input type="text" value={accountForm.username} onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })} placeholder="Nom d'utilisateur" className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Mot de passe</label>
                  <Input type="password" value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} placeholder="Mot de passe (min. 6 caractères)" className="w-full" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowAccountModal(false)}>Annuler</Button>
                  <Button variant="primary" className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleCreateAccount}>Créer le compte</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <SettingsCenterModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

export default ParentDashboard;
