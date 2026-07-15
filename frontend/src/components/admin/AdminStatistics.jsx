import {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {adminAPI} from '../../api/admin';
import {formatAdminDate, formatAdminDuration} from './AdminMetricCard';
import {metricToneAtIndex} from '../../constants/brandTheme';
import {AudioIcon, BookIcon, ClockIcon, HistoryIcon, UserIcon, ArrowRightIcon, SparklesIcon} from '../Icons';
import { useLanguage } from '../../context/LanguageContext';

function BarRow({label, value, max, detail, colorClass ="bg-primary-500", icon: Icon}) {
 const width = max > 0 ? Math.max(8, Math.round((Number(value || 0) / max) * 100)) : 0;

 return (
 <div className="group relative">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 {Icon && <Icon className="w-4 h-4 text-surface-400" />}
 <span className="font-bold text-foreground text-sm truncate max-w-[200px]">{label}</span>
 </div>
 <span className="font-black text-foreground text-sm">{value || 0}</span>
 </div>
 <div className="h-2.5 overflow-hidden rounded-full bg-surface-secondary flex items-center">
 <motion.div 
 initial={{width: 0}}
 animate={{width: `${width}%`}}
 transition={{duration: 1, type:"spring", bounce: 0.2}}
 className={`h-full rounded-full ${colorClass}`} 
 />
 </div>
 {detail && <p className="text-xs text-surface-400 font-medium mt-1.5">{detail}</p>}
 </div>
 );
}

function StatCard({title, value, detail, icon: Icon, tone, index}) {
 return (
 <motion.div 
 initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: index * 0.1}}
 className="bg-card p-6 rounded-[2rem] border border-border shadow-sm relative overflow-hidden group"
 >
 <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 transition-transform group-hover:scale-150 duration-700 ${tone.split(' ')[0]}`}></div>
 <div className="relative z-10 flex flex-col h-full">
 <div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-2xl ${tone}`}>
 <Icon className="w-6 h-6" />
 </div>
 </div>
 <div className="mt-auto">
 <span className="block text-3xl font-black text-foreground tracking-tight">{value}</span>
 <span className="block text-sm font-bold text-foreground-muted uppercase tracking-wider mt-1">{title}</span>
 <span className="block text-xs font-medium text-surface-400 mt-2">{detail}</span>
 </div>
 </div>
 </motion.div>
 );
}

function AdminStatistics() {
 const { t } = useLanguage();
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const loadStats = async () => {
 try {
 setLoading(true);
 const response = await adminAPI.getStatistics();
 setData(response.data);
} catch (err) {
 console.error('Error loading admin statistics:', err);
} finally {
 setLoading(false);
}
};
 loadStats();
}, []);

 if (loading) {
 return (
 <div className="space-y-6 pb-12">
 <div className="h-10 bg-surface-200 rounded-lg w-1/4 animate-pulse"></div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
 {[1,2,3,4].map(i => <div key={i} className="h-40 bg-card rounded-[2rem] border border-border animate-pulse"></div>)}
 </div>
 </div>
 );
}

 const summary = data?.summary || {};
 const maxBookListens = Math.max(0, ...(data?.top_books || []).map((item) => Number(item.listens_count || 0)));
 const maxCategoryListens = Math.max(0, ...(data?.top_categories || []).map((item) => Number(item.listens_count || 0)));

 return (
 <div className="space-y-8 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-black text-foreground tracking-tight">{t('adminStatsTitle')}</h1>
 <p className="text-foreground-muted font-medium mt-1">{t('adminStatsSubtitle')}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
 <StatCard index={0} title={t('adminStatsListens')} value={summary.total_listens || 0} detail={t('adminStatsListensDesc')} icon={AudioIcon} tone={`${metricToneAtIndex(0).bg} ${metricToneAtIndex(0).text}`} />
 <StatCard index={1} title={t('adminStatsTotalTime')} value={formatAdminDuration(summary.total_listening_seconds)} detail={t('adminStatsTotalTimeDesc')} icon={ClockIcon} tone={`${metricToneAtIndex(1).bg} ${metricToneAtIndex(1).text}`} />
 <StatCard index={2} title={t('adminStatsAvgTime')} value={formatAdminDuration(summary.average_listening_seconds)} detail={t('adminStatsAvgTimeDesc')} icon={HistoryIcon} tone={`${metricToneAtIndex(2).bg} ${metricToneAtIndex(2).text}`} />
 <StatCard index={3} title={t('adminStatsActiveKids')} value={summary.active_children || 0} detail={t('adminStatsActiveKidsDesc')} icon={UserIcon} tone={`${metricToneAtIndex(3).bg} ${metricToneAtIndex(3).text}`} />
 </div>

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
 {/* TOP STORIES */}
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}} className="bg-card rounded-[2rem] p-8 border border-border shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-xl font-black text-foreground">{t('adminStatsPopularStories')}</h2>
 <button className="text-foreground-600 hover:text-foreground-700 bg-primary-50 p-2 rounded-xl transition-colors"><ArrowRightIcon className="w-5 h-5"/></button>
 </div>
 <div className="space-y-6">
 {(data?.top_books || []).slice(0,5).map((book, i) => (
 <BarRow
 key={book.id}
 label={book.title}
 value={book.listens_count}
 max={maxBookListens}
 detail={`${t('adminStatsTotalTime2')} ${formatAdminDuration(book.listening_seconds)}`}
 colorClass="bg-gradient-to-r from-primary-400 to-primary-600"
 icon={BookIcon}
 />
 ))}
 </div>
 </motion.div>

 {/* TOP CATEGORIES */}
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}} className="bg-card rounded-[2rem] p-8 border border-border shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-xl font-black text-foreground">{t('adminStatsTopCategories')}</h2>
 <button className="text-secondary-600 hover:text-secondary-700 bg-secondary-50 p-2 rounded-xl transition-colors"><ArrowRightIcon className="w-5 h-5"/></button>
 </div>
 <div className="space-y-6">
 {(data?.top_categories || []).slice(0,5).map((category) => (
 <BarRow
 key={category.id}
 label={category.name}
 value={category.listens_count}
 max={maxCategoryListens}
 detail={`${t('adminStatsTotalTime2')} ${formatAdminDuration(category.listening_seconds)}`}
 colorClass="bg-gradient-to-r from-secondary-400 to-secondary-600"
 icon={SparklesIcon}
 />
 ))}
 </div>
 </motion.div>
 </div>

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.6}} className="bg-card rounded-[2rem] p-8 border border-border shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-xl font-black text-foreground">{t('adminStatsActiveUsers')}</h2>
 </div>
 <div className="space-y-4">
 {(data?.active_users || []).slice(0, 6).map((user) => (
 <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-secondary/50 border border-border">
 <div>
 <p className="font-bold text-foreground text-sm">{user.name}</p>
 <p className="text-xs text-foreground-muted">{t('adminStatsParent')} {user.parent_name}</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-black text-foreground">{user.sessions_count || 0} {t('adminStatsSessions')}</p>
 <p className="text-xs text-surface-400">{formatAdminDate(user.last_activity_at)}</p>
 </div>
 </div>
 ))}
 {(data?.active_users || []).length === 0 && (
 <p className="text-sm text-foreground-muted text-center py-6">{t('adminStatsNoActivity')}</p>
 )}
 </div>
 </motion.div>

 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.7}} className="bg-card rounded-[2rem] p-8 border border-border shadow-sm">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-xl font-black text-foreground">{t('adminStatsRecentActivity')}</h2>
 </div>
 <div className="space-y-4">
 {(data?.recent_activity || []).slice(0, 6).map((item) => (
 <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-surface-secondary transition-colors">
 <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-foreground-600 shrink-0">
 <AudioIcon className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className="font-bold text-sm text-foreground">
 <span className="text-foreground-600">{item.kid_name}</span> · {item.book_title}
 </p>
 <p className="text-xs text-surface-400 mt-1">
 {formatAdminDuration(item.duration_seconds)} · {formatAdminDate(item.created_at)}
 </p>
 </div>
 </div>
 ))}
 {(data?.recent_activity || []).length === 0 && (
 <p className="text-sm text-foreground-muted text-center py-6">{t('adminStatsNoSessions')}</p>
 )}
 </div>
 </motion.div>
 </div>

 </div>
 );
}

export default AdminStatistics;
