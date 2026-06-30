import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { parentalAPI } from '../api/parental';
import { categoriesAPI } from '../api/books';
import { useToast } from '../components/ToastProvider';
import { 
  UserIcon, LogOutIcon, PlusIcon, XIcon, CheckIcon, 
  ChildIcon, LockIcon, EditIcon, TrashIcon, BookIcon
} from '../components/Icons';
import { Logo } from '../components/Logo';

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
  const [loading, setLoading] = useState(true);
  const [showKidModal, setShowKidModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const [kidForm, setKidForm] = useState({ name: '', age: '', avatar: '' });
  const [accountForm, setAccountForm] = useState({ username: '', password: '' });
  const [goalForm, setGoalForm] = useState({
    goal_type: 'minutes',
    target_value: 20,
    period: 'weekly'
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
      setKids(kidsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async (kidId) => {
    try {
      const res = await parentalAPI.getApprovals(kidId);
      const approvalsData = res.data;
      
      // Create a map of all categories with their approval status
      const approvalsMap = new Map();
      approvalsData.forEach(approval => {
        approvalsMap.set(approval.category_id, approval.approved);
      });

      // Create approvals array for all categories
      const allApprovals = categories.map(cat => ({
        category_id: cat.id,
        category_name: cat.name,
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

  const handleSelectKid = (kid) => {
    setSelectedKid(kid);
    loadApprovals(kid.id);
    loadKidActivity(kid.id);
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
    try {
      if (editingKid) {
        await parentalAPI.updateKid(editingKid.id, kidForm);
        showToast('Profil enfant mis à jour', 'success');
      } else {
        await parentalAPI.createKid(kidForm);
        showToast('Profil enfant créé', 'success');
      }
      setShowKidModal(false);
      setEditingKid(null);
      setKidForm({ name: '', age: '', avatar: '' });
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
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              Tableau de bord Parent
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOutIcon className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kids List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  Profils Enfants
                </h2>
                <button
                  onClick={() => {
                    setEditingKid(null);
                    setKidForm({ name: '', age: '', avatar: '' });
                    setShowKidModal(true);
                  }}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
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
                          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white text-xl font-bold">
                            {kid.name.charAt(0).toUpperCase()}
                          </div>
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
                              setKidForm({ name: kid.name, age: kid.age || '', avatar: kid.avatar || '' });
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
                    </>
                  )}
                </div>

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
                    onClick={() => {
                      setShowAccountModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <LockIcon className="w-5 h-5" />
                    <span>Créer un compte</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {approvals.length === 0 ? (
                    <p className="text-neutral-500 text-center py-8">
                      Chargement des catégories...
                    </p>
                  ) : (
                    approvals.map(approval => (
                      <motion.div
                        key={approval.category_id}
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-3">
                          <BookIcon className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {approval.category_name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleApproval(approval.category_id, !approval.approved)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                    ))
                  )}
                </div>
              </div>
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

