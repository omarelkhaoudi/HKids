import { useEffect, useMemo, useState } from 'react';
import { learningAPI } from '../../api/learning';
import { BookIcon, CheckIcon, PlusIcon, SparklesIcon, TrashIcon } from '../Icons';

const emptyQuestion = {
  question_type: 'multiple_choice',
  prompt: 'Touche la bonne reponse',
  options: [
    { id: 'a', label: 'A', pictogram: 'A' },
    { id: 'b', label: 'B', pictogram: 'B' },
  ],
  correct_answer: { value: 'a' },
  explanation: 'Bravo.',
};

const emptyForm = {
  title: '',
  description: '',
  content_type: 'quiz',
  quiz_type: 'multiple_choice',
  category_id: '',
  age_group_min: 2,
  age_group_max: 10,
  language: 'fr',
  difficulty: 'easy',
  image_url: '',
  audio_url: '',
  reward_id: '',
  status: 'published',
  metadata: {},
  questions: [emptyQuestion],
};

function LearningManagement() {
  const [contents, setContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [challengeForm, setChallengeForm] = useState({
    title: 'Nouveau defi',
    description: '',
    challenge_type: 'quiz_success_count',
    target_value: 3,
    category_id: '',
    reward_id: '',
    status: 'active',
    metadata: { pictogram: '🏅' },
  });
  const [rewardForm, setRewardForm] = useState({
    code: '',
    name: '',
    reward_type: 'stars',
    icon: '⭐',
    value: 1,
    description: '',
  });
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    description: '',
    pictogram: '⭐',
    color: 'from-sky-500 to-cyan-400',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [contentsRes, categoriesRes, rewardsRes] = await Promise.all([
      learningAPI.getContents({ include_draft: true }),
      learningAPI.getCategories(),
      learningAPI.getRewards(),
    ]);
    setContents(contentsRes.data || []);
    setCategories(categoriesRes.data || []);
    setRewards(rewardsRes.data || []);
  };

  const selectedReward = useMemo(
    () => rewards.find((reward) => String(reward.id) === String(form.reward_id)),
    [form.reward_id, rewards]
  );

  const patchForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const editContent = async (content) => {
    const response = await learningAPI.getContent(content.id);
    const detailed = response.data;
    setEditingId(detailed.id);
    setForm({
      ...emptyForm,
      ...detailed,
      category_id: detailed.category_id || '',
      reward_id: detailed.reward?.id || '',
      questions: detailed.questions?.length ? detailed.questions : [emptyQuestion],
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveContent = async (event) => {
    event.preventDefault();
    setMessage('');
    const payload = {
      ...form,
      category_id: form.category_id || null,
      reward_id: form.reward_id || null,
    };
    if (editingId) {
      await learningAPI.updateContent(editingId, payload);
      setMessage('Contenu modifie.');
    } else {
      await learningAPI.createContent(payload);
      setMessage('Contenu cree.');
    }
    resetForm();
    await loadData();
  };

  const deleteContent = async (content) => {
    if (!window.confirm(`Supprimer ${content.title} ?`)) return;
    await learningAPI.deleteContent(content.id);
    await loadData();
  };

  const patchQuestion = (index, field, value) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => (
        questionIndex === index ? { ...question, [field]: value } : question
      )),
    }));
  };

  const saveChallenge = async () => {
    await learningAPI.createChallenge({
      ...challengeForm,
      category_id: challengeForm.category_id || null,
      reward_id: challengeForm.reward_id || null,
    });
    setMessage('Defi cree.');
  };

  const saveReward = async () => {
    await learningAPI.createReward(rewardForm);
    setRewardForm({ code: '', name: '', reward_type: 'stars', icon: '⭐', value: 1, description: '' });
    await loadData();
    setMessage('Recompense creee.');
  };

  const saveCategory = async () => {
    await learningAPI.createCategory(categoryForm);
    setCategoryForm({ code: '', name: '', description: '', pictogram: '⭐', color: 'from-sky-500 to-cyan-400' });
    await loadData();
    setMessage('Categorie creee.');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-black">
              <SparklesIcon className="h-5 w-5" />
              Module educatif
            </p>
            <h1 className="mt-3 text-3xl font-black">Quiz, jeux et defis</h1>
            <p className="mt-2 font-semibold text-white/85">Architecture ouverte pour IA, nouveaux types et recompenses.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/20 p-3">
              <p className="text-2xl font-black">{contents.length}</p>
              <p className="text-xs font-bold">contenus</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3">
              <p className="text-2xl font-black">{categories.length}</p>
              <p className="text-xs font-bold">categories</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3">
              <p className="text-2xl font-black">{rewards.length}</p>
              <p className="text-xs font-bold">recompenses</p>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 font-bold text-green-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-black">Contenus existants</h2>
          <div className="space-y-3">
            {contents.map((content) => (
              <div key={content.id} className="flex flex-col gap-3 rounded-xl border border-neutral-100 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-2xl">{content.category_pictogram}</span>
                  <div>
                    <p className="font-black">{content.title}</p>
                    <p className="text-sm font-bold text-neutral-500">{content.content_type} - {content.quiz_type || 'jeu'} - {content.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editContent(content)} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-black text-white">Modifier</button>
                  <button onClick={() => deleteContent(content)} className="rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={saveContent} className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-black">{editingId ? 'Modifier' : 'Creer'} un contenu</h2>
          <div className="space-y-3">
            <input value={form.title} onChange={(event) => patchForm('title', event.target.value)} className="h-12 w-full rounded-xl border px-3 font-bold" placeholder="Titre" />
            <textarea value={form.description} onChange={(event) => patchForm('description', event.target.value)} className="min-h-20 w-full rounded-xl border px-3 py-2 font-bold" placeholder="Description" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.content_type} onChange={(event) => patchForm('content_type', event.target.value)} className="h-12 rounded-xl border px-3 font-bold">
                {['quiz', 'game', 'alphabet', 'numbers', 'colors', 'shapes', 'languages'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select value={form.quiz_type || ''} onChange={(event) => patchForm('quiz_type', event.target.value)} className="h-12 rounded-xl border px-3 font-bold">
                {['multiple_choice', 'image_word_match', 'listen_answer', 'find_image', 'true_false', 'sequence_order'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select value={form.category_id} onChange={(event) => patchForm('category_id', event.target.value)} className="h-12 rounded-xl border px-3 font-bold">
                <option value="">Categorie</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.pictogram} {category.name}</option>)}
              </select>
              <select value={form.reward_id} onChange={(event) => patchForm('reward_id', event.target.value)} className="h-12 rounded-xl border px-3 font-bold">
                <option value="">Recompense</option>
                {rewards.map((reward) => <option key={reward.id} value={reward.id}>{reward.icon} {reward.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" value={form.age_group_min} onChange={(event) => patchForm('age_group_min', event.target.value)} className="h-12 rounded-xl border px-3 font-bold" />
              <input type="number" value={form.age_group_max} onChange={(event) => patchForm('age_group_max', event.target.value)} className="h-12 rounded-xl border px-3 font-bold" />
              <select value={form.status} onChange={(event) => patchForm('status', event.target.value)} className="h-12 rounded-xl border px-3 font-bold">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            {form.questions.map((question, index) => (
              <div key={index} className="rounded-xl bg-neutral-50 p-3">
                <input value={question.prompt} onChange={(event) => patchQuestion(index, 'prompt', event.target.value)} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" />
                <textarea
                  value={JSON.stringify(question.options)}
                  onChange={(event) => {
                    try { patchQuestion(index, 'options', JSON.parse(event.target.value)); } catch { patchQuestion(index, 'options', question.options); }
                  }}
                  className="mb-2 min-h-20 w-full rounded-xl border px-3 py-2 text-xs font-mono"
                />
                <input
                  value={question.correct_answer?.value || ''}
                  onChange={(event) => patchQuestion(index, 'correct_answer', { value: event.target.value })}
                  className="h-11 w-full rounded-xl border px-3 font-bold"
                  placeholder="Bonne reponse id"
                />
              </div>
            ))}
            {selectedReward && <p className="rounded-xl bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-700">{selectedReward.icon} {selectedReward.name}</p>}
            <div className="flex gap-2">
              <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 font-black text-white">
                <CheckIcon className="h-5 w-5" />
                Enregistrer
              </button>
              <button type="button" onClick={resetForm} className="h-12 rounded-xl bg-neutral-100 px-4 font-black">Reset</button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-black">Defi</h2>
          <input value={challengeForm.title} onChange={(event) => setChallengeForm({ ...challengeForm, title: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" />
          <input type="number" value={challengeForm.target_value} onChange={(event) => setChallengeForm({ ...challengeForm, target_value: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" />
          <button onClick={saveChallenge} className="h-11 w-full rounded-xl bg-neutral-900 font-black text-white">Creer defi</button>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-black">Recompense</h2>
          <input value={rewardForm.code} onChange={(event) => setRewardForm({ ...rewardForm, code: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" placeholder="code_unique" />
          <input value={rewardForm.name} onChange={(event) => setRewardForm({ ...rewardForm, name: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" placeholder="Nom" />
          <input value={rewardForm.icon} onChange={(event) => setRewardForm({ ...rewardForm, icon: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" />
          <button onClick={saveReward} className="h-11 w-full rounded-xl bg-yellow-500 font-black text-white">Creer recompense</button>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-black">Categorie</h2>
          <input value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" placeholder="code_unique" />
          <input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" placeholder="Nom" />
          <input value={categoryForm.pictogram} onChange={(event) => setCategoryForm({ ...categoryForm, pictogram: event.target.value })} className="mb-2 h-11 w-full rounded-xl border px-3 font-bold" />
          <button onClick={saveCategory} className="h-11 w-full rounded-xl bg-emerald-500 font-black text-white">Creer categorie</button>
        </section>
      </div>
    </div>
  );
}

export default LearningManagement;
