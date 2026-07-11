import { motion } from 'framer-motion';
import {CONTENT_LANGUAGES} from '../../constants/contentOptions';
import {useLanguage} from '../../context/LanguageContext';
import {XIcon} from '../Icons';
import {KidAvatar} from './KidAvatar';

export function KidProfileFormModal({
 open,
 editingKid,
 form,
 onChange,
 onClose,
 onSubmit,
 saving = false,
}) {
 const { t } = useLanguage();
 if (!open) return null;

 const previewKid = {
 name: form.name || t('parentChild'),
 avatar: form.avatar,
 photo_url: form.photo_url,
};

 const updateField = (field, value) => {
 onChange({...form, [field]: value});
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
 initial={{opacity: 0}}
 animate={{opacity: 1}}
 exit={{opacity: 0}}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
 onClick={onClose}
 >
 <motion.div
 initial={{scale: 0.95, opacity: 0}}
 animate={{scale: 1, opacity: 1}}
 exit={{scale: 0.95, opacity: 0}}
 onClick={(event) => event.stopPropagation()}
 className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
 >
 <div className="mb-5 flex items-center justify-between gap-4">
 <div>
 <h3 className="text-xl font-bold text-foreground">
 {editingKid ? t('parentKidFormEdit') : t('parentKidFormAdd')}
 </h3>
 <p className="text-sm text-foreground-muted">
 {t('parentKidFormSubtitle')}
 </p>
 </div>
 <button
 onClick={onClose}
 className="rounded-2xl p-2 text-foreground-muted transition hover:bg-surface-secondary"
 aria-label={t('parentKidFormClose')}
 >
 <XIcon className="h-5 w-5" />
 </button>
 </div>

 <div className="mb-6 flex items-center gap-4 rounded-3xl bg-surface-secondary p-4 /50">
 <KidAvatar kid={previewKid} size="lg" />
 <div>
 <p className="font-bold text-foreground">
 {form.name || t('parentKidFormNewProfile')}
 </p>
 <p className="text-sm text-foreground-muted">
 {form.preferred_language?.toUpperCase() || 'FR'}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <div>
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormFirstName')}
 </label>
 <input
 type="text"
 value={form.name}
 onChange={(event) => updateField('name', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 placeholder={t('parentKidFormFirstNamePlaceholder')}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormAge')}
 </label>
 <input
 type="number"
 value={form.age}
 onChange={(event) => updateField('age', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 min="0"
 max="18"
 placeholder={t('parentKidFormAge')}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormBirthDate')}
 </label>
 <input
 type="date"
 value={form.date_of_birth}
 onChange={(event) => updateField('date_of_birth', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormLanguage')}
 </label>
 <select
 value={form.preferred_language}
 onChange={(event) => updateField('preferred_language', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 >
 {CONTENT_LANGUAGES.map((language) => (
 <option key={language.id} value={language.id}>
 {language.label}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormAvatar')}
 </label>
 <input
 type="text"
 value={form.avatar}
 onChange={(event) => updateField('avatar', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 placeholder={t('parentKidFormAvatarPlaceholder')}
 maxLength={24}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormPhoto')}
 </label>
 <input
 type="file"
 accept="image/*"
 onChange={handlePhotoFileChange}
 className="mb-3 w-full rounded-2xl border border-surface-300 px-4 py-2 text-sm file:mr-3 file:rounded-2xl file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:font-bold file:text-foreground-600 dark:file:bg-surface-800"
 />
 <input
 type="url"
 value={form.photo_url}
 onChange={(event) => updateField('photo_url', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 placeholder="https://..."
 />
 </div>

 <div className="md:col-span-2">
 <label className="mb-2 block text-sm font-bold text-foreground-secondary">
 {t('parentKidFormInterests')}
 </label>
 <input
 type="text"
 value={form.interests}
 onChange={(event) => updateField('interests', event.target.value)}
 className="w-full rounded-2xl border border-surface-300 px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
 placeholder={t('parentKidFormInterestsPlaceholder')}
 />
 </div>
 </div>

 <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <button
 onClick={onClose}
 className="rounded-2xl bg-surface-200 px-5 py-2 font-bold text-foreground transition hover:bg-surface-300"
 >
 {t('parentCancel')}
 </button>
 <button
 onClick={onSubmit}
 disabled={saving}
 className="rounded-2xl bg-primary-500 px-5 py-2 font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {saving ? t('parentSaving') : editingKid ? t('parentModify') : t('parentCreate')}
 </button>
 </div>
 </motion.div>
 </motion.div>
 );
}
