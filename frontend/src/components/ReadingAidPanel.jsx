import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { XIcon } from './Icons';

function ReadingAidPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  voiceProfiles = [],
  selectedVoiceProfile = 'woman',
  onVoiceProfileChange = () => {},
  availableVoices = [],
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('voice');

  const fontOptions = useMemo(() => [
    { name: t('readingAidFontDefault'), value: 'system', class: 'font-sans' },
    { name: 'Arial', value: 'arial', class: 'font-sans' },
    { name: 'Times New Roman', value: 'times', class: 'font-serif' },
    { name: 'Comic Sans MS', value: 'comic', class: 'font-sans' },
    { name: 'Open Dyslexic', value: 'dyslexic', class: 'font-sans' }
  ], [t]);

  const fontSizeOptions = useMemo(() => [
    { label: t('readingAidSizeTiny'), value: 12 },
    { label: t('readingAidSizeSmall'), value: 14 },
    { label: t('readingAidSizeNormal'), value: 16 },
    { label: t('readingAidSizeLarge'), value: 20 },
    { label: t('readingAidSizeXLarge'), value: 24 },
    { label: t('readingAidSizeHuge'), value: 32 }
  ], [t]);

  const colorOptions = useMemo(() => [
    { name: t('readingAidColorBlackWhite'), bg: '#FFFFFF', text: '#000000' },
    { name: t('readingAidColorWhiteBlack'), bg: '#000000', text: '#FFFFFF' },
    { name: t('readingAidColorBeigeBrown'), bg: '#8B4513', text: '#F5DEB3' },
    { name: t('readingAidColorYellowBlue'), bg: '#0000FF', text: '#FFFF00' },
    { name: t('readingAidColorGreenBlack'), bg: '#000000', text: '#00FF00' },
    { name: t('readingAidColorPinkWhite'), bg: '#FFFFFF', text: '#FF69B4' }
  ], [t]);

  const tabs = useMemo(() => [
    { id: 'voice', label: t('readingAidTabVoice'), icon: 'AI' },
    { id: 'font', label: t('readingAidTabFont'), icon: '🔤' },
    { id: 'size', label: t('readingAidTabSize'), icon: '📏' },
    { id: 'color', label: t('readingAidTabColor'), icon: '🎨' },
    { id: 'other', label: t('readingAidTabOther'), icon: '⚙️' }
  ], [t]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-aid-title"
        >
          <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 text-white p-6 flex justify-between items-center">
            <h2 id="reading-aid-title" className="text-2xl font-bold">{t('readingAidTitle')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label={t('readingAidClose')}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex border-b border-surface-200" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-foreground-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                }`}
              >
                <span className="text-xl mr-2" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'voice' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2">
                    {t('readingAidVoiceTitle')}
                  </h3>
                  <p className="mb-4 text-sm text-surface-600">
                    {t('readingAidVoiceDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {voiceProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => onVoiceProfileChange(profile.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        selectedVoiceProfile === profile.id
                          ? 'border-secondary-500 bg-secondary-50 shadow-md'
                          : 'border-surface-200 hover:border-secondary-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-100 to-secondary-100 text-sm font-black text-foreground-secondary-600">
                          {profile.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-extrabold text-surface-900">
                            {profile.label}
                            {selectedVoiceProfile === profile.id && (
                              <span className="rounded-full bg-secondary-500 px-2 py-0.5 text-xs font-bold text-white">
                                {t('readingAidVoiceActive')}
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-sm text-surface-600">{profile.description}</span>
                          <span className="mt-2 block text-xs font-semibold text-foreground-secondary-600">{t('readingAidVoiceClickPreview')}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-surface-500">
                  {availableVoices.length > 0
                    ? t('readingAidVoiceCount', { count: availableVoices.length })
                    : t('readingAidVoiceDeviceFallback')}
                </p>
              </div>
            )}

            {activeTab === 'font' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-surface-900 mb-4">
                  {t('readingAidFontTitle')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {fontOptions.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, font: font.value })}
                      className={`p-4 rounded-3xl border-2 transition-all text-left ${
                        settings.font === font.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${font.class}`} style={{
                          fontFamily: font.value === 'dyslexic' ? 'OpenDyslexic, sans-serif' : 
                                      font.value === 'times' ? 'Times New Roman, serif' :
                                      font.value === 'comic' ? 'Comic Sans MS, cursive' : 'Arial, sans-serif'
                        }}>
                          {font.name}
                        </span>
                        {settings.font === font.value && (
                          <span className="text-foreground-600 text-xl" aria-hidden="true">✓</span>
                        )}
                      </div>
                      <p className={`text-sm mt-2 text-surface-600 ${font.class}`} style={{
                        fontFamily: font.value === 'dyslexic' ? 'OpenDyslexic, sans-serif' : 
                                    font.value === 'times' ? 'Times New Roman, serif' :
                                    font.value === 'comic' ? 'Comic Sans MS, cursive' : 'Arial, sans-serif'
                      }}>
                        {t('readingAidFontSample')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'size' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-surface-900 mb-4">
                  {t('readingAidSizeTitle')}
                </h3>
                <div className="space-y-3">
                  {fontSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, fontSize: option.value })}
                      className={`w-full p-4 rounded-3xl border-2 transition-all text-left ${
                        settings.fontSize === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{option.label}</span>
                        <span
                          className="text-surface-900"
                          style={{ fontSize: `${option.value}px` }}
                          aria-hidden="true"
                        >
                          Aa
                        </span>
                        {settings.fontSize === option.value && (
                          <span className="text-foreground-600 text-xl" aria-hidden="true">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'color' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-surface-900 mb-4">
                  {t('readingAidColorTitle')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => onSettingsChange({
                        ...settings,
                        backgroundColor: color.bg,
                        textColor: color.text
                      })}
                      className={`p-4 rounded-3xl border-2 transition-all ${
                        settings.backgroundColor === color.bg
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-surface-200 hover:border-primary-200'
                      }`}
                      style={{
                        backgroundColor: color.bg,
                        color: color.text
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{color.name}</span>
                        {settings.backgroundColor === color.bg && (
                          <span className="text-xl" aria-hidden="true">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'other' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 mb-4">
                    {t('readingAidOtherTitle')}
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-3xl border-2 border-surface-200 hover:border-primary-200 transition-colors cursor-pointer">
                      <div>
                        <span className="font-semibold block">{t('readingAidSyllabification')}</span>
                        <span className="text-sm text-surface-600">
                          {t('readingAidSyllabificationDesc')}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.syllabification}
                        onChange={(e) => onSettingsChange({
                          ...settings,
                          syllabification: e.target.checked
                        })}
                        className="w-6 h-6 text-foreground-600 rounded focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-3xl border-2 border-surface-200 hover:border-primary-200 transition-colors cursor-pointer">
                      <div>
                        <span className="font-semibold block">{t('readingAidLineSpacing')}</span>
                        <span className="text-sm text-surface-600">
                          {t('readingAidLineSpacingDesc')}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.lineSpacing}
                        onChange={(e) => onSettingsChange({
                          ...settings,
                          lineSpacing: e.target.checked
                        })}
                        className="w-6 h-6 text-foreground-600 rounded focus:ring-primary-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-3xl border-2 border-surface-200 hover:border-primary-200 transition-colors cursor-pointer">
                      <div>
                        <span className="font-semibold block">{t('readingAidWordHighlight')}</span>
                        <span className="text-sm text-surface-600">
                          {t('readingAidWordHighlightDesc')}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.wordHighlight}
                        onChange={(e) => onSettingsChange({
                          ...settings,
                          wordHighlight: e.target.checked
                        })}
                        className="w-6 h-6 text-foreground-600 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-200">
                  <button
                    type="button"
                    onClick={() => {
                      onSettingsChange({
                        font: 'system',
                        fontSize: 16,
                        backgroundColor: '#FFFFFF',
                        textColor: '#000000',
                        syllabification: false,
                        lineSpacing: false,
                        wordHighlight: false
                      });
                    }}
                    className="w-full px-6 py-3 bg-surface-100 hover:bg-surface-200 rounded-3xl font-semibold text-surface-700 transition-colors"
                  >
                    {t('readingAidReset')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReadingAidPanel;
