import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {adminAPI} from '../../api/admin';
import {BrainIcon, PlayIcon, CheckIcon, TrashIcon, PlusIcon, XIcon, SearchIcon, ActivityIcon} from '../Icons';
import {Button, Badge} from '../ui';

function LearningManagement() {
 const [quizzes, setQuizzes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [search, setSearch] = useState('');
 const [formData, setFormData] = useState({title: '', description: '', difficulty: 'easy', type: 'quiz'});

 useEffect(() => {
 // Mock data since API doesn't fully exist for this yet based on previous code
 setTimeout(() => {
 setQuizzes([
 {id: 1, title: 'Quiz des Animaux', description: 'Découvre les cris des animaux', difficulty: 'easy', type: 'quiz', status: 'published'},
 {id: 2, title: 'Jeu de Mémoire', description: 'Trouve les paires', difficulty: 'medium', type: 'game', status: 'draft'}
 ]);
 setLoading(false);
}, 500);
}, []);

 const filteredQuizzes = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

 return (
 <div className="space-y-6 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-black text-foreground tracking-tight">Quiz & Jeux</h1>
 <p className="text-foreground-muted font-medium mt-1">Gérez le contenu ludo-éducatif (Coming Soon).</p>
 </div>
 <Button variant="primary" onClick={() => setShowModal(true)}>Créer un Quiz</Button>
 </div>

 <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-4">
 <div className="relative flex-1 max-w-md">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Rechercher un quiz..."
 className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:bg-card transition-colors"
 />
 </div>
 </div>

 <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden flex flex-col">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-surface-secondary/50 border-b border-border">
 <tr>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Titre</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Type</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Difficulté</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Statut</th>
 <th className="p-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredQuizzes.map(item => (
 <tr key={item.id} className="hover:bg-surface-secondary transition-colors group">
 <td className="p-4">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-foreground-muted">
 {item.type === 'quiz' ? <BrainIcon className="w-5 h-5"/> : <ActivityIcon className="w-5 h-5"/>}
 </div>
 <div>
 <p className="font-bold text-foreground text-sm mb-0.5">{item.title}</p>
 <p className="text-xs font-medium text-foreground-muted">{item.description}</p>
 </div>
 </div>
 </td>
 <td className="p-4"><Badge variant="soft" className="bg-surface-secondary text-foreground-secondary font-bold capitalize">{item.type}</Badge></td>
 <td className="p-4">
 <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
 {item.difficulty}
 </span>
 </td>
 <td className="p-4">
 <Badge variant={item.status === 'published' ? 'success' : 'secondary'} className="font-bold">
 {item.status === 'published' ? 'Publié' : 'Brouillon'}
 </Badge>
 </td>
 <td className="p-4 text-right">
 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="p-2 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 
 <AnimatePresence>
 {showModal && (
 <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
 <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} className="bg-card rounded-3xl w-full max-w-md p-6 shadow-2xl">
 <h3 className="text-xl font-black mb-4">Fonctionnalité en développement</h3>
 <p className="text-foreground-muted mb-6">L'éditeur complet de quiz et jeux éducatifs sera disponible dans la prochaine mise à jour.</p>
 <div className="flex justify-end"><Button variant="primary" onClick={() => setShowModal(false)}>Fermer</Button></div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}

export default LearningManagement;
