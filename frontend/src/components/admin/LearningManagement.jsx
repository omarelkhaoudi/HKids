import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { learningAPI } from '../../api/learning';
import { BrainIcon, TrashIcon, EditIcon, SearchIcon, ActivityIcon, PlusIcon, XIcon } from '../Icons';
import { Button, Badge } from '../ui';
import {
  LEARNING_CONTENT_TYPES,
  QUIZ_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  EMPTY_LEARNING_FORM,
  EMPTY_QUESTION,
} from '../../constants/learningOptions';

function LearningManagement() {
  const [activeTab, setActiveTab] = useState('contents');
  const [contents, setContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(EMPTY_LEARNING_FORM);
  const [categoryForm, setCategoryForm] = useState({ code: '', name: '', description: '', pictogram: '⭐', color: 'from-sky-500 to-cyan-400' });
  const [challengeForm, setChallengeForm] = useState({ title: '', description: '', challenge_type: 'quiz_success_count', target_value: 3, category_id: '', status: 'active' });
  const [rewardForm, setRewardForm] = useState({ code: '', name: '', reward_type: 'stars', icon: '⭐', value: 5, description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contentsRes, categoriesRes, challengesRes, rewardsRes] = await Promise.all([
        learningAPI.getAdminContents(),
        learningAPI.getCategories(),
        learningAPI.getChallenges(),
        learningAPI.getRewards(),
      ]);
      setContents(contentsRes.data || []);
      setCategories(categoriesRes.data || []);
      setChallenges(challengesRes.data || []);
      setRewards(rewardsRes.data || []);
    } catch (error) {
      console.error('Learning admin load error:', error);
      alert('Erreur de chargement des contenus éducatifs');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_LEARNING_FORM, questions: [EMPTY_QUESTION()] });
    setShowModal(true);
  };

  const openEdit = async (item) => {
    try {
      const response = await learningAPI.getContent(item.id);
      const data = response.data;
      setEditingId(data.id);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        content_type: data.content_type || 'quiz',
        quiz_type: data.quiz_type || 'multiple_choice',
        category_id: data.category_id || '',
        age_group_min: data.age_group_min ?? 3,
        age_group_max: data.age_group_max ?? 8,
        language: data.language || 'fr',
        difficulty: data.difficulty || 'easy',
        status: data.status || 'draft',
        questions: (data.questions || []).length
          ? data.questions.map((q, index) => ({
              question_type: q.question_type,
              prompt: q.prompt,
              options: q.options || [],
              correct_answer: q.correct_answer || { value: '' },
              explanation: q.explanation || '',
              position: q.position || index + 1,
            }))
          : [EMPTY_QUESTION()],
      });
      setShowModal(true);
    } catch (error) {
      console.error('Learning edit load error:', error);
      alert('Impossible de charger le contenu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contenu éducatif ?')) return;
    try {
      await learningAPI.deleteContent(id);
      loadData();
    } catch (error) {
      console.error('Learning delete error:', error);
      alert('Suppression impossible');
    }
  };

  const updateQuestion = (index, field, value) => {
    setFormData((current) => {
      const questions = [...current.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...current, questions };
    });
  };

  const createCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await learningAPI.createCategory(categoryForm);
      setCategoryForm({ code: '', name: '', description: '', pictogram: '⭐', color: 'from-sky-500 to-cyan-400' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const createChallenge = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await learningAPI.createChallenge({
        ...challengeForm,
        category_id: challengeForm.category_id || null,
        target_value: Number(challengeForm.target_value),
      });
      setChallengeForm({ title: '', description: '', challenge_type: 'quiz_success_count', target_value: 3, category_id: '', status: 'active' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const createReward = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await learningAPI.createReward({
        ...rewardForm,
        value: Number(rewardForm.value),
      });
      setRewardForm({ code: '', name: '', reward_type: 'stars', icon: '⭐', value: 5, description: '' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id || null,
        questions: formData.content_type === 'game'
          ? []
          : formData.questions.map((q, index) => ({
              ...q,
              position: index + 1,
            })),
        metadata: formData.content_type === 'game'
          ? { game_type: 'memory', pictogram: '🎮' }
          : {},
      };

      if (editingId) await learningAPI.updateContent(editingId, payload);
      else await learningAPI.createContent(payload);

      setShowModal(false);
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Learning save error:', error);
      alert(error.response?.data?.error || 'Erreur de sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const addQuestion = () => {
    setFormData((current) => ({
      ...current,
      questions: [...current.questions, { ...EMPTY_QUESTION(), position: current.questions.length + 1 }],
    }));
  };

  const removeQuestion = (index) => {
    setFormData((current) => ({
      ...current,
      questions: current.questions.filter((_, i) => i !== index),
    }));
  };

  const filteredContents = contents.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'contents', label: 'Contenus' },
    { id: 'categories', label: 'Catégories' },
    { id: 'challenges', label: 'Défis' },
    { id: 'rewards', label: 'Récompenses' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Quiz & Jeux</h1>
          <p className="text-foreground-muted font-medium mt-1">Gérez le contenu ludo-éducatif.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={activeTab !== 'contents'}>Créer un contenu</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              activeTab === tab.id ? 'bg-surface-900 text-white' : 'bg-card border border-border text-foreground-secondary hover:bg-surface-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'contents' && (
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:bg-card transition-colors"
          />
        </div>
      </div>
      )}

      {activeTab === 'contents' && (loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : (
        <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-secondary/50 border-b border-border">
                <tr>
                  <th className="p-4 text-xs font-bold text-surface-400 uppercase">Titre</th>
                  <th className="p-4 text-xs font-bold text-surface-400 uppercase">Type</th>
                  <th className="p-4 text-xs font-bold text-surface-400 uppercase">Quiz</th>
                  <th className="p-4 text-xs font-bold text-surface-400 uppercase">Difficulté</th>
                  <th className="p-4 text-xs font-bold text-surface-400 uppercase">Statut</th>
                  <th className="p-4 text-xs font-bold text-surface-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredContents.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-foreground-muted">
                          {item.content_type === 'game' ? <ActivityIcon className="w-5 h-5" /> : <BrainIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{item.title}</p>
                          <p className="text-xs text-foreground-muted">{item.category_name || item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="soft">{item.content_type}</Badge></td>
                    <td className="p-4"><span className="text-sm font-medium">{item.quiz_type || '-'}</span></td>
                    <td className="p-4"><span className="text-sm font-bold capitalize">{item.difficulty}</span></td>
                    <td className="p-4">
                      <Badge variant={item.status === 'published' ? 'success' : 'secondary'}>
                        {item.status === 'published' ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEdit(item)} className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(item.id)} className="p-2 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={createCategory} className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-black text-lg">Nouvelle catégorie</h2>
            <input required placeholder="Code" value={categoryForm.code} onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <input required placeholder="Nom" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <textarea placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <Button type="submit" variant="primary" disabled={submitting}>Créer</Button>
          </form>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-black text-lg">Catégories ({categories.length})</h2>
            {categories.map((category) => (
              <div key={category.id} className="p-3 rounded-xl bg-surface-secondary border border-border">
                <p className="font-bold">{category.name}</p>
                <p className="text-xs text-foreground-muted">{category.code}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={createChallenge} className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-black text-lg">Nouveau défi</h2>
            <input required placeholder="Titre" value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <textarea placeholder="Description" value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <input type="number" min={1} placeholder="Objectif" value={challengeForm.target_value} onChange={(e) => setChallengeForm({ ...challengeForm, target_value: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <select value={challengeForm.category_id} onChange={(e) => setChallengeForm({ ...challengeForm, category_id: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold">
              <option value="">Catégorie optionnelle</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button type="submit" variant="primary" disabled={submitting}>Créer</Button>
          </form>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-black text-lg">Défis ({challenges.length})</h2>
            {challenges.map((challenge) => (
              <div key={challenge.id} className="p-3 rounded-xl bg-surface-secondary border border-border">
                <p className="font-bold">{challenge.title}</p>
                <p className="text-xs text-foreground-muted">Objectif : {challenge.target_value} · {challenge.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={createReward} className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-black text-lg">Nouvelle récompense</h2>
            <input required placeholder="Code" value={rewardForm.code} onChange={(e) => setRewardForm({ ...rewardForm, code: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <input required placeholder="Nom" value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <input type="number" min={1} placeholder="Valeur" value={rewardForm.value} onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <textarea placeholder="Description" value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
            <Button type="submit" variant="primary" disabled={submitting}>Créer</Button>
          </form>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-black text-lg">Récompenses ({rewards.length})</h2>
            {rewards.map((reward) => (
              <div key={reward.id} className="p-3 rounded-xl bg-surface-secondary border border-border">
                <p className="font-bold">{reward.icon} {reward.name}</p>
                <p className="text-xs text-foreground-muted">{reward.code} · {reward.value} {reward.reward_type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-surface-secondary">
                <h3 className="text-xl font-black">{editingId ? 'Modifier' : 'Nouveau contenu'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-surface-200">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1">Titre</label>
                    <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1">Description</label>
                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Type</label>
                    <select value={formData.content_type} onChange={(e) => setFormData({ ...formData, content_type: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold">
                      {LEARNING_CONTENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Type de quiz</label>
                    <select value={formData.quiz_type || ''} onChange={(e) => setFormData({ ...formData, quiz_type: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold" disabled={formData.content_type === 'game'}>
                      {QUIZ_TYPE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Catégorie</label>
                    <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold">
                      <option value="">Aucune</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Difficulté</label>
                    <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold">
                      {DIFFICULTY_OPTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Âge min</label>
                    <input type="number" min={2} max={12} value={formData.age_group_min} onChange={(e) => setFormData({ ...formData, age_group_min: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Âge max</label>
                    <input type="number" min={2} max={12} value={formData.age_group_max} onChange={(e) => setFormData({ ...formData, age_group_max: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Langue</label>
                    <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold">
                      <option value="fr">FR</option>
                      <option value="en">EN</option>
                      <option value="ar">AR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Statut</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold">
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                    </select>
                  </div>
                </div>

                {formData.content_type !== 'game' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black">Questions</h4>
                      <Button type="button" variant="outline" onClick={addQuestion}><PlusIcon className="w-4 h-4 mr-1" /> Ajouter</Button>
                    </div>
                    {formData.questions.map((question, index) => (
                      <div key={index} className="rounded-2xl border border-border p-4 space-y-3 bg-surface-secondary/40">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">Question {index + 1}</span>
                          {formData.questions.length > 1 && (
                            <button type="button" onClick={() => removeQuestion(index)} className="text-rose-500 text-sm font-bold">Retirer</button>
                          )}
                        </div>
                        <input
                          required
                          placeholder="Énoncé"
                          value={question.prompt}
                          onChange={(e) => updateQuestion(index, 'prompt', e.target.value)}
                          className="w-full p-3 rounded-xl bg-card border border-border"
                        />
                        <select
                          value={question.question_type}
                          onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                          className="w-full p-3 rounded-xl bg-card border border-border font-bold"
                        >
                          {QUIZ_TYPE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        <input
                          placeholder="Réponse correcte (id option)"
                          value={question.correct_answer?.value || ''}
                          onChange={(e) => updateQuestion(index, 'correct_answer', { value: e.target.value })}
                          className="w-full p-3 rounded-xl bg-card border border-border"
                        />
                        <textarea
                          rows={3}
                          placeholder='Options JSON: [{"id":"a","label":"A","pictogram":"A"}]'
                          value={JSON.stringify(question.options || [])}
                          onChange={(e) => {
                            try {
                              updateQuestion(index, 'options', JSON.parse(e.target.value));
                            } catch {
                              // ignore invalid JSON while typing
                            }
                          }}
                          className="w-full p-3 rounded-xl bg-card border border-border font-mono text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </form>

              <div className="p-4 border-t border-border bg-surface-secondary flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LearningManagement;
