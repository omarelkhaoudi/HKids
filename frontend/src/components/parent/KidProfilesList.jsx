import { motion } from 'framer-motion';
import { EditIcon, PlusIcon, TrashIcon } from '../Icons';
import { CONTENT_LANGUAGES } from '../../constants/contentOptions';
import { formatKidBirthDate } from '../../utils/kidProfiles';
import { KidAvatar } from './KidAvatar';

function getLanguageLabel(languageId) {
  return CONTENT_LANGUAGES.find((language) => language.id === languageId)?.shortLabel || 'FR';
}

export function KidProfilesList({ kids, selectedKidId, onSelect, onAdd, onEdit, onDelete }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-800">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
            Profils enfants
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {kids.length} {kids.length > 1 ? 'profils' : 'profil'}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Ajouter un enfant</span>
        </button>
      </div>

      {kids.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center dark:border-neutral-700">
          <p className="font-semibold text-neutral-700 dark:text-neutral-200">
            Aucun profil enfant
          </p>
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Ajouter un enfant</span>
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
                whileHover={{ y: -2 }}
                className={`rounded-xl border-2 p-4 transition ${
                  active
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-neutral-100 bg-neutral-50 hover:border-red-200 dark:border-neutral-700 dark:bg-neutral-700/50'
                }`}
              >
                <button
                  onClick={() => onSelect(kid)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4">
                    <KidAvatar kid={kid} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-black text-neutral-900 dark:text-neutral-100">
                        {kid.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-300">
                        {kid.age ? `${kid.age} ans` : 'Age non renseigne'} - {getLanguageLabel(kid.preferred_language)}
                      </p>
                      {birthDate && (
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
                          Naissance: {birthDate}
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
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-600 shadow-sm dark:bg-neutral-800 dark:text-neutral-200"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onEdit(kid)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    <EditIcon className="h-4 w-4" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => onDelete(kid)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Supprimer</span>
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
