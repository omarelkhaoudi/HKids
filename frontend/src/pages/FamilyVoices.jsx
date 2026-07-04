import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { voicesAPI } from '../api/voices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getDownloads, getOfflineBlobUrl, offlineContentIds, saveVoiceMessageOffline } from '../services/offline/offlineContentService';
import { AudioIcon, CheckIcon, ChevronLeftIcon, DownloadIcon, EditIcon, MicrophoneIcon, PlusIcon, TrashIcon, XIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

const emptyProfileForm = {
  name: '',
  relation: '',
  language: 'fr',
  consent_given: false,
};

const emptyMessageForm = {
  title: '',
  message_text: '',
  language: 'fr',
  voice_profile_id: '',
};

function statusLabel(status) {
  const labels = {
    draft: 'Brouillon',
    sample_received: 'Echantillon recu',
    ready: 'Pret',
    needs_new_sample: 'Nouvel enregistrement requis',
    consent_required: 'Consentement requis',
    deleted: 'Supprime',
  };
  return labels[status] || status || 'En attente';
}

function qualityTone(status) {
  if (status === 'good') return 'bg-green-50 text-green-700';
  if (status === 'medium') return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

function useAudioRecorder() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState('');

  const supported = typeof window !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';

  const start = async () => {
    setError('');
    if (!supported) {
      setError("L'enregistrement audio n'est pas disponible dans ce navigateur.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];
    startedAtRef.current = Date.now();
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      setAudioBlob(blob);
      setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const clear = () => {
    setAudioBlob(null);
    setDurationSeconds(0);
    setError('');
  };

  return { supported, recording, audioBlob, durationSeconds, error, start, stop, clear };
}

function blobToFile(blob, filename) {
  if (!blob) return null;
  return new File([blob], filename, { type: blob.type || 'audio/webm' });
}

function FamilyVoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [messageForm, setMessageForm] = useState(emptyMessageForm);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const profileRecorder = useAudioRecorder();
  const messageRecorder = useAudioRecorder();
  const offlineContent = useOfflineContent();

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.status !== 'deleted'), [profiles]);

  useEffect(() => {
    if (!user) return;
    if (!['parent', 'admin'].includes(user.role)) {
      navigate('/parent/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesRes, messagesRes] = await Promise.all([
        voicesAPI.getProfiles(),
        voicesAPI.getMessages(),
      ]);
      setProfiles(profilesRes.data || []);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Error loading family voices:', error);
      if (!navigator.onLine) {
        const downloads = await getDownloads();
        setMessages(
          downloads
            .filter((item) => item.type === 'voice-message' && item.status === 'downloaded')
            .map((item) => item.payload)
        );
        showToast('Mode hors connexion: messages telecharges charges', 'info');
      } else {
        showToast('Impossible de charger les voix familiales', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetProfileForm = () => {
    setEditingProfile(null);
    setProfileForm(emptyProfileForm);
    profileRecorder.clear();
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('relation', profileForm.relation);
      formData.append('language', profileForm.language);
      formData.append('consent_given', profileForm.consent_given ? 'true' : 'false');

      const sampleFile = blobToFile(profileRecorder.audioBlob, 'voice-sample.webm');
      if (sampleFile) formData.append('sample', sampleFile);

      if (editingProfile) {
        await voicesAPI.updateProfile(editingProfile.id, formData);
        showToast('Profil vocal mis a jour', 'success');
      } else {
        await voicesAPI.createProfile(formData);
        showToast('Profil vocal cree', 'success');
      }

      resetProfileForm();
      loadData();
    } catch (error) {
      console.error('Error saving voice profile:', error);
      showToast(error.response?.data?.error || 'Impossible de sauvegarder la voix', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const editProfile = (profile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name || '',
      relation: profile.relation || '',
      language: profile.language || 'fr',
      consent_given: profile.consent_given === true,
    });
    profileRecorder.clear();
  };

  const deleteProfile = async (profile) => {
    if (!window.confirm(`Supprimer definitivement la voix de ${profile.name} ?`)) return;
    try {
      await voicesAPI.deleteProfile(profile.id);
      showToast('Profil vocal supprime definitivement', 'info');
      loadData();
    } catch (error) {
      console.error('Error deleting voice profile:', error);
      showToast('Impossible de supprimer cette voix', 'error');
    }
  };

  const playPreview = async (profile) => {
    try {
      const response = await voicesAPI.getPreviewBlob(profile.id);
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      showToast("Apercu audio indisponible", 'info');
    }
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    setSavingMessage(true);

    try {
      const formData = new FormData();
      formData.append('title', messageForm.title);
      formData.append('message_text', messageForm.message_text);
      formData.append('language', messageForm.language);
      formData.append('duration_seconds', String(messageRecorder.durationSeconds || 0));
      if (messageForm.voice_profile_id) formData.append('voice_profile_id', messageForm.voice_profile_id);

      const audioFile = blobToFile(messageRecorder.audioBlob, 'voice-message.webm');
      if (audioFile) formData.append('audio', audioFile);

      await voicesAPI.createMessage(formData);
      setMessageForm(emptyMessageForm);
      messageRecorder.clear();
      showToast('Message personnalise enregistre', 'success');
      loadData();
    } catch (error) {
      console.error('Error saving voice message:', error);
      showToast(error.response?.data?.error || 'Impossible de sauvegarder le message', 'error');
    } finally {
      setSavingMessage(false);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(`Supprimer le message "${message.title}" ?`)) return;
    try {
      await voicesAPI.deleteMessage(message.id);
      showToast('Message supprime', 'info');
      loadData();
    } catch (error) {
      console.error('Error deleting voice message:', error);
      showToast('Impossible de supprimer ce message', 'error');
    }
  };

  const playMessage = async (message) => {
    try {
      const record = offlineContent.downloadsById[offlineContentIds.voiceMessage(message.id)];
      const audioAssetKey = record?.assetKeys?.find((key) => key.endsWith(':audio'));
      const offlineAudioUrl = audioAssetKey ? await getOfflineBlobUrl(audioAssetKey) : null;
      const audioUrl = offlineAudioUrl || URL.createObjectURL((await voicesAPI.getMessageAudioBlob(message.id)).data);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      showToast('Audio du message indisponible', 'info');
    }
  };

  const downloadMessage = async (message) => {
    try {
      const audioBlob = message.has_audio ? (await voicesAPI.getMessageAudioBlob(message.id)).data : null;
      await saveVoiceMessageOffline(message, audioBlob);
      await offlineContent.refreshDownloads();
      showToast('Message disponible hors connexion', 'success');
    } catch (error) {
      console.error('Voice message download failed:', error);
      showToast('Telechargement du message impossible', 'error');
    }
  };

  const removeMessageDownload = async (message) => {
    try {
      await offlineContent.deleteDownload(offlineContentIds.voiceMessage(message.id));
      showToast('Message hors connexion supprime', 'info');
    } catch (error) {
      showToast('Suppression impossible', 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="font-bold text-neutral-600">Chargement des voix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link to="/parent" className="shrink-0">
            <Logo size="default" showText={true} />
          </Link>
          <Link to="/parent" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-800 shadow-md">
            <ChevronLeftIcon className="h-5 w-5" />
            Retour
          </Link>
        </header>

        <section className="mb-6 rounded-[2rem] bg-gradient-to-br from-red-500 via-pink-500 to-violet-500 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black">
                <AudioIcon className="h-5 w-5" />
                Le Lit Qui Lit
              </div>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">Voix de la famille</h1>
              <p className="mt-3 max-w-2xl text-base font-bold text-white/85">
                Enregistrez des voix autorisees et des messages courts pour accompagner les histoires.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/20 px-5 py-4">
                <span className="block text-3xl font-black">{activeProfiles.length}</span>
                <span className="text-sm font-bold text-white/80">profils</span>
              </div>
              <div className="rounded-2xl bg-white/20 px-5 py-4">
                <span className="block text-3xl font-black">{messages.length}</span>
                <span className="text-sm font-bold text-white/80">messages</span>
              </div>
            </div>
          </div>
        </section>

        <main className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{editingProfile ? 'Modifier une voix' : 'Ajouter un profil vocal'}</h2>
                  <p className="text-sm font-bold text-neutral-500">Consentement explicite et controle qualite obligatoires.</p>
                </div>
                {editingProfile && (
                  <button onClick={resetProfileForm} className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-700">
                    Annuler
                  </button>
                )}
              </div>

              <form onSubmit={submitProfile} className="grid gap-4 lg:grid-cols-2">
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                  placeholder="Nom de la voix"
                  className="h-12 rounded-xl border-2 border-neutral-100 px-4 font-bold outline-none focus:border-rose-300"
                  required
                />
                <input
                  value={profileForm.relation}
                  onChange={(event) => setProfileForm({ ...profileForm, relation: event.target.value })}
                  placeholder="Relation avec l'enfant"
                  className="h-12 rounded-xl border-2 border-neutral-100 px-4 font-bold outline-none focus:border-rose-300"
                  required
                />
                <select
                  value={profileForm.language}
                  onChange={(event) => setProfileForm({ ...profileForm, language: event.target.value })}
                  className="h-12 rounded-xl border-2 border-neutral-100 px-4 font-bold outline-none focus:border-rose-300"
                >
                  <option value="fr">Francais</option>
                  <option value="en">English</option>
                  <option value="ar">Arabe</option>
                </select>
                <label className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-neutral-100 px-4 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={profileForm.consent_given}
                    onChange={(event) => setProfileForm({ ...profileForm, consent_given: event.target.checked })}
                    className="h-5 w-5 accent-rose-500"
                  />
                  Consentement explicite pour creer et utiliser cette voix.
                </label>

                <RecorderPanel recorder={profileRecorder} title="Parcours guide d'enregistrement" />

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <h3 className="mb-2 font-black">Controle qualite</h3>
                  <ul className="space-y-2 text-sm font-bold text-neutral-600">
                    <li className="flex gap-2"><CheckIcon className="h-5 w-5 text-green-600" /> 20 a 30 secondes dans un endroit calme.</li>
                    <li className="flex gap-2"><CheckIcon className="h-5 w-5 text-green-600" /> Lire une phrase naturelle avec une voix stable.</li>
                    <li className="flex gap-2"><CheckIcon className="h-5 w-5 text-green-600" /> Eviter musique, bruit et plusieurs personnes.</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 font-black text-white disabled:opacity-60 lg:col-span-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  {savingProfile ? 'Sauvegarde...' : editingProfile ? 'Mettre a jour la voix' : 'Ajouter la voix'}
                </button>
              </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {activeProfiles.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 text-center shadow md:col-span-2">
                  <MicrophoneIcon className="mx-auto mb-3 h-10 w-10 text-rose-500" />
                  <p className="font-black">Aucune voix familiale</p>
                  <p className="mt-1 text-sm font-bold text-neutral-500">Ajoutez une voix pour la proposer dans le lecteur.</p>
                </div>
              ) : activeProfiles.map((profile) => (
                <article key={profile.id} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{profile.name}</h3>
                      <p className="text-sm font-bold text-neutral-500">{profile.relation} - {profile.language?.toUpperCase()}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{statusLabel(profile.status)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className={`rounded-full px-3 py-1 ${qualityTone(profile.quality_status)}`}>
                      Qualite {profile.quality_score}%
                    </span>
                    {profile.consent_given && <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Consentement OK</span>}
                  </div>
                  {profile.quality_notes && <p className="mt-3 text-sm font-bold text-neutral-500">{profile.quality_notes}</p>}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button onClick={() => playPreview(profile)} disabled={!profile.has_preview} className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-black text-white disabled:opacity-40">
                      Apercu
                    </button>
                    <button onClick={() => editProfile(profile)} className="inline-flex items-center justify-center rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteProfile(profile)} className="inline-flex items-center justify-center rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-lg">
              <h2 className="text-xl font-black">Messages personnalises</h2>
              <p className="mt-1 text-sm font-bold text-neutral-500">Courts messages du soir, encouragements ou mots doux.</p>

              <form onSubmit={submitMessage} className="mt-4 space-y-3">
                <input
                  value={messageForm.title}
                  onChange={(event) => setMessageForm({ ...messageForm, title: event.target.value })}
                  placeholder="Titre du message"
                  className="h-12 w-full rounded-xl border-2 border-neutral-100 px-4 font-bold outline-none focus:border-sky-300"
                  required
                />
                <textarea
                  value={messageForm.message_text}
                  onChange={(event) => setMessageForm({ ...messageForm, message_text: event.target.value })}
                  placeholder="Texte optionnel"
                  className="min-h-24 w-full rounded-xl border-2 border-neutral-100 px-4 py-3 font-bold outline-none focus:border-sky-300"
                />
                <select
                  value={messageForm.voice_profile_id}
                  onChange={(event) => setMessageForm({ ...messageForm, voice_profile_id: event.target.value })}
                  className="h-12 w-full rounded-xl border-2 border-neutral-100 px-4 font-bold outline-none focus:border-sky-300"
                >
                  <option value="">Sans voix associee</option>
                  {activeProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
                <RecorderPanel recorder={messageRecorder} title="Enregistrer le message" compact />
                <button disabled={savingMessage} className="w-full rounded-xl bg-sky-500 px-4 py-3 font-black text-white disabled:opacity-60">
                  {savingMessage ? 'Sauvegarde...' : 'Enregistrer le message'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-lg">
              <h2 className="mb-3 text-xl font-black">Messages sauvegardes</h2>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="rounded-xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">Aucun message pour le moment.</p>
                ) : messages.map((message) => {
                  const offlineReady = offlineContent.downloadsById[offlineContentIds.voiceMessage(message.id)]?.status === 'downloaded';
                  return (
                  <article key={message.id} className="rounded-xl border border-neutral-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{message.title}</p>
                        <p className="text-xs font-bold text-neutral-500">{message.language?.toUpperCase()} {message.has_audio ? '- audio' : '- texte'}</p>
                      </div>
                      <button onClick={() => deleteMessage(message)} className="rounded-lg bg-red-50 p-2 text-red-600">
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {message.message_text && <p className="mt-2 text-sm font-bold text-neutral-600">{message.message_text}</p>}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => playMessage(message)}
                        disabled={!message.has_audio}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                      >
                        <AudioIcon className="h-4 w-4" />
                        Ecouter
                      </button>
                      <button
                        type="button"
                        onClick={() => offlineReady ? removeMessageDownload(message) : downloadMessage(message)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${
                          offlineReady ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <DownloadIcon className="h-4 w-4" />
                        {offlineReady ? 'Retirer offline' : 'Telecharger'}
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

function RecorderPanel({ recorder, title, compact = false }) {
  const previewUrl = recorder.audioBlob ? URL.createObjectURL(recorder.audioBlob) : '';
  const qualityHint = recorder.audioBlob
    ? recorder.audioBlob.size > 120000 ? 'Qualite probable bonne' : 'Echantillon court'
    : 'Pret a enregistrer';

  return (
    <div className={`rounded-2xl bg-neutral-50 p-4 ${compact ? '' : 'lg:col-span-1'}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black">{title}</h3>
          <p className="text-xs font-bold text-neutral-500">{qualityHint}</p>
        </div>
        <MicrophoneIcon className="h-6 w-6 text-rose-500" />
      </div>
      {recorder.error && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">{recorder.error}</p>}
      <div className="flex flex-wrap gap-2">
        {!recorder.recording ? (
          <button type="button" onClick={recorder.start} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white">
            Enregistrer
          </button>
        ) : (
          <button type="button" onClick={recorder.stop} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-black text-white">
            Stop
          </button>
        )}
        {recorder.audioBlob && (
          <button type="button" onClick={recorder.clear} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-neutral-700">
            Refaire
          </button>
        )}
      </div>
      {previewUrl && (
        <audio controls src={previewUrl} className="mt-3 w-full" />
      )}
      {recorder.durationSeconds > 0 && (
        <p className="mt-2 text-xs font-bold text-neutral-500">Duree: {recorder.durationSeconds}s</p>
      )}
    </div>
  );
}

export default FamilyVoices;
