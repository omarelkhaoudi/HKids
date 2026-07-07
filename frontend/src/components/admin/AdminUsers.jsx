import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../api/admin';
import { formatAdminDate, formatAdminDuration } from './AdminMetricCard';
import { ChildIcon, ClockIcon, HistoryIcon, UserIcon, SearchIcon, MailIcon, StarIcon, ChevronRightIcon, XIcon } from '../Icons';
import { Avatar, Badge } from '../ui';

function AdminUsers() {
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

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
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">Utilisateurs</h1>
          <p className="text-surface-500 font-medium mt-1">Gérez les comptes parents et profils enfants.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* USERS TABLE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0 bg-white rounded-[2rem] border border-surface-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-100 flex items-center justify-between bg-surface-50">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full bg-white border border-surface-200 rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="space-y-4 p-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface-50 rounded-xl animate-pulse"></div>)}
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4"><UserIcon className="w-8 h-8 text-surface-300"/></div>
                <h3 className="text-lg font-bold text-surface-900">Aucun utilisateur trouvé</h3>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Parent</th>
                    <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Abonnement</th>
                    <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-center">Enfants</th>
                    <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filteredParents.map((parent) => (
                    <tr 
                      key={parent.id} 
                      onClick={() => openParent(parent)}
                      className={`hover:bg-surface-50 cursor-pointer transition-colors ${selectedParent?.id === parent.id ? 'bg-primary-50/50' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar fallback={parent.name.charAt(0)} className={`w-10 h-10 font-bold text-white ${selectedParent?.id === parent.id ? 'bg-primary-500' : 'bg-surface-300'}`} />
                          <div>
                            <p className="font-bold text-surface-900 text-sm">{parent.name}</p>
                            <p className="text-xs text-surface-500 font-medium">{parent.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={parent.subscription_status === 'free' ? 'secondary' : 'success'} className="font-bold">
                          {parent.subscription_status === 'free' ? 'Gratuit' : 'Premium'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 text-surface-700 font-bold text-xs">
                          {parent.children_count || 0}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-medium text-surface-600">{formatAdminDate(parent.created_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* SIDE DRAWER FOR USER DETAILS */}
        <AnimatePresence>
          {selectedParent && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full xl:w-96 shrink-0 flex flex-col gap-4">
              
              {/* Parent Summary Card */}
              <div className="bg-white rounded-[2rem] border border-surface-200 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-500 to-violet-500"></div>
                <button onClick={() => setSelectedParent(null)} className="absolute top-4 right-4 z-10 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors"><XIcon className="w-4 h-4"/></button>
                <div className="relative pt-8 mb-4">
                  <div className="w-20 h-20 bg-white p-1 rounded-2xl shadow-lg mx-auto mb-3">
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-violet-500 rounded-xl flex items-center justify-center text-white text-3xl font-black uppercase">
                      {selectedParent.name.charAt(0)}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-center text-surface-900">{detail?.parent?.name || selectedParent.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-sm text-surface-500 font-medium mt-1">
                    <MailIcon className="w-4 h-4" /> {detail?.parent?.email || selectedParent.email || 'Email inconnu'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-surface-50 rounded-2xl p-3 text-center border border-surface-100">
                    <div className="text-xs font-bold text-surface-400 uppercase mb-1">Abonnement</div>
                    <div className={`text-sm font-black ${selectedParent.subscription_status === 'free' ? 'text-surface-600' : 'text-emerald-600'}`}>
                      {selectedParent.subscription_status === 'free' ? 'Gratuit' : 'Premium'}
                    </div>
                  </div>
                  <div className="bg-surface-50 rounded-2xl p-3 text-center border border-surface-100">
                    <div className="text-xs font-bold text-surface-400 uppercase mb-1">Inscription</div>
                    <div className="text-sm font-black text-surface-700">{formatAdminDate(selectedParent.created_at).split(' ')[0]}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm font-medium border-t border-surface-100 pt-4">
                  <div className="flex justify-between items-center"><span className="text-surface-500 flex items-center gap-2"><ChildIcon className="w-4 h-4"/> Enfants</span><span className="font-bold text-surface-900">{totalChildren} profils</span></div>
                  <div className="flex justify-between items-center"><span className="text-surface-500 flex items-center gap-2"><ClockIcon className="w-4 h-4"/> Temps d'écoute</span><span className="font-bold text-surface-900">{formatAdminDuration(totalTime)}</span></div>
                </div>
              </div>

              {/* Children Profiles List */}
              <div className="bg-white rounded-[2rem] border border-surface-200 shadow-sm p-6 flex-1">
                <h4 className="font-black text-surface-900 mb-4 flex items-center gap-2"><ChildIcon className="w-5 h-5 text-primary-500"/> Profils Enfants</h4>
                {detailLoading ? (
                  <div className="space-y-3">
                    <div className="h-20 bg-surface-50 rounded-2xl animate-pulse"></div>
                    <div className="h-20 bg-surface-50 rounded-2xl animate-pulse"></div>
                  </div>
                ) : detail?.kids?.length > 0 ? (
                  <div className="space-y-3">
                    {detail.kids.map(kid => (
                      <div key={kid.id} className="p-4 bg-surface-50 border border-surface-100 rounded-2xl hover:border-surface-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-surface-900 text-base flex items-center gap-2">
                              {kid.name}
                              {kid.is_premium_voice && <StarIcon className="w-4 h-4 text-amber-500" title="Premium Voice" />}
                            </h5>
                            <p className="text-xs font-medium text-surface-500 mt-0.5">{kid.age ? `${kid.age} ans` : 'Âge N/A'} • {kid.preferred_language || 'fr'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs font-bold text-surface-600 mt-3 pt-3 border-t border-surface-200/50">
                          <div className="bg-white px-2 py-1 rounded-lg border border-surface-200 shadow-sm flex-1 text-center"><span className="text-primary-600 block text-lg">{kid.total_sessions || 0}</span> Sessions</div>
                          <div className="bg-white px-2 py-1 rounded-lg border border-surface-200 shadow-sm flex-1 text-center"><span className="text-emerald-600 block text-lg">{Math.round((kid.total_time_seconds || 0)/60)}</span> Minutes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3"><ChildIcon className="w-6 h-6 text-surface-400"/></div>
                    <p className="text-sm font-medium text-surface-500">Aucun enfant ajouté.</p>
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AdminUsers;
