import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoriesAPI } from '../../api/books';
import { TagIcon, EditIcon, TrashIcon, PlusIcon, XIcon, SearchIcon, LayersIcon } from '../Icons';
import { Button, Badge } from '../ui';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: '', icon: '', color: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { loadCategories(); }, []);

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
      alert('Error saving category');
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
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesAPI.delete(id);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', parent_id: '', icon: '', color: '' });
    setEditingCategory(null);
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter((c) => c.parent_id);

  const filteredParentCategories = parentCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">Catégories</h1>
          <p className="text-surface-500 font-medium mt-1">Organisez la taxonomie de votre bibliothèque.</p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
          Créer une Catégorie
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer les catégories..."
            className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white border border-surface-200 rounded-[2rem] animate-pulse"></div>)}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredParentCategories.map(parent => (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={parent.id} className="bg-white rounded-[2rem] border border-surface-200 shadow-sm overflow-hidden flex flex-col group relative">
                  {/* Subtle drag handle visual indicator (UI ONLY) */}
                  <div className="absolute top-4 right-4 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                  </div>
                  
                  <div className="p-6 border-b border-surface-100 flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-500 shadow-sm" style={{ backgroundColor: parent.color ? `${parent.color}20` : '', color: parent.color || '' }}>
                         {parent.icon ? <span className="text-xl">{parent.icon}</span> : <LayersIcon className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-surface-900 leading-tight">{parent.name}</h3>
                        <p className="text-xs font-medium text-surface-500 mt-0.5">{subcategories.filter(s => s.parent_id === parent.id).length} sous-catégories</p>
                      </div>
                    </div>
                    {parent.description && <p className="text-sm text-surface-600 line-clamp-2 leading-relaxed">{parent.description}</p>}
                  </div>
                  
                  {/* Subcategories preview */}
                  <div className="p-4 bg-surface-50 flex flex-wrap gap-2">
                    {subcategories.filter(s => s.parent_id === parent.id).slice(0,3).map(sub => (
                      <Badge key={sub.id} variant="soft" className="bg-white border-surface-200 text-surface-700 shadow-sm font-bold">{sub.name}</Badge>
                    ))}
                    {subcategories.filter(s => s.parent_id === parent.id).length > 3 && (
                      <Badge variant="soft" className="bg-surface-200 text-surface-600 border-none font-bold">+{subcategories.filter(s => s.parent_id === parent.id).length - 3}</Badge>
                    )}
                    {subcategories.filter(s => s.parent_id === parent.id).length === 0 && (
                      <span className="text-xs text-surface-400 font-medium italic">Aucune sous-catégorie</span>
                    )}
                  </div>

                  <div className="p-2 bg-surface-100 flex justify-end gap-2 border-t border-surface-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="text-xs py-1 px-3 border-none bg-white text-surface-700 hover:bg-surface-200" onClick={() => handleEdit(parent)}>Modifier</Button>
                    <Button variant="outline" className="text-xs py-1 px-3 border-none bg-white text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(parent.id)}>Supprimer</Button>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-surface-100 flex justify-between items-center bg-surface-50">
                <h3 className="text-xl font-black">{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 text-surface-400 hover:bg-surface-200 rounded-full"><XIcon className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-surface-700 mb-1">Nom</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl bg-surface-50 border border-surface-200 font-medium focus:border-primary-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-surface-700 mb-1">Description</label>
                  <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl bg-surface-50 border border-surface-200 font-medium focus:border-primary-400 focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-surface-700 mb-1">Catégorie Parente</label>
                  <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full p-3 rounded-xl bg-surface-50 border border-surface-200 font-medium focus:border-primary-400 focus:outline-none">
                    <option value="">Aucune (Catégorie Principale)</option>
                    {parentCategories.map(c => <option key={c.id} value={c.id} disabled={editingCategory?.id === c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-surface-700 mb-1">Emoji / Icône</label>
                    <input value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full p-3 rounded-xl bg-surface-50 border border-surface-200 font-medium focus:border-primary-400 focus:outline-none text-xl text-center" placeholder="🚀" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-surface-700 mb-1">Couleur</label>
                    <div className="relative">
                      <input type="color" value={formData.color || '#6366f1'} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-12 p-1 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                  <Button type="submit" variant="primary">Enregistrer</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategoryManagement;
