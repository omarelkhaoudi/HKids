import {getKidInitial} from '../../utils/kidProfiles';

export function KidAvatar({ kid, size = 'md', className = '' }) {
 const sizes = {
 sm: 'h-12 w-12 text-lg',
 md: 'h-16 w-16 text-2xl',
 lg: 'h-20 w-20 text-3xl',
 xl: 'h-28 w-28 text-4xl md:h-36 md:w-36 md:text-5xl',
};
 const sizeClass = sizes[size] || sizes.md;
 const ringClass = 'rounded-full object-cover ring-4 ring-white shadow-sm dark:ring-surface-800';

 if (kid?.photo_url) {
 return (
 <img
 src={kid.photo_url}
 alt={kid.name || 'Profil enfant'}
 className={`${sizeClass} ${ringClass} ${className}`.trim()}
 />
 );
}

 return (
 <div className={`${sizeClass} grid place-items-center rounded-full bg-primary-500 font-black text-white ring-4 ring-white shadow-sm dark:ring-surface-800 ${className}`.trim()}>
 {getKidInitial(kid)}
 </div>
 );
}
