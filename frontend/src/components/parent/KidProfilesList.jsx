import {motion} from 'framer-motion';
import {EditIcon, PlusIcon, TrashIcon} from '../Icons';
import {CONTENT_LANGUAGES} from '../../constants/contentOptions';
import {formatKidBirthDate} from '../../utils/kidProfiles';
import {useLanguage} from '../../context/LanguageContext';
import {KidAvatar} from './KidAvatar';

function getLanguageLabel(languageId) {
 return CONTENT_LANGUAGES.find((language) => language.id === languageId)?.shortLabel || 'FR';
}

export function KidProfilesList({kids, selectedKidId, onSelect, onAdd, onEdit, onDelete}) {
 const { t } = useLanguage();

 return (
 <div className="rounded-3xl bg-card p-6 shadow-lg">
 <div className="mb-5 flex items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-bold text-foreground">
 {t('parentProfilesTitle')}
 </h2>
 <p className="text-sm text-foreground-muted">
 {t('parentKidsCount', { count: kids.length })}
 </p>
 </div>
 <button
 onClick={onAdd}
 className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-4 py-2 font-bold text-white transition hover:bg-primary-600"
 >
 <PlusIcon className="h-5 w-5" />
 <span>{t('parentKidFormAdd')}</span>
 </button>
 </div>

 {kids.length === 0 ? (
 <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center">
 <p className="font-semibold text-foreground-secondary">
 {t('parentProfilesEmpty')}
 </p>
 <button
 onClick={onAdd}
 className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-4 py-2 font-bold text-white transition hover:bg-primary-600"
 >
 <PlusIcon className="h-5 w-5" />
 <span>{t('parentKidFormAdd')}</span>
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
 {kids.map((kid) => {
 const birthDate = formatKidBirthDate(kid.date_of_birth);
 const interests = Array.isArray(kid.interests) ? kid.interests : [];
 const active = selectedKidId === kid.id;

 return (
 <motion.div
 key={kid.id}
 whileHover={{y: -2}}
 className={`rounded-3xl border-2 p-4 transition ${
 active
 ? 'border-primary-500 bg-primary-50 /20'
 : 'border-border bg-surface-secondary hover:border-primary-200 /50'
}`}
 >
 <button
 onClick={() => onSelect(kid)}
 className="w-full text-left"
 >
 <div className="flex items-start gap-4">
 <KidAvatar kid={kid} />
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-lg font-black text-foreground">
 {kid.name}
 </h3>
 <p className="text-sm text-foreground-muted">
 {kid.age ? t('parentKidAgeYears', { age: kid.age }) : t('parentKidAgeUnknown')} - {getLanguageLabel(kid.preferred_language)}
 </p>
 {birthDate && (
 <p className="mt-1 text-sm text-foreground-muted">
 {t('parentKidBirthLabel', { date: birthDate })}
 </p>
 )}
 </div>
 </div>
 </button>

 {interests.length > 0 && (
 <div className="mt-4 flex flex-wrap gap-2">
 {interests.slice(0, 4).map((interest) => (
 <span
 key={interest}
 className="rounded-full bg-card px-3 py-1 text-xs font-bold text-foreground-secondary shadow-sm"
 >
 {interest}
 </span>
 ))}
 </div>
 )}

 <div className="mt-4 flex gap-2">
 <button
 onClick={() => onEdit(kid)}
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm font-bold text-foreground-600 transition hover:bg-primary-50"
 >
 <EditIcon className="h-4 w-4" />
 <span>{t('parentModify')}</span>
 </button>
 <button
 onClick={() => onDelete(kid)}
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm font-bold text-foreground-600 transition hover:bg-primary-50"
 >
 <TrashIcon className="h-4 w-4" />
 <span>{t('parentDeleteKid')}</span>
 </button>
 </div>
 </motion.div>
 );
})}
 </div>
 )}
 </div>
 );
}
