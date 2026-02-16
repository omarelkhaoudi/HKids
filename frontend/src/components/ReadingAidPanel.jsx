import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';

function ReadingAidPanel({ isOpen, onClose, settings, onSettingsChange }) {
  const [activeTab, setActiveTab] = useState('font');

  const fontOptions = [
    { name: 'Par défaut', value: 'system', class: 'font-sans' },
    { name: 'Arial', value: 'arial', class: 'font-sans' },
    { name: 'Times New Roman', value: 'times', class: 'font-serif' },
    { name: 'Comic Sans MS', value: 'comic', class: 'font-sans' },
    { name: 'Open Dyslexic', value: 'dyslexic', class: 'font-sans' }
  ];

  const fontSizeOptions = [
    { label: 'Très petit', value: 12 },
    { label: 'Petit', value: 14 },
    { label: 'Normal', value: 16 },
    { label: 'Grand', value: 20 },
    { label: 'Très grand', value: 24 },
    { label: 'Énorme', value: 32 }
  ];

  const colorOptions = [
    { name: 'Noir sur blanc', bg: '#FFFFFF', text: '#000000' },
    { name: 'Blanc sur noir', bg: '#000000', text: '#FFFFFF' },
    { name: 'Beige sur marron', bg: '#8B4513', text: '#F5DEB3' },
    { name: 'Jaune sur bleu', bg: '#0000FF', text: '#FFFF00' },
    { name: 'Vert sur noir', bg: '#000000', text: '#00FF00' },
    { name: 'Rose sur blanc', bg: '#FFFFFF', text: '#FF69B4' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Aide à la lecture</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            {[
              { id: 'font', label: 'Police', icon: '🔤' },
              { id: 'size', label: 'Taille', icon: '📏' },
              { id: 'color', label: 'Couleurs', icon: '🎨' },
              { id: 'other', label: 'Autres', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <span className="text-xl mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Font Tab */}
            {activeTab === 'font' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Choisissez une police
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {fontOptions.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => onSettingsChange({ ...settings, font: font.value })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        settings.font === font.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-200 hover:border-red-200'
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
                          <span className="text-red-600 text-xl">✓</span>
                        )}
                      </div>
                      <p className={`text-sm mt-2 text-neutral-600 ${font.class}`} style={{
                        fontFamily: font.value === 'dyslexic' ? 'OpenDyslexic, sans-serif' : 
                                    font.value === 'times' ? 'Times New Roman, serif' :
                                    font.value === 'comic' ? 'Comic Sans MS, cursive' : 'Arial, sans-serif'
                      }}>
                        Exemple de texte avec cette police
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Tab */}
            {activeTab === 'size' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Taille du texte
                </h3>
                <div className="space-y-3">
                  {fontSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSettingsChange({ ...settings, fontSize: option.value })}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        settings.fontSize === option.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-200 hover:border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{option.label}</span>
                        <span
                          className="text-neutral-900"
                          style={{ fontSize: `${option.value}px` }}
                        >
                          Aa
                        </span>
                        {settings.fontSize === option.value && (
                          <span className="text-red-600 text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Tab */}
            {activeTab === 'color' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Couleurs d'affichage
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => onSettingsChange({
                        ...settings,
                        backgroundColor: color.bg,
                        textColor: color.text
                      })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.backgroundColor === color.bg
                          ? 'border-red-500 ring-2 ring-red-200'
                          : 'border-neutral-200 hover:border-red-200'
                      }`}
                      style={{
                        backgroundColor: color.bg,
                        color: color.text
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{color.name}</span>
                        {settings.backgroundColor === color.bg && (
                          <span className="text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other Tab */}
            {activeTab === 'other' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Options supplémentaires
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 hover:border-red-200 transition-colors cursor-pointer">
                      <div>
                        <span className="font-semibold block">Syllabisation</span>
                        <span className="text-sm text-neutral-600">
                          Afficher les mots en syllabes
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.syllabification}
                        onChange={(e) => onSettingsChange({
                          ...settings,
                          syllabification: e.target.checked
                        })}
                        className="w-6 h-6 text-red-600 rounded focus:ring-red-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 hover:border-red-200 transition-colors cursor-pointer">
                      <div>
                        <span className="font-semibold block">Espacement des lignes</span>
                        <span className="text-sm text-neutral-600">
                          Augmenter l'espace entre les lignes
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.lineSpacing}
                        onChange={(e) => onSettingsChange({
                          ...settings,
                          lineSpacing: e.target.checked
                        })}
                        className="w-6 h-6 text-red-600 rounded focus:ring-red-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 hover:border-red-200 transition-colors cursor-pointer">
                      <div>
                        <span className="font-semibold block">Surbrillance du mot</span>
                        <span className="text-sm text-neutral-600">
                          Mettre en évidence le mot lu
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.wordHighlight}
                        onChange={(e) => onSettingsChange({
                          ...settings,
                          wordHighlight: e.target.checked
                        })}
                        className="w-6 h-6 text-red-600 rounded focus:ring-red-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <button
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
                    className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold text-neutral-700 transition-colors"
                  >
                    Réinitialiser les paramètres
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

