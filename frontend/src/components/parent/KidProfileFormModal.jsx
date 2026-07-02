import { motion } from 'framer-motion';
import { CONTENT_LANGUAGES } from '../../constants/contentOptions';
import { XIcon } from '../Icons';
import { KidAvatar } from './KidAvatar';

export function KidProfileFormModal({
  open,
  editingKid,
  form,
  onChange,
  onClose,
  onSubmit,
  saving = false,
}) {
  if (!open) return null;

  const previewKid = {
    name: form.name || 'Enfant',
    avatar: form.avatar,
    photo_url: form.photo_url,
  };

  const updateField = (field, value) => {
    onChange({ ...form, [field]: value });
  };

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateField('photo_url', String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              {editingKid ? 'Modifier le profil' : 'Ajouter un enfant'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Profil associe au parent connecte.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label="Fermer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700/50">
          <KidAvatar kid={previewKid} size="lg" />
          <div>
            <p className="font-bold text-neutral-800 dark:text-neutral-100">
              {form.name || 'Nouveau profil'}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              {form.preferred_language?.toUpperCase() || 'FR'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Prenom
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholder="Prenom de l'enfant"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Age
            </label>
            <input
              type="number"
              value={form.age}
              onChange={(event) => updateField('age', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              min="0"
              max="18"
              placeholder="Age"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Date de naissance
            </label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(event) => updateField('date_of_birth', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Langue preferee
            </label>
            <select
              value={form.preferred_language}
              onChange={(event) => updateField('preferred_language', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            >
              {CONTENT_LANGUAGES.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Avatar
            </label>
            <input
              type="text"
              value={form.avatar}
              onChange={(event) => updateField('avatar', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholder="Initiale ou petit nom"
              maxLength={24}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="mb-3 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1 file:font-bold file:text-red-600 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:file:bg-neutral-800"
            />
            <input
              type="url"
              value={form.photo_url}
              onChange={(event) => updateField('photo_url', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Centres d'interet
            </label>
            <input
              type="text"
              value={form.interests}
              onChange={(event) => updateField('interests', event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholder="dinosaures, espace, animaux..."
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-200 px-5 py-2 font-bold text-neutral-800 transition hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-lg bg-red-500 px-5 py-2 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Enregistrement...' : editingKid ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
