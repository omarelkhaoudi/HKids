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
  const [loading, setLoading] = useState(true);
  const [showKidModal, setShowKidModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const [kidForm, setKidForm] = useState({ name: '', age: '', avatar: '' });
  const [accountForm, setAccountForm] = useState({ username: '', password: '' });

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
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

  const handleSelectKid = (kid) => {
    setSelectedKid(kid);
    loadApprovals(kid.id);
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
    navigate('/admin/login');
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

