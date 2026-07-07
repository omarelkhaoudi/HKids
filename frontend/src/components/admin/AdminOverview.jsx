import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../api/admin';
import { formatAdminDate, formatAdminDuration } from './AdminMetricCard';
import { 
  AudioIcon, BookIcon, CheckIcon, ChildIcon, ClockIcon, HistoryIcon, UserIcon,
  TrendingUpIcon, ActivityIcon, SparklesIcon
} from '../Icons';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-4 bg-surface-200 rounded w-1/3"></div>
      <div className="w-10 h-10 bg-surface-100 rounded-lg"></div>
    </div>
    <div className="h-8 bg-surface-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-surface-100 rounded w-1/4"></div>
  </div>
);

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, colorClass, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
    whileHover={{ y: -4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}
    className="bg-white rounded-[1.5rem] p-6 border border-surface-200 shadow-sm relative overflow-hidden group"
  >
    {/* Subtle gradient background on hover */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${colorClass.bg}`}></div>
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider">{title}</h3>
      <div className={`p-2 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="relative z-10">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black text-surface-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <TrendingUpIcon className={`w-3 h-3 ${trend < 0 && 'rotate-180'}`} /> {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs text-surface-400 font-medium mt-1">{subtitle}</p>
    </div>
  </motion.div>
);

function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getOverview();
        setData(response.data);
        setError('');
      } catch (err) {
        console.error('Error loading admin overview:', err);
        setError("Impossible de charger la vue d'ensemble.");
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 bg-surface-200 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 font-bold text-rose-700">{error}</div>;
  }

  const summary = data?.summary || {};
  
  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">Bonjour, Admin 👋</h1>
          <p className="text-surface-500 font-medium mt-1">Voici ce qui se passe sur HKids aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-surface-200 shadow-sm text-surface-600">
          <ActivityIcon className="w-4 h-4 text-emerald-500" />
          Système Opérationnel
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          index={0} title="Utilisateurs" value={summary.total_parents || 0} subtitle="Comptes parents créés" icon={UserIcon} trend={12} 
          colorClass={{bg: 'bg-blue-50', text: 'text-blue-600'}} 
        />
        <MetricCard 
          index={1} title="Enfants Actifs" value={summary.total_children || 0} subtitle="Profils lecteurs" icon={ChildIcon} trend={8} 
          colorClass={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} 
        />
        <MetricCard 
          index={2} title="Abonnements" value={summary.active_subscriptions || 0} subtitle="Forfaits actifs (MRR)" icon={CheckIcon} trend={15} 
          colorClass={{bg: 'bg-violet-50', text: 'text-violet-600'}} 
        />
        <MetricCard 
          index={3} title="Histoires IA" value={summary.total_stories || 0} subtitle="Générées au total" icon={SparklesIcon} trend={24} 
          colorClass={{bg: 'bg-amber-50', text: 'text-amber-500'}} 
        />
      </div>

      {/* MODULAR WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ACTIVITY */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-surface-900">Activité Récente</h2>
            <button className="text-primary-600 font-bold text-sm hover:underline">Voir tout</button>
          </div>
          <div className="space-y-4">
            {data?.recent_activity?.length > 0 ? data.recent_activity.slice(0,5).map((item, i) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <AudioIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-surface-900 text-sm"><span className="text-primary-600">{item.kid_name}</span> a écouté <span className="font-black">"{item.book_title}"</span></p>
                  <div className="flex items-center gap-3 mt-1 text-xs font-bold text-surface-400">
                    <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {formatAdminDuration(item.duration_seconds)}</span>
                    <span>•</span>
                    <span>{formatAdminDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-3"><HistoryIcon className="w-8 h-8 text-surface-300"/></div>
                <p className="text-surface-500 font-medium">Aucune activité récente.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* SIDE COLUMN */}
        <div className="space-y-6">
          
          {/* LATEST USERS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-[2rem] p-6 border border-surface-200 shadow-sm">
            <h2 className="text-lg font-black text-surface-900 mb-4">Nouveaux Utilisateurs</h2>
            <div className="space-y-3">
              {data?.latest_users?.length > 0 ? data.latest_users.slice(0,4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 font-bold uppercase text-xs">
                      {item.username.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-surface-900 text-sm">{item.username}</p>
                      <p className="text-xs text-surface-400 font-medium">{formatAdminDate(item.created_at)}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">Parent</span>
                </div>
              )) : (
                <p className="text-sm text-surface-500 text-center py-4">Aucun utilisateur récent.</p>
              )}
            </div>
          </motion.div>

          {/* LATEST CONTENTS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-[2rem] p-6 border border-surface-200 shadow-sm">
            <h2 className="text-lg font-black text-surface-900 mb-4">Derniers Contenus</h2>
            <div className="space-y-3">
              {data?.latest_books?.length > 0 ? data.latest_books.slice(0,4).map((item) => (
                <div key={item.id} className="p-3 rounded-2xl hover:bg-surface-50 transition-colors border border-surface-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-surface-900 text-sm truncate pr-2">{item.title}</p>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_published ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                  </div>
                  <p className="text-xs text-surface-400 font-medium truncate">{item.category_name || 'Généré par IA'}</p>
                </div>
              )) : (
                <p className="text-sm text-surface-500 text-center py-4">Aucun contenu récent.</p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
