import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { parentalAPI } from '../api/parental';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Logo } from '../components/Logo';
import { KidProfilesList } from '../components/parent/KidProfilesList';
import { KidProfileFormModal } from '../components/parent/KidProfileFormModal';
import { LogOutIcon } from '../components/Icons';
import { buildKidPayload, createEmptyKidForm, kidToForm } from '../utils/kidProfiles';

function ParentKidsProfiles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const [form, setForm] = useState(() => createEmptyKidForm());

  const selectedKidId = selectedKid?.id || kids[0]?.id;

  useEffect(() => {
    if (!user) {
      navigate('/parent/login');
      return;
    }

    if (user.role !== 'parent' && user.role !== 'admin') {
      navigate('/');
      return;
    }

    loadKids();
  }, [user, navigate]);

  const stats = useMemo(() => {
    const withPhoto = kids.filter((kid) => kid.photo_url || kid.avatar).length;
    const withInterests = kids.filter((kid) => Array.isArray(kid.interests) && kid.interests.length > 0).length;

    return [
      { label: 'Profils', value: kids.length },
      { label: 'Avec avatar', value: withPhoto },
      { label: 'Interets renseignes', value: withInterests },
    ];
  }, [kids]);

  const loadKids = async () => {
    try {
      setLoading(true);
      const response = await parentalAPI.getKids();
      const kidsData = response.data || [];
      setKids(kidsData);
      setSelectedKid((current) => {
        if (!kidsData.length) return null;
        return kidsData.find((kid) => kid.id === current?.id) || kidsData[0];
      });
    } catch (error) {
      console.error('Error loading kids profiles:', error);
      showToast('Erreur lors du chargement des profils enfants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingKid(null);
    setForm(createEmptyKidForm());
    setShowModal(true);
  };

  const openEditModal = (kid) => {
    setEditingKid(kid);
    setForm(kidToForm(kid));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingKid(null);
    setForm(createEmptyKidForm());
  };

  const handleSave = async () => {
    const payload = buildKidPayload(form);

    if (!payload.name) {
      showToast('Le prenom est obligatoire', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = editingKid
        ? await parentalAPI.updateKid(editingKid.id, payload)
        : await parentalAPI.createKid(payload);

      showToast(editingKid ? 'Profil enfant mis a jour' : 'Profil enfant cree', 'success');
      closeModal();
      await loadKids();
      setSelectedKid(response.data);
    } catch (error) {
      console.error('Error saving kid profile:', error);
      showToast(error.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kid) => {
    const confirmed = window.confirm(`Supprimer le profil de ${kid.name} ?`);
    if (!confirmed) return;

    try {
      await parentalAPI.deleteKid(kid.id);
      showToast('Profil enfant supprime', 'success');
      await loadKids();
    } catch (error) {
      console.error('Error deleting kid profile:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo size="default" showText={true} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                Profils enfants
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Gerer les profils associes au parent connecte.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/parent"
              className="rounded-lg bg-white px-4 py-2 font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
            >
              <LogOutIcon className="h-5 w-5" />
              <span>Deconnexion</span>
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-800">
              <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                {item.label}
              </span>
              <span className="mt-1 block text-3xl font-black text-neutral-900 dark:text-neutral-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <KidProfilesList
          kids={kids}
          selectedKidId={selectedKidId}
          onSelect={setSelectedKid}
          onAdd={openCreateModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      <AnimatePresence>
        {showModal && (
          <KidProfileFormModal
            open={showModal}
            editingKid={editingKid}
            form={form}
            onChange={setForm}
            onClose={closeModal}
            onSubmit={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ParentKidsProfiles;
