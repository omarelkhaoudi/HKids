import {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {voicesAPI} from '../api/voices';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {useToast} from '../components/ToastProvider';
import {useOfflineContent} from '../hooks/useOfflineContent';
import {getDownloads, getOfflineBlobUrl, offlineContentIds, saveVoiceMessageOffline} from '../services/offline/offlineContentService';
import {
 AudioIcon, CheckIcon, ChevronLeftIcon, DownloadIcon, EditIcon, 
 MicrophoneIcon, PlusIcon, TrashIcon, XIcon, ShieldIcon, SparklesIcon,
 PlayIcon, PauseIcon, StarIcon, SettingsIcon
} from '../components/Icons';
import {Logo} from '../components/Logo';
import {Button, Card, Badge, Avatar, ProgressBar, Skeleton} from '../components/ui';
import { MagicalBackground } from '../components/layout/PlatformShell';
import { BRAND_HERO_GRADIENT, BRAND_SEMANTIC } from '../constants/brandTheme';

// Original empty forms
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

function statusLabel(status, t) {
 const labels = {
 draft: t('parentVoiceStatusDraft'),
 sample_received: t('parentVoiceStatusSample'),
 ready: t('parentVoiceStatusReady'),
 needs_new_sample: t('parentVoiceStatusNeedsSample'),
 consent_required: t('parentVoiceStatusConsentRequired'),
 consent_revoked: t('parentVoiceStatusConsentRevoked'),
 provider_deletion_pending: t('parentVoiceStatusDeletionPending'),
 deleted: t('parentVoiceStatusDeleted'),
};
 return labels[status] || status || t('parentVoiceStatusPending');
}

function qualityTone(status) {
 if (status === 'good') return `${BRAND_SEMANTIC.success.bg} ${BRAND_SEMANTIC.success.text}`;
 if (status === 'medium') return `${BRAND_SEMANTIC.warning.bg} ${BRAND_SEMANTIC.warning.text}`;
 return 'bg-rose-100 text-rose-800';
}

// Custom hook from original code
function useAudioRecorder(t) {
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
 setError(t('parentVoiceMicUnavailable'));
 return;
}

 try {
 const stream = await navigator.mediaDevices.getUserMedia({audio: true});
 chunksRef.current = [];
 startedAtRef.current = Date.now();
 const recorder = new MediaRecorder(stream);
 recorderRef.current = recorder;

 recorder.ondataavailable = (event) => {
 if (event.data?.size > 0) chunksRef.current.push(event.data);
};

 recorder.onstop = () => {
 const blob = new Blob(chunksRef.current, {type: recorder.mimeType || 'audio/webm'});
 setAudioBlob(blob);
 setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
 stream.getTracks().forEach((track) => track.stop());
};

 recorder.start();
 setRecording(true);
} catch (err) {
 setError(t('parentVoiceMicError'));
}
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

 return {supported, recording, audioBlob, durationSeconds, error, start, stop, clear};
}

function blobToFile(blob, filename) {
 if (!blob) return null;
 const mimeType = (blob.type || 'audio/webm').split(';')[0];
 const extension = mimeType.includes('mp4') ? '.m4a'
 : mimeType.includes('ogg') ? '.ogg'
 : mimeType.includes('wav') ? '.wav'
 : mimeType.includes('mpeg') ? '.mp3'
 : '.webm';
 const baseName = filename.replace(/\.[^.]+$/, '');
 return new File([blob], `${baseName}${extension}`, {type: mimeType});
}

function FamilyVoices() {
 const {user} = useAuth();
 const navigate = useNavigate();
 const {showToast} = useToast();
 const { t, isRtl } = useLanguage();
 const [profiles, setProfiles] = useState([]);
 const [messages, setMessages] = useState([]);
 const [profileForm, setProfileForm] = useState(emptyProfileForm);
 const [messageForm, setMessageForm] = useState(emptyMessageForm);
 const [editingProfile, setEditingProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [savingProfile, setSavingProfile] = useState(false);
 const [savingMessage, setSavingMessage] = useState(false);
 const profileRecorder = useAudioRecorder(t);
 const messageRecorder = useAudioRecorder(t);
 const offlineContent = useOfflineContent();

 // WIZARD STATE
 const [wizardStep, setWizardStep] = useState(0); // 0: off, 1: intro, 2: record, 3: analyze, 4: preview, 5: success
 const [aiProgress, setAiProgress] = useState(0);

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
 showToast(t('parentVoiceOffline'), 'info');
} else {
 showToast(t('parentVoiceLoadError'), 'error');
}
} finally {
 setLoading(false);
}
};

 const resetProfileForm = () => {
 setEditingProfile(null);
 setProfileForm(emptyProfileForm);
 profileRecorder.clear();
 setWizardStep(0);
};

 const submitProfile = async (event) => {
 if(event) event.preventDefault();
 setSavingProfile(true);
 setWizardStep(3); // Start AI Analysis Loading State

 // Simulate AI progress steps visually
 const progressInterval = setInterval(() => {
 setAiProgress(p => (p < 90 ? p + 5 : p));
}, 500);

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
} else {
 await voicesAPI.createProfile(formData);
}
 
 clearInterval(progressInterval);
 setAiProgress(100);
 
 setTimeout(() => {
 setWizardStep(5); // Success celebration
 loadData();
}, 1000);

} catch (error) {
 clearInterval(progressInterval);
 console.error('Error saving voice profile:', error);
 showToast(error.response?.data?.error || t('parentVoiceSaveError'), 'error');
 setWizardStep(2); // Go back to record
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
 setWizardStep(2); // Jump straight to recording/form
};

 const deleteProfile = async (profile) => {
 if (!window.confirm(`Supprimer définitivement la voix de ${profile.name} ?`)) return;
 try {
 await voicesAPI.deleteProfile(profile.id);
 showToast(t('parentVoiceProfileDeleted'), 'info');
 loadData();
} catch (error) {
 showToast(error.response?.data?.error || t('parentDeleteError'), 'error');
}
};

 const revokeConsent = async (profile) => {
 if (!window.confirm(t('parentVoiceRevokeConfirm', { name: profile.name }))) return;
 try {
 const response = await voicesAPI.revokeConsent(profile.id);
 showToast(
 response.data?.status === 'provider_deletion_pending'
 ? t('parentVoiceRevokePending')
 : t('parentVoiceRevokeSuccess'),
 response.data?.status === 'provider_deletion_pending' ? 'warning' : 'info'
 );
 loadData();
 } catch (error) {
 showToast(error.response?.data?.error || t('parentVoiceRevokeError'), 'error');
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
 showToast(t('parentVoicePreviewUnavailable'), 'info');
}
};

 // Messages logic
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
 showToast(t('parentVoiceMessageSaved'), 'success');
 loadData();
} catch (error) {
 showToast(t('parentVoiceMessageSaveError'), 'error');
} finally {
 setSavingMessage(false);
}
};

 const deleteMessage = async (message) => {
 if (!window.confirm(`Supprimer le message"${message.title}" ?`)) return;
 try {
 await voicesAPI.deleteMessage(message.id);
 showToast(t('parentVoiceMessageDeleted'), 'info');
 loadData();
} catch (error) {
 showToast(t('parentVoiceMessageSaveError'), 'error');
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
 showToast(t('parentVoiceAudioUnavailable'), 'info');
}
};

 const downloadMessage = async (message) => {
 try {
 const audioBlob = message.has_audio ? (await voicesAPI.getMessageAudioBlob(message.id)).data : null;
 await saveVoiceMessageOffline(message, audioBlob);
 await offlineContent.refreshDownloads();
 showToast(t('parentVoiceDownloaded'), 'success');
} catch (error) {
 showToast(t('parentVoiceDownloadError'), 'error');
}
};

 const removeMessageDownload = async (message) => {
 try {
 await offlineContent.deleteDownload(offlineContentIds.voiceMessage(message.id));
 showToast(t('parentVoiceRemovedOffline'), 'info');
} catch (error) {
 showToast(t('parentVoiceRemoveError'), 'error');
}
};

 if (loading && profiles.length === 0) {
 return (
 <div className="min-h-screen bg-background flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
 <div className="flex flex-col items-center">
 <motion.div animate={{rotate: 360}} transition={{duration: 2, repeat: Infinity, ease: 'linear'}}>
 <SparklesIcon className="w-12 h-12 text-foreground-500" />
 </motion.div>
 <p className="mt-4 font-bold text-foreground-secondary">{t('parentVoiceLoading')}</p>
 </div>
 </div>
 );
}

 return (
 <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
 <MagicalBackground preset="platform" />
 
 {/* HEADER */}
 <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm px-4 py-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link to="/parent" className="p-2 rounded-full hover:bg-surface-secondary transition-colors">
 <ChevronLeftIcon className="h-6 w-6 text-foreground-secondary" />
 </Link>
 <Link to="/parent" className="shrink-0 hidden md:block">
 <Logo size="default" showText={true} />
 </Link>
 <div className="h-6 w-px bg-surface-300 hidden md:block"></div>
 <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center gap-2">
 <MicrophoneIcon className="w-6 h-6 text-foreground-500" />
 {t('parentVoiceStudio')}
 </h1>
 </div>
 <Button onClick={() => setWizardStep(1)} variant="primary" className="rounded-full shadow-lg hover:scale-105">
 <PlusIcon className="w-5 h-5 mr-1"/> {t('parentVoiceAdd')}
 </Button>
 </header>

 {/* DASHBOARD */}
 <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12">
 
 {/* SAFETY CARDS */}
 <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-secondary-50 rounded-2xl p-5 border border-secondary-100 flex gap-4">
 <div className="bg-secondary-500 text-white p-3 rounded-full h-fit"><ShieldIcon className="w-6 h-6"/></div>
 <div>
 <h3 className="font-bold text-secondary-900">{t('parentVoiceSafetyStorageTitle')}</h3>
 <p className="text-sm text-secondary-700 mt-1">{t('parentVoiceSafetyStorageDesc')}</p>
 </div>
 </div>
 <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100 flex gap-4">
 <div className="bg-primary-500 text-white p-3 rounded-full h-fit"><CheckIcon className="w-6 h-6"/></div>
 <div>
 <h3 className="font-bold text-primary-900">{t('parentVoiceSafetyConsentTitle')}</h3>
 <p className="text-sm text-primary-700 mt-1">{t('parentVoiceSafetyConsentDesc')}</p>
 </div>
 </div>
 <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 flex gap-4">
 <div className="bg-rose-500 text-white p-3 rounded-full h-fit"><TrashIcon className="w-6 h-6"/></div>
 <div>
 <h3 className="font-bold text-rose-900">{t('parentVoiceSafetyControlTitle')}</h3>
 <p className="text-sm text-rose-700 mt-1">{t('parentVoiceSafetyControlDesc')}</p>
 </div>
 </div>
 </section>

 {/* VOICE LIBRARY */}
 <section>
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-2xl font-black text-foreground">{t('parentVoiceLibrary')}</h2>
 <Badge variant="soft" className="bg-primary-100 text-foreground-800">{t('parentVoiceCount', { count: activeProfiles.length })}</Badge>
 </div>

 {activeProfiles.length === 0 ? (
 <Card className="text-center py-space-32 rounded-32 border-2 border-dashed border-border/60 bg-card shadow-card flex flex-col items-center parent-empty-state">
 <motion.div
 className="text-6xl mb-space-16"
 animate={{ y: [0, -6, 0] }}
 transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
 aria-hidden="true"
 >
 🎙️
 </motion.div>
 <h3 className="text-heading-l font-black text-foreground mb-2">{t('parentVoiceEmptyTitle')}</h3>
 <p className="text-body-lg text-foreground-secondary max-w-md mx-auto mb-space-24 font-medium">
 {t('parentVoiceEmptyDesc')}
 </p>
 <Button onClick={() => setWizardStep(1)} variant="primary" size="lg" className="rounded-32 shadow-floating min-h-touch font-bold">
 {t('parentVoiceCreateFirst')}
 </Button>
 </Card>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {activeProfiles.map((profile) => (
 <motion.div key={profile.id} whileHover={{y: -5}} className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border relative group overflow-hidden">
 <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary-400 to-secondary-500"></div>
 
 <div className="flex items-start justify-between mb-4 mt-2">
 <div className="flex items-center gap-3">
 <Avatar src={null} fallback={profile.name.charAt(0).toUpperCase()} className="w-14 h-14 bg-gradient-to-br from-primary-400 to-secondary-500 text-white font-bold text-xl" />
 <div>
 <h3 className="font-black text-lg text-foreground leading-tight">{profile.name}</h3>
 <p className="text-sm font-bold text-foreground-muted">{profile.relation}</p>
 </div>
 </div>
 {/* Fake default badge */}
 <div className="bg-accent-100 text-accent-700 p-1.5 rounded-full"><StarIcon className="w-4 h-4"/></div>
 </div>

 <div className="flex flex-wrap gap-2 mb-6">
 <Badge variant="soft" className="bg-surface-secondary text-foreground-secondary font-bold uppercase tracking-wider text-xs">{profile.language}</Badge>
 <Badge variant="soft" className="bg-primary-50 text-foreground-secondary font-bold text-xs">{statusLabel(profile.status, t)}</Badge>
 <Badge variant="soft" className={`${qualityTone(profile.quality_status)} font-bold text-xs`}>
 {t('parentVoiceQualityLabel', { score: profile.quality_score || '85' })}
 </Badge>
{!profile.consent_given && (
<Badge variant="soft" className="bg-rose-50 text-rose-700 font-bold text-xs">{t('parentVoiceConsentRevokedBadge')}</Badge>
)}
 </div>

 <div className="grid grid-cols-2 gap-2 mt-auto">
 <Button variant="outline" onClick={() => playPreview(profile)} disabled={!profile.has_preview} className="rounded-full font-bold text-sm bg-surface-secondary border-border">
 <PlayIcon className="w-4 h-4 mr-1"/> {t('parentVoicePreview')}
 </Button>
 <div className="flex gap-2">
 <Button variant="outline" onClick={() => editProfile(profile)} className="rounded-full w-full px-0 font-bold text-sm bg-surface-secondary border-border text-foreground-secondary hover:bg-surface-secondary">
 <EditIcon className="w-4 h-4" />
 </Button>
{(profile.consent_given || profile.status === 'provider_deletion_pending') && (
<Button variant="outline" title={profile.consent_given ? t('parentVoiceRevokeConsent') : t('parentVoiceRetryDeletion')} onClick={() => revokeConsent(profile)} className="rounded-full w-full px-0 font-bold text-sm bg-accent-50 border-accent-100 text-accent-700 hover:bg-accent-100">
<ShieldIcon className="w-4 h-4" />
</Button>
)}
 <Button variant="outline" onClick={() => deleteProfile(profile)} className="rounded-full w-full px-0 font-bold text-sm bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100">
 <TrashIcon className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </section>

 {/* CUSTOM MESSAGES */}
 <section className="bg-card rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border">
 <div className="flex flex-col lg:flex-row gap-12">
 
 {/* Create Message Form */}
 <div className="lg:w-1/3">
 <h2 className="text-2xl font-black text-foreground mb-2">{t('parentVoiceMessagesTitle')}</h2>
 <p className="text-foreground-muted mb-6 font-medium">{t('parentVoiceMessagesDesc')}</p>
 
 <form onSubmit={submitMessage} className="space-y-4">
 <input
 value={messageForm.title}
 onChange={(event) => setMessageForm({...messageForm, title: event.target.value})}
 placeholder={t('parentVoiceMessageTitlePlaceholder')}
 className="w-full rounded-2xl border-2 border-border px-4 py-3 font-bold outline-none focus:border-primary-400 bg-surface-secondary focus:bg-card transition-colors"
 required
 />
 <textarea
 value={messageForm.message_text}
 onChange={(event) => setMessageForm({...messageForm, message_text: event.target.value})}
 placeholder={t('parentVoiceMessageTextPlaceholder')}
 className="w-full rounded-2xl border-2 border-border px-4 py-3 font-bold outline-none focus:border-primary-400 min-h-[100px] bg-surface-secondary focus:bg-card transition-colors"
 />
 <select
 value={messageForm.voice_profile_id}
 onChange={(event) => setMessageForm({...messageForm, voice_profile_id: event.target.value})}
 className="w-full rounded-2xl border-2 border-border px-4 py-3 font-bold outline-none focus:border-primary-400 bg-surface-secondary focus:bg-card transition-colors"
 >
 <option value="">{t('parentVoiceMessageNoVoice')}</option>
 {activeProfiles.map((profile) => (
 <option key={profile.id} value={profile.id}>{t('parentVoiceMessageVoiceOption', { name: profile.name })}</option>
 ))}
 </select>
 
 {/* Compact Recorder */}
 <div className="bg-surface-secondary border-2 border-border rounded-2xl p-4">
 <div className="flex items-center justify-between mb-3">
 <span className="font-bold text-sm text-foreground-secondary">{t('parentVoiceMessageDirectAudio')}</span>
 {messageRecorder.recording && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
 </div>
 
 <div className="flex gap-2">
 {!messageRecorder.recording ? (
 <Button type="button" onClick={messageRecorder.start} variant="outline" className="w-full bg-card border-border text-rose-600 hover:bg-rose-50 rounded-xl font-bold">
 <MicrophoneIcon className="w-4 h-4 mr-2"/> {t('parentVoiceRecord')}
 </Button>
 ) : (
 <Button type="button" onClick={messageRecorder.stop} variant="primary" className="w-full bg-surface-900 hover:bg-surface-800 rounded-xl font-bold">
 <PauseIcon className="w-4 h-4 mr-2"/> {t('parentVoiceStop')} ({messageRecorder.durationSeconds}s)
 </Button>
 )}
 {messageRecorder.audioBlob && (
 <Button type="button" onClick={messageRecorder.clear} variant="outline" className="px-3 border-border rounded-xl hover:bg-surface-secondary"><TrashIcon className="w-4 h-4"/></Button>
 )}
 </div>
 {messageRecorder.audioBlob && (
 <audio controls src={URL.createObjectURL(messageRecorder.audioBlob)} className="mt-3 w-full h-8" />
 )}
 </div>

 <Button type="submit" disabled={savingMessage || messageRecorder.recording} variant="primary" className="w-full rounded-2xl py-4 shadow-lg hover:shadow-xl font-black text-lg bg-gradient-to-r from-primary-500 to-secondary-500 border-none">
 {savingMessage ? t('parentVoiceSavingMessage') : t('parentVoiceSaveMessage')}
 </Button>
 </form>
 </div>

 {/* Message List */}
 <div className="lg:w-2/3 bg-surface-secondary rounded-3xl p-6 border border-border">
 <h3 className="text-lg font-black text-foreground mb-4">{t('parentVoiceSavedMessages')}</h3>
 <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
 {messages.length === 0 ? (
 <div className="text-center py-10 opacity-50">
 <AudioIcon className="w-12 h-12 mx-auto mb-2" />
 <p className="font-bold">{t('parentVoiceNoMessages')}</p>
 </div>
 ) : messages.map((message) => {
 const offlineReady = offlineContent.downloadsById[offlineContentIds.voiceMessage(message.id)]?.status === 'downloaded';
 return (
 <div key={message.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border flex flex-col md:flex-row justify-between md:items-center gap-4">
 <div>
 <h4 className="font-black text-foreground text-lg">{message.title}</h4>
 {message.message_text && <p className="text-sm font-medium text-foreground-muted line-clamp-1">{message.message_text}</p>}
 <div className="flex gap-2 mt-2">
 <Badge variant="soft" className="bg-surface-secondary text-xs font-bold uppercase">{message.language}</Badge>
 {message.has_audio && <Badge variant="soft" className="bg-primary-100 text-primary-800 text-xs font-bold">Audio inclus</Badge>}
 </div>
 </div>
 
 <div className="flex gap-2 self-start md:self-auto">
 <Button variant="outline" onClick={() => playMessage(message)} disabled={!message.has_audio} className="rounded-full bg-surface-secondary border-border">
 <PlayIcon className="w-4 h-4"/>
 </Button>
 <Button variant="outline" onClick={() => offlineReady ? removeMessageDownload(message) : downloadMessage(message)} className={`rounded-full border-border ${offlineReady ? 'bg-secondary-50 text-secondary-700 border-secondary-200' : 'bg-surface-secondary'}`}>
 <DownloadIcon className="w-4 h-4"/>
 </Button>
 <Button variant="outline" onClick={() => deleteMessage(message)} className="rounded-full bg-surface-secondary border-border text-rose-600 hover:bg-rose-50 hover:border-rose-200">
 <TrashIcon className="w-4 h-4"/>
 </Button>
 </div>
 </div>
 );
})}
 </div>
 </div>
 </div>
 </section>

 </main>

 {/* MULTI-STEP VOICE CLONING WIZARD MODAL */}
 <AnimatePresence>
 {wizardStep > 0 && (
 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-sm">
 <motion.div 
 initial={{scale: 0.9, y: 20, opacity: 0}} 
 animate={{scale: 1, y: 0, opacity: 1}} 
 exit={{scale: 0.9, y: 20, opacity: 0}}
 className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative"
 >
 {/* Close Button */}
 {wizardStep < 3 && (
 <button onClick={resetProfileForm} className="absolute top-6 right-6 p-2 bg-surface-secondary hover:bg-surface-200 rounded-full text-foreground-secondary transition-colors z-10">
 <XIcon className="w-5 h-5" />
 </button>
 )}

 <div className="p-8 md:p-12">
 
 {/* STEP 1: INTRO */}
 {wizardStep === 1 && (
 <div className="text-center">
 <div className="w-24 h-24 bg-primary-100 text-foreground-500 rounded-full flex items-center justify-center mx-auto mb-6">
 <SparklesIcon className="w-12 h-12" />
 </div>
 <h2 className="text-3xl font-black text-foreground mb-4">Créez votre Clone Vocal</h2>
 <p className="text-lg text-foreground-secondary font-medium mb-8 max-w-md mx-auto">
 Votre voix peut lire des histoires à vos enfants, même quand vous êtes absent. Vous gardez le contrôle du consentement et de la suppression.
 </p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
 <div className="bg-surface-secondary p-4 rounded-2xl flex gap-3 items-start">
 <MicrophoneIcon className="w-6 h-6 text-primary-500 shrink-0" />
 <div><h4 className="font-bold">30 secondes suffisent</h4><p className="text-sm text-foreground-muted">Lisez un court texte avec naturel.</p></div>
 </div>
 <div className="bg-surface-secondary p-4 rounded-2xl flex gap-3 items-start">
 <ShieldIcon className="w-6 h-6 text-secondary-500 shrink-0" />
 <div><h4 className="font-bold">Accès protégé</h4><p className="text-sm text-foreground-muted">Stocké avec un accès authentifié et supprimable à tout moment.</p></div>
 </div>
 </div>

 <Button onClick={() => setWizardStep(2)} variant="primary" size="lg" className="w-full md:w-auto rounded-full px-12 shadow-xl shadow-primary-500/30 font-black text-lg">
 Commencer
 </Button>
 </div>
 )}

 {/* STEP 2: RECORD & FORM */}
 {wizardStep === 2 && (
 <div>
 <h2 className="text-2xl font-black text-foreground mb-2">Informations & Enregistrement</h2>
 <p className="text-foreground-muted mb-6 font-medium">Pour une voix parfaite, placez-vous dans un endroit calme.</p>
 
 <form id="voice-form" onSubmit={submitProfile} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <input
 value={profileForm.name}
 onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
 placeholder="Prénom (ex: Maman)"
 className="w-full rounded-2xl border-2 border-border px-4 py-3 font-bold outline-none focus:border-primary-400 bg-surface-secondary focus:bg-card transition-colors"
 required
 />
 <input
 value={profileForm.relation}
 onChange={(e) => setProfileForm({...profileForm, relation: e.target.value})}
 placeholder="Relation (ex: Mère)"
 className="w-full rounded-2xl border-2 border-border px-4 py-3 font-bold outline-none focus:border-primary-400 bg-surface-secondary focus:bg-card transition-colors"
 required
 />
 </div>
 
 {/* Magical Recording UI */}
 <div className="bg-gradient-to-b from-surface-50 to-surface-100 rounded-3xl p-6 md:p-8 border-2 border-border text-center relative overflow-hidden">
 {/* Quality Meter Mockup */}
 <div className="absolute top-4 left-4 flex gap-2">
 <div className={`h-2 w-8 rounded-full ${profileRecorder.recording ? 'bg-secondary-400' : 'bg-surface-300'}`}></div>
 <div className={`h-2 w-8 rounded-full ${profileRecorder.recording ? 'bg-secondary-400' : 'bg-surface-300'}`}></div>
 <div className={`h-2 w-8 rounded-full ${profileRecorder.recording && profileRecorder.durationSeconds > 5 ? 'bg-secondary-400' : 'bg-surface-300'}`}></div>
 </div>
 {profileRecorder.recording && <span className="absolute top-3 right-4 text-xs font-black text-secondary-600 bg-secondary-100 px-2 py-1 rounded-full uppercase">Qualité Optimale</span>}

 <h3 className="text-lg font-black text-foreground mb-2 mt-4">Enregistrez un échantillon</h3>
 <p className="text-sm font-medium text-foreground-muted mb-8 max-w-sm mx-auto">
 Lisez ce texte à voix haute :"Bonjour, je suis très heureux de te raconter une merveilleuse histoire aujourd'hui."
 </p>

 <div className="flex justify-center mb-8 relative h-32 items-center">
 {/* Animated Waveform */}
 {profileRecorder.recording && (
 <div className="absolute inset-0 flex items-center justify-center gap-1">
 {[...Array(12)].map((_, i) => (
 <motion.div 
 key={i} 
 animate={{height: [10, Math.random() * 80 + 20, 10]}} 
 transition={{duration: 0.5, repeat: Infinity, delay: i * 0.1}}
 className="w-2 bg-rose-400 rounded-full" 
 />
 ))}
 </div>
 )}

 {/* Massive Mic Button */}
 <motion.button 
 type="button"
 whileHover={{scale: 1.05}}
 whileTap={{scale: 0.95}}
 onClick={profileRecorder.recording ? profileRecorder.stop : profileRecorder.start}
 className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-colors ${profileRecorder.recording ? 'bg-rose-500 text-white' : 'bg-primary-500 text-white'}`}
 >
 {profileRecorder.recording ? <PauseIcon className="w-10 h-10" /> : <MicrophoneIcon className="w-10 h-10" />}
 {profileRecorder.recording && <span className="absolute -inset-4 rounded-full border-4 border-rose-300 animate-ping opacity-75"></span>}
 </motion.button>
 </div>

 <div className="flex items-center justify-center gap-4">
 {profileRecorder.recording ? (
 <span className="font-black text-rose-500 text-xl font-mono">{profileRecorder.durationSeconds}s</span>
 ) : (
 profileRecorder.durationSeconds > 0 && <span className="font-black text-foreground-muted text-xl font-mono">{profileRecorder.durationSeconds}s capturés</span>
 )}
 {profileRecorder.audioBlob && !profileRecorder.recording && (
 <Button type="button" onClick={profileRecorder.clear} variant="outline" className="rounded-full bg-card font-bold h-8 text-xs"><TrashIcon className="w-4 h-4 mr-1"/> Recommencer</Button>
 )}
 </div>
 </div>

 <label className="flex items-start gap-3 p-4 bg-surface-secondary rounded-2xl border border-border cursor-pointer">
 <input
 type="checkbox"
 checked={profileForm.consent_given}
 onChange={(e) => setProfileForm({...profileForm, consent_given: e.target.checked})}
 className="mt-1 w-5 h-5 accent-secondary-500"
 />
 <span className="text-sm font-bold text-foreground-secondary">Je donne mon consentement explicite pour cloner ma voix et je confirme être un adulte. J'accepte les conditions de confidentialité.</span>
 </label>

 <div className="flex justify-end gap-3 pt-4">
 <Button type="button" onClick={resetProfileForm} variant="ghost" className="font-bold">Annuler</Button>
 <Button type="submit" form="voice-form" disabled={!profileForm.consent_given || (!editingProfile && !profileRecorder.audioBlob) || profileRecorder.recording} variant="primary" className="rounded-full px-8 font-black shadow-lg">
 Générer la voix IA
 </Button>
 </div>
 </form>
 </div>
 )}

 {/* STEP 3: AI ANALYSIS LOADING */}
 {wizardStep === 3 && (
 <div className="text-center py-12">
 <div className="relative w-32 h-32 mx-auto mb-8">
 <motion.div animate={{rotate: 360}} transition={{duration: 4, repeat: Infinity, ease: 'linear'}} className="absolute inset-0 rounded-full border-4 border-border border-t-primary-500 border-r-secondary-500"></motion.div>
 <MicrophoneIcon className="w-12 h-12 text-surface-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
 </div>
 
 <h2 className="text-2xl font-black text-foreground mb-4">Création de la magie...</h2>
 
 <div className="max-w-xs mx-auto space-y-4 text-left">
 <div className={`flex items-center gap-3 font-bold ${aiProgress >= 10 ? 'text-foreground-600' : 'text-surface-400'}`}>
 {aiProgress >= 25 ? <CheckIcon className="w-5 h-5 text-secondary-500"/> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>} Transfert sécurisé
 </div>
 <div className={`flex items-center gap-3 font-bold ${aiProgress >= 30 ? 'text-foreground-600' : 'text-surface-400'}`}>
 {aiProgress >= 50 ? <CheckIcon className="w-5 h-5 text-secondary-500"/> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>} Nettoyage de l'audio
 </div>
 <div className={`flex items-center gap-3 font-bold ${aiProgress >= 60 ? 'text-foreground-600' : 'text-surface-400'}`}>
 {aiProgress >= 80 ? <CheckIcon className="w-5 h-5 text-secondary-500"/> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>} Entraînement du modèle IA
 </div>
 <div className={`flex items-center gap-3 font-bold ${aiProgress >= 90 ? 'text-foreground-600' : 'text-surface-400'}`}>
 {aiProgress >= 100 ? <CheckIcon className="w-5 h-5 text-secondary-500"/> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>} Finalisation
 </div>
 </div>
 </div>
 )}

 {/* STEP 5: SUCCESS */}
 {wizardStep === 5 && (
 <div className="text-center py-8">
 <motion.div initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', bounce: 0.5}} className="w-24 h-24 bg-secondary-100 text-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
 <CheckIcon className="w-12 h-12" />
 </motion.div>
 <h2 className="text-3xl font-black text-foreground mb-4">Succès !</h2>
 <p className="text-lg text-foreground-secondary font-medium mb-8 max-w-md mx-auto">
 Votre voix a été clonée avec succès. Elle est prête à raconter des histoires merveilleuses !
 </p>
 
 <div className="flex flex-col sm:flex-row justify-center gap-4">
 <Button onClick={resetProfileForm} variant="outline" className="rounded-full font-bold">Retour au studio</Button>
 <Button onClick={() => {resetProfileForm(); navigate('/kids');}} variant="primary" className="rounded-full shadow-lg bg-secondary-500 hover:bg-secondary-600 border-none font-black text-white">
 Utiliser cette voix
 </Button>
 </div>
 </div>
 )}

 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 );
}

export default FamilyVoices;
