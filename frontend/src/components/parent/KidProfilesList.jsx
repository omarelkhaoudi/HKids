import {motion} from 'framer-motion';
import {EditIcon, PlusIcon, TrashIcon, StarIcon} from '../Icons';
import {CONTENT_LANGUAGES} from '../../constants/contentOptions';
import {formatKidBirthDate} from '../../utils/kidProfiles';
import {useLanguage} from '../../context/LanguageContext';
import {useReducedMotion} from '../../hooks/useReducedMotion';
import {getHoverMotion, getMotionProps, kidsCardAppear, kidsStaggerContainer} from '../../constants/kidsMotion';
import {KidAvatar} from './KidAvatar';
import {ParentEmptyState} from './ParentEmptyState';

function getLanguageLabel(languageId) {
 return CONTENT_LANGUAGES.find((language) => language.id === languageId)?.shortLabel || 'FR';
}

export function KidProfilesList({kids, selectedKidId, onSelect, onAdd, onEdit, onDelete}) {
 const { t } = useLanguage();
 const reducedMotion = useReducedMotion();

 return (
 <div className="rounded-32 bg-card p-space-24 md:p-space-32 shadow-card border border-border/40">
 <div className="mb-space-24 flex flex-col sm:flex-row sm:items-center justify-between gap-space-16">
 <div>
 <h2 className="text-heading-xl font-black text-foreground">
 {t('parentProfilesTitle')}
 </h2>
 <p className="text-body-lg text-foreground-secondary font-medium mt-1">
 {t('parentProfilesDesc')}
 </p>
 </div>
 <button
 type="button"
 onClick={onAdd}
 className="inline-flex items-center gap-2 rounded-32 bg-primary-500 px-space-16 py-space-12 font-bold text-white transition hover:bg-primary-600 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
 >
 <PlusIcon className="h-5 w-5" aria-hidden="true" />
 <span>{t('parentKidFormAdd')}</span>
 </button>
 </div>

 {kids.length === 0 ? (
 <ParentEmptyState
 emoji="👧"
 title={t('parentProfilesEmpty')}
 description={t('parentNoKidsDesc')}
 actionLabel={t('parentKidFormAdd')}
 onAction={onAdd}
 />
 ) : (
 <motion.div
 className="grid grid-cols-1 gap-space-16 md:grid-cols-2 xl:grid-cols-3"
 {...(reducedMotion ? {} : kidsStaggerContainer)}
 >
 {kids.map((kid, index) => {
 const birthDate = formatKidBirthDate(kid.date_of_birth);
 const interests = Array.isArray(kid.interests) ? kid.interests : [];
 const active = selectedKidId === kid.id;

 return (
 <motion.article
 key={kid.id}
 {...getMotionProps(reducedMotion, {
 ...kidsCardAppear,
 transition: { ...kidsCardAppear.transition, delay: index * 0.05 },
 })}
 {...getHoverMotion(reducedMotion)}
 className={`rounded-32 border-2 p-space-24 transition shadow-card ${
 active
 ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-950/20'
 : 'border-border/60 bg-surface-secondary/40 hover:shadow-floating'
}`}
 >
 <button
 type="button"
 onClick={() => onSelect(kid)}
 className="w-full text-start min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-2xl"
 aria-pressed={active}
 >
 <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-start gap-space-16">
 <KidAvatar kid={kid} size="lg" />
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-heading-m font-black text-foreground">
 {kid.name}
 </h3>
 <p className="text-body text-foreground-muted font-medium">
 {kid.age ? t('parentKidAgeYears', { age: kid.age }) : t('parentKidAgeUnknown')} · {getLanguageLabel(kid.preferred_language)}
 </p>
 {birthDate && (
 <p className="mt-1 text-body text-foreground-muted">
 {t('parentKidBirthLabel', { date: birthDate })}
 </p>
 )}
 {active && (
 <span className="inline-flex items-center gap-1 mt-2 text-caption font-bold text-primary-600">
 <StarIcon className="w-3.5 h-3.5" aria-hidden="true" />
 {t('parentProfileSelected')}
 </span>
 )}
 </div>
 </div>
 </button>

 {interests.length > 0 && (
 <div className="mt-space-16 flex flex-wrap justify-center sm:justify-start gap-2">
 {interests.slice(0, 4).map((interest) => (
 <span
 key={interest}
 className="rounded-full bg-card px-3 py-1.5 text-caption font-bold text-foreground-secondary shadow-soft border border-border/50"
 >
 {interest}
 </span>
 ))}
 </div>
 )}

 <div className="mt-space-16 flex gap-2">
 <button
 type="button"
 onClick={() => onEdit(kid)}
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-3 py-2.5 text-body font-bold text-foreground-secondary transition hover:bg-primary-50 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
 >
 <EditIcon className="h-4 w-4" aria-hidden="true" />
 <span>{t('parentModify')}</span>
 </button>
 <button
 type="button"
 onClick={() => onDelete(kid)}
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-3 py-2.5 text-body font-bold text-danger-600 transition hover:bg-danger-50 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-400"
 >
 <TrashIcon className="h-4 w-4" aria-hidden="true" />
 <span>{t('parentDeleteKid')}</span>
 </button>
 </div>
 </motion.article>
 );
})}
 </motion.div>
 )}
 </div>
 );
}
