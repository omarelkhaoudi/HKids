import { getAppLanguage } from './i18n';
import { getLocaleFromLanguage } from './translations';

export const createEmptyKidForm = () => ({
  name: '',
  age: '',
  date_of_birth: '',
  avatar: '',
  photo_url: '',
  preferred_language: 'fr',
  interests: '',
  school_level: '',
  favorite_themes: [],
});

export const getKidBirthDateInputValue = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

export const kidToForm = (kid = {}) => ({
  name: kid.name || '',
  age: kid.age ?? '',
  date_of_birth: getKidBirthDateInputValue(kid.date_of_birth),
  avatar: kid.avatar || '',
  photo_url: kid.photo_url || '',
  preferred_language: kid.preferred_language || 'fr',
  interests: Array.isArray(kid.interests) ? kid.interests.join(', ') : kid.interests || '',
  school_level: kid.school_level || '',
  favorite_themes: Array.isArray(kid.favorite_themes) ? kid.favorite_themes : [],
});

export const buildKidPayload = (form) => ({
  name: form.name.trim(),
  age: form.age === '' ? null : Number.parseInt(form.age, 10),
  date_of_birth: form.date_of_birth || null,
  avatar: form.avatar.trim() || null,
  photo_url: form.photo_url.trim() || null,
  preferred_language: form.preferred_language || 'fr',
  interests: form.interests,
  school_level: form.school_level || null,
  favorite_themes: Array.isArray(form.favorite_themes) ? form.favorite_themes : [],
});

export const formatKidBirthDate = (value, language = getAppLanguage()) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(getLocaleFromLanguage(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getKidInitial = (kid) => {
  const source = kid?.avatar || kid?.name || '?';
  return String(source).trim().charAt(0).toUpperCase() || '?';
};
