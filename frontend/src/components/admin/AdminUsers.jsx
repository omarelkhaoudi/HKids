import {useEffect, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {adminAPI} from '../../api/admin';
import {formatAdminDate, formatAdminDuration} from './AdminMetricCard';
import {ChildIcon, ClockIcon, UserIcon, SearchIcon, MailIcon, StarIcon, XIcon, TrashIcon} from '../Icons';
import {Avatar, Badge, Button} from '../ui';

function AdminUsers() {
 const [parents, setParents] = useState([]);
 const [selectedParent, setSelectedParent] = useState(null);
 const [detail, setDetail] = useState(null);
 const [loading, setLoading] = useState(true);
 const [detailLoading, setDetailLoading] = useState(false);
 const [search, setSearch] = useState('');
 const [deleting, setDeleting] = useState(false);

 useEffect(() => {
 const loadParents = async () => {
 try {
 setLoading(true);
 const response = await adminAPI.getUsers();
 setParents(response.data || []);
} catch (err) {
 console.error('Error loading admin users:', err);
} finally {
 setLoading(false);
}
};

 loadParents();
}, []);

 const deleteParent = async () => {
 if (!selectedParent) return;
 const reason = window.prompt('Motif de suppression du compte (journalisé)');
 if (reason === null) return;
 if (!window.confirm(`Supprimer définitivement le compte "${selectedParent.name}" et toutes ses données ?`)) return;
 try {
 setDeleting(true);
 await adminAPI.deleteUser(selectedParent.id, reason);
 setParents((current) => current.filter((parent) => parent.id !== selectedParent.id));
 setSelectedParent(null);
 setDetail(null);
} catch (err) {
 window.alert(err.response?.data?.error || 'Suppression impossible.');
} finally {
 setDeleting(false);
}
};

 const openParent = async (parent) => {
 try {
 setSelectedParent(parent);
 setDetailLoading(true);
 const response = await adminAPI.getUserDetail(parent.id);
 setDetail(response.data);
} catch (err) {
 console.error('Error loading parent detail:', err);
 setDetail(null);
} finally {
 setDetailLoading(false);
}
};

 const totalChildren = detail?.kids?.length || selectedParent?.children_count || 0;
 const totalTime = detail?.kids?.reduce((sum, kid) => sum + Number(kid.total_time_seconds || 0), 0) || 0;
 const lastActivity = detail?.kids?.map((kid) => kid.last_activity_at).filter(Boolean).sort().reverse()[0] || null;

 const filteredParents = parents.filter(p => 
 p.name?.toLowerCase().includes(search.toLowerCase()) || 
 p.email?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-black text-foreground tracking-tight">Utilisateurs</h1>
 <p className="text-foreground-muted font-medium mt-1">Gérez les comptes parents et profils enfants.</p>
 </div>
 </div>

 <div className="flex flex-col xl:flex-row gap-6">
 
 {/* USERS TABLE */}
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="flex-1 min-w-0 bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden flex flex-col">
 <div className="p-4 border-b border-border flex items-center justify-between bg-surface-secondary">
 <div className="relative w-full max-w-sm">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Rechercher par nom ou email..."
 className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
 />
 </div>
 </div>
 
 <div className="overflow-x-auto flex-1">
 {loading ? (
 <div className="space-y-4 p-4">
 {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface-secondary rounded-xl animate-pulse"></div>)}
 </div>
 ) : filteredParents.length === 0 ? (
 <div className="p-12 text-center">
 <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4"><UserIcon className="w-8 h-8 text-surface-300"/></div>
 <h3 className="text-lg font-bold text-foreground">Aucun utilisateur trouvé</h3>
 </div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead className="bg-card sticky top-0 z-10 shadow-sm">
 <tr>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Parent</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Abonnement</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-center">Enfants</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Inscription</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredParents.map((parent) => (
 <tr 
 key={parent.id} 
 onClick={() => openParent(parent)}
 className={`hover:bg-surface-secondary cursor-pointer transition-colors ${selectedParent?.id === parent.id ? 'bg-primary-50/50' : ''}`}
 >
 <td className="p-4">
 <div className="flex items-center gap-3">
 <Avatar fallback={parent.name.charAt(0)} className={`w-10 h-10 font-bold text-white ${selectedParent?.id === parent.id ? 'bg-primary-500' : 'bg-surface-300'}`} />
 <div>
 <p className="font-bold text-foreground text-sm">{parent.name}</p>
 <p className="text-xs text-foreground-muted font-medium">{parent.email || '-'}</p>
 </div>
 </div>
 </td>
 <td className="p-4">
 <Badge variant={parent.subscription_status === 'free' ? 'secondary' : 'success'} className="font-bold">
 {parent.subscription_status === 'free' ? 'Gratuit' : 'Premium'}
 </Badge>
 </td>
 <td className="p-4 text-center">
 <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-secondary text-foreground-secondary font-bold text-xs">
 {parent.children_count || 0}
 </span>
 </td>
 <td className="p-4 text-right">
 <div className="text-sm font-medium text-foreground-secondary">{formatAdminDate(parent.created_at)}</div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </motion.div>

 {/* SIDE DRAWER OVERLAY (Mobile/Tablet Only) */}
 <AnimatePresence>
 {selectedParent && (
 <motion.div 
 initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
 className="fixed inset-0 z-40 bg-surface-900/30 backdrop-blur-sm xl:hidden" 
 onClick={() => setSelectedParent(null)}
 />
 )}
 </AnimatePresence>

 {/* SIDE DRAWER FOR USER DETAILS */}
 <AnimatePresence>
 {selectedParent && (
 <motion.div 
 initial={{opacity: 0, x: 50}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 50}} transition={{type: 'spring', damping: 25, stiffness: 200}}
 className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-[#fafafa] shadow-2xl xl:relative xl:inset-auto xl:z-auto xl:w-[380px] xl:bg-transparent xl:shadow-none shrink-0 flex flex-col h-full xl:h-auto overflow-hidden"
 >
 <div className="flex-1 overflow-y-auto p-4 xl:p-0 space-y-6 pb-24 xl:pb-0">
 {/* Parent Summary Card */}
 <div className="bg-card rounded-[2rem] border border-border shadow-sm relative overflow-hidden">
 <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-500 to-primary-500"></div>
 <button onClick={() => setSelectedParent(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md transition-colors"><XIcon className="w-5 h-5"/></button>
 
 <div className="relative pt-12 px-6 pb-6">
 <div className="w-24 h-24 bg-card p-1.5 rounded-[1.5rem] shadow-lg mb-4">
 <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center text-white text-4xl font-black uppercase">
 {selectedParent.name.charAt(0)}
 </div>
 </div>
 
 <h3 className="text-2xl font-black text-foreground mb-1 leading-tight break-words">{detail?.parent?.name || selectedParent.name}</h3>
 <div className="flex items-center gap-2 text-foreground-muted font-medium text-sm mb-6">
 <MailIcon className="w-4 h-4 shrink-0" />
 <span className="truncate">{detail?.parent?.email || selectedParent.email || 'Email inconnu'}</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
 <div className="bg-surface-secondary rounded-2xl p-4 border border-border flex flex-col justify-center items-center">
 <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">Abonnement</div>
 <div className={`text-base font-black ${selectedParent.subscription_status === 'free' ? 'text-foreground-secondary' : 'text-secondary-600'}`}>
 {selectedParent.subscription_status === 'free' ? 'Gratuit' : 'Premium'}
 </div>
 </div>
 <div className="bg-surface-secondary rounded-2xl p-4 border border-border flex flex-col justify-center items-center">
 <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">Inscription</div>
 <div className="text-base font-black text-foreground-secondary">{formatAdminDate(selectedParent.created_at).split(' ')[0]}</div>
 </div>
 </div>

 <div className="space-y-3 pt-4 border-t border-border">
 <div className="flex justify-between items-center p-3 bg-surface-secondary rounded-xl border border-border">
 <span className="text-foreground-secondary font-bold flex items-center gap-2 text-sm"><ChildIcon className="w-4 h-4 text-surface-400"/> Enfants</span>
 <Badge variant="soft" className="bg-card text-foreground font-black border border-border">{totalChildren} profils</Badge>
 </div>
 <div className="flex justify-between items-center p-3 bg-surface-secondary rounded-xl border border-border">
 <span className="text-foreground-secondary font-bold flex items-center gap-2 text-sm"><ClockIcon className="w-4 h-4 text-surface-400"/> Temps d'écoute</span>
 <Badge variant="soft" className="bg-card text-foreground font-black border border-border">{formatAdminDuration(totalTime)}</Badge>
 </div>
 <Button
 variant="outline"
 fullWidth
 disabled={deleting}
 onClick={deleteParent}
 className="mt-5 border-rose-200 text-rose-600 hover:bg-rose-50"
 >
 <TrashIcon className="w-4 h-4 mr-2" /> {deleting ? 'Suppression...' : 'Supprimer ce compte'}
 </Button>
 </div>
 </div>
 </div>

 {/* Children Profiles List */}
 <div className="bg-card rounded-[2rem] border border-border shadow-sm p-6">
 <h4 className="font-black text-foreground mb-5 flex items-center gap-2 text-lg"><ChildIcon className="w-6 h-6 text-foreground-500"/> Profils Enfants</h4>
 
 {detailLoading ? (
 <div className="space-y-4">
 <div className="h-24 bg-surface-secondary rounded-2xl animate-pulse"></div>
 <div className="h-24 bg-surface-secondary rounded-2xl animate-pulse"></div>
 </div>
 ) : detail?.kids?.length > 0 ? (
 <div className="space-y-4">
 {detail.kids.map(kid => (
 <div key={kid.id} className="p-4 bg-surface-secondary border border-border rounded-2xl hover:border-primary-100 hover:shadow-sm transition-all group">
 <div className="flex justify-between items-start mb-3">
 <div className="min-w-0 flex-1 pr-2">
 <h5 className="font-black text-foreground text-lg flex items-center gap-2 truncate">
 {kid.name}
 {kid.is_premium_voice && <StarIcon className="w-5 h-5 text-accent-500 shrink-0" title="Premium Voice" />}
 </h5>
 <p className="text-sm font-bold text-foreground-muted mt-1 truncate">
 {kid.age ? `${kid.age} ans` : 'Âge N/A'} • <span className="uppercase text-surface-400">{kid.preferred_language || 'fr'}</span>
 </p>
 </div>
 <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
 <span className="text-xl font-black text-foreground-500">{kid.name.charAt(0)}</span>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/60">
 <div className="bg-card p-2 rounded-xl border border-border text-center">
 <span className="text-foreground-600 font-black text-lg block leading-none mb-1">{kid.total_sessions || 0}</span>
 <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Sessions</span>
 </div>
 <div className="bg-card p-2 rounded-xl border border-border text-center">
 <span className="text-secondary-600 font-black text-lg block leading-none mb-1">{Math.round((kid.total_time_seconds || 0)/60)}</span>
 <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Minutes</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-10 bg-surface-secondary rounded-2xl border border-border border-dashed">
 <div className="w-14 h-14 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border"><ChildIcon className="w-6 h-6 text-surface-400"/></div>
 <p className="text-base font-bold text-foreground mb-1">Aucun profil enfant</p>
 <p className="text-sm font-medium text-foreground-muted">Ce parent n'a pas encore créé de profils.</p>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
}

export default AdminUsers;
