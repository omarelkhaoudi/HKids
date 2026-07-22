import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {categoriesAPI} from '../../api/books';
import {TagIcon, EditIcon, TrashIcon, PlusIcon, XIcon, SearchIcon, LayersIcon} from '../Icons';
import {Button, Badge} from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import {useToast} from '../ToastProvider';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

function CategoryManagement() {
 const { t } = useLanguage();
 const { showToast } = useToast();
 const { requestConfirm, confirmDialog } = useConfirmDialog();
 const [categories, setCategories] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [editingCategory, setEditingCategory] = useState(null);
 const [formData, setFormData] = useState({name: '', description: '', parent_id: '', icon: '', color: ''});
 const [search, setSearch] = useState('');

 useEffect(() => {loadCategories();}, []);

 const loadCategories = async () => {
 try {
 setLoading(true);
 const response = await categoriesAPI.getAll();
 setCategories(response.data);
} catch (error) {
 console.error('Error loading categories:', error);
} finally {
 setLoading(false);
}
};

 const handleSubmit = async (e) => {
 e.preventDefault();
 try {
 if (editingCategory) await categoriesAPI.update(editingCategory.id, formData);
 else await categoriesAPI.create(formData);
 setShowModal(false);
 resetForm();
 loadCategories();
} catch (error) {
 console.error('Error saving category:', error);
 showToast(error.response?.data?.error || t('adminCategoriesSaveError'), 'error');
}
};

 const handleEdit = (category) => {
 setEditingCategory(category);
 setFormData({
 name: category.name || '', description: category.description || '',
 parent_id: category.parent_id || '', icon: category.icon || '', color: category.color || ''
});
 setShowModal(true);
};

 const handleDelete = async (id) => {
 const ok = await requestConfirm({
 title: t('confirmTitle'),
 message: t('adminCategoriesDeleteConfirm'),
 confirmLabel: t('confirmDelete'),
 danger: true,
 });
 if (!ok) return;
 try {
 await categoriesAPI.delete(id);
 loadCategories();
} catch (error) {
 console.error('Error deleting category:', error);
 showToast(error.response?.data?.error || t('adminCategoriesDeleteError'), 'error');
}
};

 const resetForm = () => {
 setFormData({name: '', description: '', parent_id: '', icon: '', color: ''});
 setEditingCategory(null);
};

 const parentCategories = categories.filter((c) => !c.parent_id);
 const subcategories = categories.filter((c) => c.parent_id);

 const filteredParentCategories = parentCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

 return (
 <div className="space-y-6 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-black text-foreground tracking-tight">{t('adminCategoriesTitle')}</h1>
 <p className="text-foreground-muted font-medium mt-1">{t('adminCategoriesSubtitle')}</p>
 </div>
 <Button variant="primary" onClick={() => {resetForm(); setShowModal(true);}}>
 {t('adminCategoriesCreate')}
 </Button>
 </div>

 <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-4">
 <div className="relative flex-1 max-w-md">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder={t('adminCategoriesFilterPlaceholder')}
 className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:bg-card transition-colors"
 />
 </div>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {[1,2,3].map(i => <div key={i} className="h-32 bg-card border border-border rounded-[2rem] animate-pulse"></div>)}
 </div>
 ) : (
 <div className="space-y-8">
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
 <AnimatePresence>
 {filteredParentCategories.map(parent => (
 <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} key={parent.id} className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden flex flex-col group relative">
 {/* Subtle drag handle visual indicator (UI ONLY) */}
 <div className="absolute top-4 right-4 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
 </div>
 
 <div className="p-6 border-b border-border flex-1">
 <div className="flex items-center gap-4 mb-3">
 <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center text-foreground-muted shadow-sm" style={{backgroundColor: parent.color ? `${parent.color}20` : '', color: parent.color || ''}}>
 {parent.icon ? <span className="text-xl">{parent.icon}</span> : <LayersIcon className="w-6 h-6" />}
 </div>
 <div>
 <h3 className="font-black text-lg text-foreground leading-tight">{parent.name}</h3>
 <p className="text-xs font-medium text-foreground-muted mt-0.5">{t('adminCategoriesSubcount').replace('{n}', subcategories.filter(s => s.parent_id === parent.id).length)}</p>
 </div>
 </div>
 {parent.description && <p className="text-sm text-foreground-secondary line-clamp-2 leading-relaxed">{parent.description}</p>}
 </div>
 
 {/* Subcategories preview */}
 <div className="p-4 bg-surface-secondary flex flex-wrap gap-2">
 {subcategories.filter(s => s.parent_id === parent.id).slice(0,3).map(sub => (
 <Badge key={sub.id} variant="soft" className="bg-card border-border text-foreground-secondary shadow-sm font-bold">{sub.name}</Badge>
 ))}
 {subcategories.filter(s => s.parent_id === parent.id).length > 3 && (
 <Badge variant="soft" className="bg-surface-200 text-foreground-secondary border-none font-bold">+{subcategories.filter(s => s.parent_id === parent.id).length - 3}</Badge>
 )}
 {subcategories.filter(s => s.parent_id === parent.id).length === 0 && (
 <span className="text-xs text-surface-400 font-medium italic">{t('adminCategoriesNoSub')}</span>
 )}
 </div>

 <div className="p-2 bg-surface-secondary flex justify-end gap-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
 <Button variant="outline" className="text-xs py-1 px-3 border-none bg-card text-foreground-secondary hover:bg-surface-200" onClick={() => handleEdit(parent)}>{t('adminEdit')}</Button>
 <Button variant="outline" className="text-xs py-1 px-3 border-none bg-card text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(parent.id)}>{t('adminDelete')}</Button>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </div>
 )}

 {/* MODAL */}
 <AnimatePresence>
 {showModal && (
 <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
 <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} className="bg-card rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
 <div className="p-6 border-b border-border flex justify-between items-center bg-surface-secondary">
 <h3 className="text-xl font-black">{editingCategory ? t('adminCategoriesEditTitle') : t('adminCategoriesNewTitle')}</h3>
 <button onClick={() => {setShowModal(false); resetForm();}} className="p-2 text-surface-400 hover:bg-surface-200 rounded-full"><XIcon className="w-5 h-5"/></button>
 </div>
 <form onSubmit={handleSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-foreground-secondary mb-1">{t('adminCategoriesFormName')}</label>
 <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-medium focus:border-primary-400 focus:outline-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-foreground-secondary mb-1">{t('adminCategoriesFormDescription')}</label>
 <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-medium focus:border-primary-400 focus:outline-none"></textarea>
 </div>
 <div>
 <label className="block text-sm font-bold text-foreground-secondary mb-1">{t('adminCategoriesFormParent')}</label>
 <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-medium focus:border-primary-400 focus:outline-none">
 <option value="">{t('adminCategoriesFormNoParent')}</option>
 {parentCategories.map(c => <option key={c.id} value={c.id} disabled={editingCategory?.id === c.id}>{c.name}</option>)}
 </select>
 </div>
 <div className="flex gap-4">
 <div className="flex-1">
 <label className="block text-sm font-bold text-foreground-secondary mb-1">{t('adminCategoriesFormEmoji')}</label>
 <input value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-medium focus:border-primary-400 focus:outline-none text-xl text-center" placeholder="🚀" />
 </div>
 <div className="flex-1">
 <label className="block text-sm font-bold text-foreground-secondary mb-1">{t('adminCategoriesFormColor')}</label>
 <div className="relative">
 <input type="color" value={formData.color || '#6366f1'} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-12 p-1 rounded-xl bg-surface-secondary border border-border cursor-pointer" />
 </div>
 </div>
 </div>
 <div className="pt-4 flex justify-end gap-3 border-t border-border">
 <Button type="button" variant="outline" onClick={() => {setShowModal(false); resetForm();}}>{t('adminCancel')}</Button>
 <Button type="submit" variant="primary">{t('adminSave')}</Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 {confirmDialog}
 </div>
 );
}

export default CategoryManagement;
