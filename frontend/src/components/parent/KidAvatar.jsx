import {getKidInitial} from '../../utils/kidProfiles';

export function KidAvatar({kid, size = 'md'}) {
 const sizes = {
 sm: 'h-12 w-12 text-lg',
 md: 'h-16 w-16 text-2xl',
 lg: 'h-20 w-20 text-3xl',
};
 const className = sizes[size] || sizes.md;

 if (kid?.photo_url) {
 return (
 <img
 src={kid.photo_url}
 alt={kid.name || 'Profil enfant'}
 className={`${className} rounded-full object-cover ring-4 ring-white shadow-sm dark:ring-surface-800`}
 />
 );
}

 return (
 <div className={`${className} grid place-items-center rounded-full bg-primary-500 font-black text-white ring-4 ring-white shadow-sm dark:ring-surface-800`}>
 {getKidInitial(kid)}
 </div>
 );
}
