import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { parentalAPI } from '../api/parental';
import { categoriesAPI } from '../api/books';
import { useToast } from '../components/ToastProvider';
import { CONTENT_LANGUAGES, CONTENT_THEMES } from '../constants/contentOptions';
import { buildKidPayload, createEmptyKidForm, kidToForm } from '../utils/kidProfiles';
import { 
  UserIcon, LogOutIcon, PlusIcon, XIcon, CheckIcon, 
  ChildIcon, LockIcon, EditIcon, TrashIcon, BookIcon,
  HistoryIcon, MicrophoneIcon, AudioIcon, ClockIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';
import { KidAvatar } from '../components/parent/KidAvatar';

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
  const [activityLoading, setActivityLoading] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showKidModal, setShowKidModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
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
    loadRules(kid.id);
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
      tone: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
    },
    {
      label: 'Derniere activite',
      value: latestActivityDate ? formatDate(latestActivityDate) : 'Aucune',
      detail: selectedKid ? selectedKid.name : 'Selectionnez un enfant',
      icon: HistoryIcon,
      tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
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
      tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300'
    }
  ];
  const parentSections = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'account', label: 'Compte enfant' },
    { id: 'access', label: 'Acces aux livres' },
    { id: 'rules', label: 'Regles' },
    { id: 'reading', label: 'Suivi' },
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
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo size="default" showText={true} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                Espace parent
              </h1>
              <p className="text-sm text-neutral-500">
                Payer, autoriser et suivre la lecture de votre enfant.
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOutIcon className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {parentSummaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-xl bg-white p-4 shadow-lg dark:bg-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-neutral-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-neutral-500">{card.detail}</p>
                  </div>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kids List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  Profils Enfants
                </h2>
                <div className="flex items-center gap-2">
                  <Link
                    to="/parent/profiles"
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                  >
                    Gerer
                  </Link>
                  <button
                    onClick={() => {
                      setEditingKid(null);
                      setKidForm(emptyKidForm);
                      setShowKidModal(true);
                    }}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {kids.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">
                    Aucun profil enfant. Cliquez sur + pour en créer un.
                  </p>
                ) : (
                  kids.map(kid => (
                    <motion.div
                      key={kid.id}
                      onClick={() => handleSelectKid(kid)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedKid?.id === kid.id
                          ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                          : 'bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-2 border-transparent'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <KidAvatar kid={kid} size="sm" />
                          <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {kid.name}
                            </p>
                            {kid.age && (
                              <p className="text-sm text-neutral-500">{kid.age} ans</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingKid(kid);
                              setKidForm(kidToForm(kid));
                              setShowKidModal(true);
                            }}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteKid(kid.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Approvals Panel */}
          <div className="lg:col-span-2">
            {selectedKid ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 p-6 text-white shadow-xl">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-white/80">
                        Espace de {selectedKid.name}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        Le parent gere, l'enfant lit simplement.
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-white/85">
                        Le paiement, le compte enfant et les categories autorisees restent ici. Cote enfant, il ne voit que les livres disponibles.
                      </p>
                    </div>
                    <Link
                      to="/abonnements"
                      className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-bold text-red-600 shadow-lg transition hover:bg-red-50"
                    >
                      Gerer l'abonnement
                    </Link>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                      <span className="block text-sm text-white/80">Temps lu</span>
                      <span className="text-2xl font-bold">
                        {formatDuration(kidActivity?.summary?.total_time_seconds)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                      <span className="block text-sm text-white/80">Livres termines</span>
                      <span className="text-2xl font-bold">
                        {kidActivity?.summary?.completed_books || 0}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                      <span className="block text-sm text-white/80">Acces autorises</span>
                      <span className="text-2xl font-bold">
                        {approvedCount}/{totalCategories}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <button
                    onClick={() => setActiveSection('account')}
                    className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <span className="block text-sm font-bold text-red-600">1. Compte enfant</span>
                    <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                      Creer l'identifiant que l'enfant utilisera pour lire.
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection('access')}
                    className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <span className="block text-sm font-bold text-red-600">2. Acces aux livres</span>
                    <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                      Choisir les categories visibles pour {selectedKid.name}.
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection('reading')}
                    className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <span className="block text-sm font-bold text-red-600">3. Suivi de lecture</span>
                    <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                      Voir les progres apres les sessions de lecture.
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection('rules')}
                    className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <span className="block text-sm font-bold text-red-600">4. Controle parental</span>
                    <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                      Regler duree, horaires, langues et univers autorises.
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection('subscription')}
                    className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <span className="block text-sm font-bold text-red-600">5. Abonnement</span>
                    <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                      Preparer la formule familiale et les limites de livres.
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection('notifications')}
                    className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <span className="block text-sm font-bold text-red-600">6. Notifications</span>
                    <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                      Preparer les rappels de coucher et alertes parentales.
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-lg dark:bg-neutral-800">
                  {parentSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        activeSection === section.id
                          ? 'bg-red-500 text-white shadow'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>

                {activeSection === 'overview' && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                        Parcours parent logique
                      </h2>
                      <div className="mt-5 space-y-4">
                        {[
                          ['Payer cote parent', "L'enfant ne voit jamais le paiement."],
                          ['Creer le compte enfant', 'Un acces simple et limite a son profil.'],
                          ['Autoriser les categories', 'Le contenu visible reste valide par le parent.'],
                          ['Suivre sans interrompre', 'Le parent consulte les progres quand il veut.']
                        ].map(([title, text], index) => (
                          <div key={title} className="flex gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-neutral-100">{title}</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-300">{text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                        Resume de {selectedKid.name}
                      </h2>
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-700">
                          <span className="block text-sm text-neutral-500">Age</span>
                          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {selectedKid.age ? `${selectedKid.age} ans` : 'Non renseigne'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-700">
                          <span className="block text-sm text-neutral-500">Sessions</span>
                          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {kidActivity?.summary?.total_sessions || 0}
                          </span>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() => setActiveSection('account')}
                          className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
                        >
                          Configurer le compte
                        </button>
                        <button
                          onClick={() => setActiveSection('access')}
                          className="rounded-lg bg-neutral-100 px-4 py-2 font-bold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200"
                        >
                          Gerer les acces
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'rules' && (
                  <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                          Regles du coucher de {selectedKid.name}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                          Duree, horaires, langues et univers autorises.
                        </p>
                      </div>
                      <button
                        onClick={handleSaveRules}
                        disabled={rulesSaving || rulesLoading}
                        className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                      >
                        {rulesSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>

                    {rulesLoading ? (
                      <p className="py-8 text-center text-neutral-500">Chargement des regles...</p>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-200">
                              Duree quotidienne
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="240"
                                value={rulesForm.daily_screen_time_minutes}
                                onChange={(event) => setRulesForm({
                                  ...rulesForm,
                                  daily_screen_time_minutes: event.target.value
                                })}
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                              />
                              <span className="text-sm font-bold text-neutral-500">min</span>
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-200">
                              Heure debut
                            </label>
                            <input
                              type="time"
                              value={rulesForm.quiet_start_time}
                              onChange={(event) => setRulesForm({ ...rulesForm, quiet_start_time: event.target.value })}
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-200">
                              Heure fin
                            </label>
                            <input
                              type="time"
                              value={rulesForm.quiet_end_time}
                              onChange={(event) => setRulesForm({ ...rulesForm, quiet_end_time: event.target.value })}
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Contenus autorises</h3>
                              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                {approvedCount} categorie{approvedCount > 1 ? 's' : ''} autorisee{approvedCount > 1 ? 's' : ''} sur {totalCategories || 0}.
                              </p>
                            </div>
                            <button
                              onClick={() => setActiveSection('access')}
                              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                            >
                              Modifier les contenus
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {approvals.filter((approval) => approval.approved).length > 0 ? (
                              approvals
                                .filter((approval) => approval.approved)
                                .slice(0, 6)
                                .map((approval) => (
                                  <span
                                    key={approval.category_id}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-700 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                                  >
                                    {approval.category_name}
                                  </span>
                                ))
                            ) : (
                              <span className="text-sm font-medium text-neutral-500">Aucune categorie autorisee.</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-3 font-bold text-neutral-900 dark:text-neutral-100">Langues autorisees</h3>
                          <div className="flex flex-wrap gap-2">
                            {bedtimeLanguages.map((language) => {
                              const active = rulesForm.allowed_languages.includes(language.id);
                              return (
                                <button
                                  key={language.id}
                                  onClick={() => toggleRuleValue('allowed_languages', language.id)}
                                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                                    active
                                      ? 'bg-green-500 text-white'
                                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200'
                                  }`}
                                >
                                  {language.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-3 font-bold text-neutral-900 dark:text-neutral-100">Univers autorises</h3>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {bedtimeThemes.map((theme) => {
                              const active = rulesForm.allowed_themes.includes(theme.id);
                              return (
                                <button
                                  key={theme.id}
                                  onClick={() => toggleRuleValue('allowed_themes', theme.id)}
                                  className={`rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                                    active
                                      ? 'bg-red-500 text-white'
                                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200'
                                  }`}
                                >
                                  {theme.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'reading' && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                        Suivi de lecture de {selectedKid.name}
                      </h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        Consultez son activite, sa progression et ses livres termines.
                      </p>
                    </div>
                    <button
                      onClick={() => loadKidActivity(selectedKid.id)}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      Actualiser
                    </button>
                  </div>

                  {activityLoading ? (
                    <p className="text-neutral-500 text-center py-8">Chargement du suivi...</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                          <span className="block text-sm text-neutral-500">Temps lu</span>
                          <span className="text-2xl font-bold text-red-600">
                            {formatDuration(kidActivity?.summary?.total_time_seconds)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                          <span className="block text-sm text-neutral-500">Sessions</span>
                          <span className="text-2xl font-bold text-green-600">
                            {kidActivity?.summary?.total_sessions || 0}
                          </span>
                        </div>
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                          <span className="block text-sm text-neutral-500">Livres termines</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {kidActivity?.summary?.completed_books || 0}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-red-100 dark:border-red-900/40 bg-gradient-to-br from-white to-red-50/40 dark:from-neutral-800 dark:to-red-950/20 p-4 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                              Objectif de lecture
                            </h3>
                            <p className="text-sm text-neutral-500 mb-3">
                              Fixez un objectif motivant pour accompagner {selectedKid.name}.
                            </p>
                            {kidActivity?.goal ? (
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                                    {kidActivity.goal.progress_value || 0} / {kidActivity.goal.target_value}
                                    {kidActivity.goal.goal_type === 'minutes' ? ' min' : ''}
                                  </span>
                                  <span className={`font-bold ${kidActivity.goal.achieved ? 'text-green-600' : 'text-red-600'}`}>
                                    {kidActivity.goal.achieved ? 'Objectif atteint' : `${kidActivity.goal.progress_percent || 0}%`}
                                  </span>
                                </div>
                                <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${kidActivity.goal.achieved ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, kidActivity.goal.progress_percent || 0)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="mb-4 text-sm font-medium text-neutral-500">Aucun objectif actif.</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:w-[520px]">
                            <select
                              value={goalForm.goal_type}
                              onChange={(event) => setGoalForm({ ...goalForm, goal_type: event.target.value })}
                              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            >
                              <option value="minutes">Minutes lues</option>
                              <option value="completed_books">Livres termines</option>
                              <option value="sessions">Sessions</option>
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={goalForm.target_value}
                              onChange={(event) => setGoalForm({ ...goalForm, target_value: event.target.value })}
                              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            />
                            <select
                              value={goalForm.period}
                              onChange={(event) => setGoalForm({ ...goalForm, period: event.target.value })}
                              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            >
                              <option value="daily">Par jour</option>
                              <option value="weekly">Par semaine</option>
                              <option value="monthly">Par mois</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={handleSaveGoal}
                            disabled={goalSaving}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60"
                          >
                            {goalSaving ? 'Enregistrement...' : 'Enregistrer objectif'}
                          </button>
                          {kidActivity?.goal && (
                            <button
                              onClick={handleClearGoal}
                              disabled={goalSaving}
                              className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-60"
                            >
                              Desactiver
                            </button>
                          )}
                        </div>
                      </div>

                      {kidActivity?.badges?.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                            Badges de motivation
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {kidActivity.badges.map((badge) => (
                              <div
                                key={badge.id}
                                className={`rounded-xl border-2 p-4 ${
                                  badge.earned
                                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                                    : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700/60 opacity-70'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                    badge.earned
                                      ? 'bg-yellow-400 text-white'
                                      : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-600 dark:text-neutral-300'
                                  }`}>
                                    {badge.earned ? <CheckIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
                                  </span>
                                  <div>
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{badge.label}</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{badge.description}</p>
                                    <p className={`mt-1 text-xs font-bold ${badge.earned ? 'text-yellow-700 dark:text-yellow-300' : 'text-neutral-500'}`}>
                                      {badge.earned ? 'Gagne' : 'A debloquer'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {kidActivity?.progress?.length > 0 ? (
                        <div className="space-y-3">
                          {kidActivity.progress.map((item) => (
                            <div key={item.id} className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-700">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div>
                                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                    {item.book_title}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    Derniere lecture: {formatDate(item.last_read_at)}
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-red-600">
                                  {item.progress_percent || 0}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-600 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-red-500"
                                  style={{ width: `${Math.min(100, item.progress_percent || 0)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-neutral-500 text-center py-6">
                          Aucune lecture enregistree pour le moment.
                        </p>
                      )}

                      <div className="mt-6">
                        <div className="mb-3 flex items-center gap-2">
                          <HistoryIcon className="h-5 w-5 text-red-500" />
                          <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                            Historique recent
                          </h3>
                        </div>
                        {kidActivity?.recent_sessions?.length > 0 ? (
                          <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
                            {kidActivity.recent_sessions.map((session) => (
                              <div
                                key={session.id}
                                className="flex flex-col gap-2 bg-white p-4 dark:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                                    {session.book_title}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {formatDate(session.created_at)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs font-bold">
                                  <span className="rounded-full bg-red-50 px-3 py-1 text-red-600 dark:bg-red-900/20 dark:text-red-300">
                                    {formatDuration(session.duration_seconds)}
                                  </span>
                                  {session.completed && (
                                    <span className="rounded-full bg-green-50 px-3 py-1 text-green-600 dark:bg-green-900/20 dark:text-green-300">
                                      Termine
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-700">
                            Aucune session recente.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                )}

                {activeSection === 'subscription' && (
                  <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                          Abonnement familial
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                          Le parent garde la gestion du paiement et des limites de livres.
                        </p>
                      </div>
                      <Link
                        to="/abonnements"
                        className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
                      >
                        Gerer l'abonnement
                      </Link>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                        <p className="font-bold text-red-700 dark:text-red-300">Compte parent</p>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                          La facturation reste separee de l'espace enfant.
                        </p>
                      </div>
                      <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                        <p className="font-bold text-green-700 dark:text-green-300">Acces controle</p>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                          Les livres disponibles suivent l'abonnement et les autorisations parentales.
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                        <p className="font-bold text-blue-700 dark:text-blue-300">Evolution MVP</p>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                          Cette zone pourra afficher le plan actif, les limites et le renouvellement.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'voice' && (
                  <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300">
                        <MicrophoneIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                          Clonage vocal
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                          Section preparee pour enregistrer ou connecter plus tard une voix parentale.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        ['Consentement parent', 'Ajouter une validation explicite avant toute creation de voix.'],
                        ['Echantillons audio', 'Prevoir un flux securise pour importer ou enregistrer les extraits.'],
                        ['Voix par enfant', 'Associer une voix autorisee a un profil enfant precis.']
                      ].map(([title, text]) => (
                        <div key={title} className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100">{title}</p>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
                        <ClockIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                          Notifications parentales
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                          Rappels de coucher, fin de temps autorise et resume d'activite.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {[
                        ['Rappel du coucher', rulesForm.quiet_start_time ? `A partir de ${rulesForm.quiet_start_time}` : 'Horaire a configurer'],
                        ['Limite quotidienne', `${rulesForm.daily_screen_time_minutes || 0} minutes par jour`],
                        ['Resume enfant', latestActivityDate ? `Derniere activite ${formatDate(latestActivityDate)}` : 'Aucune activite recente']
                      ].map(([title, value]) => (
                        <div key={title} className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100">{title}</p>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-600 shadow-sm dark:bg-neutral-800 dark:text-neutral-200">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'access' && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                      Catégories approuvées pour {selectedKid.name}
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      Sélectionnez les catégories que {selectedKid.name} peut lire
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('account')}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                  >
                    <LockIcon className="w-5 h-5" />
                    <span>Compte enfant</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {approvals.length === 0 ? (
                    <p className="text-neutral-500 text-center py-8">
                      Chargement des catégories...
                    </p>
                  ) : (
                    approvals.map(approval => {
                      const guidance = getCategoryGuidance(approval);

                      return (
                      <motion.div
                        key={approval.category_id}
                        className="flex flex-col gap-4 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg sm:flex-row sm:items-center sm:justify-between"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start gap-3">
                          <BookIcon className="mt-1 w-5 h-5 shrink-0 text-red-500" />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {approval.category_name}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${guidanceToneClasses[guidance.tone]}`}>
                                {guidance.advice}
                              </span>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                              {guidance.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleApproval(approval.category_id, !approval.approved)}
                          className={`shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                            approval.approved
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-400'
                          }`}
                        >
                          {approval.approved ? (
                            <span className="flex items-center gap-2">
                              <CheckIcon className="w-4 h-4" />
                              Approuvé
                            </span>
                          ) : (
                            'Non approuvé'
                          )}
                        </button>
                      </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
              )}

              {activeSection === 'account' && (
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                        Compte enfant de {selectedKid.name}
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Ce compte sert uniquement a lire les livres autorises. Le paiement et les reglages restent dans l'espace parent.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAccountModal(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-bold text-white transition hover:bg-green-600"
                    >
                      <LockIcon className="h-5 w-5" />
                      Creer un compte enfant
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                      <p className="font-bold text-green-700 dark:text-green-300">Connexion simple</p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        Un identifiant enfant, sans carte bancaire ni espace paiement.
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <p className="font-bold text-blue-700 dark:text-blue-300">Acces limite</p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        Les livres visibles suivent les categories approuvees par le parent.
                      </p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                      <p className="font-bold text-red-700 dark:text-red-300">Parent responsable</p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        L'abonnement et les decisions restent cote adulte.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveSection('access')}
                      className="rounded-lg bg-neutral-100 px-4 py-2 font-bold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200"
                    >
                      Choisir les categories
                    </button>
                    <Link
                      to="/abonnements"
                      className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
                    >
                      Gerer l'abonnement parent
                    </Link>
                  </div>
                </div>
              )}
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex items-center justify-center h-full">
                <div className="text-center">
                  <ChildIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500 text-lg">
                    Sélectionnez un profil enfant pour gérer les approbations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kid Modal */}
      <AnimatePresence>
        {showKidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowKidModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  {editingKid ? 'Modifier le profil' : 'Nouveau profil enfant'}
                </h3>
                <button
                  onClick={() => setShowKidModal(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={kidForm.name}
                    onChange={(e) => setKidForm({ ...kidForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="Nom de l'enfant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Âge
                  </label>
                  <input
                    type="number"
                    value={kidForm.age}
                    onChange={(e) => setKidForm({ ...kidForm, age: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="Âge"
                    min="0"
                    max="18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={kidForm.date_of_birth}
                    onChange={(e) => setKidForm({ ...kidForm, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Photo ou avatar
                  </label>
                  <input
                    type="text"
                    value={kidForm.avatar}
                    onChange={(e) => setKidForm({ ...kidForm, avatar: e.target.value })}
                    className="mb-3 w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="Initiale ou petit nom"
                  />
                  <input
                    type="url"
                    value={kidForm.photo_url}
                    onChange={(e) => setKidForm({ ...kidForm, photo_url: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Langue preferee
                  </label>
                  <select
                    value={kidForm.preferred_language}
                    onChange={(e) => setKidForm({ ...kidForm, preferred_language: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                  >
                    {CONTENT_LANGUAGES.map((language) => (
                      <option key={language.id} value={language.id}>{language.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Centres d'interet
                  </label>
                  <input
                    type="text"
                    value={kidForm.interests}
                    onChange={(e) => setKidForm({ ...kidForm, interests: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="dinosaures, espace, animaux..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowKidModal(false)}
                    className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveKid}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {editingKid ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAccountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  Créer un compte pour {selectedKid?.name}
                </h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="Nom d'utilisateur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="Mot de passe (min. 6 caractères)"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Créer le compte
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ParentDashboard;

