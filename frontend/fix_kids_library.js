const fs = require('fs');
let content = fs.readFileSync('c:/Users/omare/Desktop/HKids/frontend/src/pages/KidsLibrary.jsx', 'utf8');

const voiceRegex = /\{\[\s*\{ id: 'woman',[\s\S]*?\]\.map\(voice => \([\s\S]*?<\/motion\.div>\s*\)\)\}/;
const newVoiceBlock = {[
            { id: 'woman', src: '/illustrations/avatar_mom.jpg' },
            { id: 'man', src: '/illustrations/avatar_dad.jpg' },
            { id: 'princess', src: '/illustrations/avatar_princess.jpg' },
            { id: 'lion', src: '/illustrations/avatar_lion.jpg' },
            { id: 'robot', src: '/illustrations/avatar_robot.jpg' },
            { id: 'teddy', src: '/illustrations/avatar_teddy.jpg' },
            { id: 'fairy', src: '/illustrations/avatar_fairy.jpg' }
          ].map(voice => (
            <motion.div
              key={voice.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: [0, -3, 3, -3, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playKidsUiSound('tap');
                handleVoiceSelect(voice.id);
              }}
              className="cursor-pointer rounded-[3rem] overflow-hidden aspect-square shadow-2xl border-4 border-white/80 transition-shadow hover:shadow-kids-warm"
            >
              <img src={voice.src} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))};
content = content.replace(voiceRegex, newVoiceBlock);

const langRegex = /\{\[\s*\{ id: 'fr',[\s\S]*?\]\.map\(lang => \([\s\S]*?<\/motion\.div>\s*\)\)\}/;
const newLangBlock = {[
            { id: 'fr', src: '/illustrations/flag_french.jpg', fallback: '🇫🇷' },
            { id: 'en', src: '/illustrations/flag_english.jpg', fallback: '🇬🇧' },
            { id: 'ar', src: '', fallback: '🇲🇦' }
          ].map(lang => (
            <motion.div
              key={lang.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: [0, -3, 3, -3, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playKidsUiSound('tap');
                handleLanguageSelect(lang.id);
              }}
              className="cursor-pointer rounded-[3rem] overflow-hidden bg-gradient-to-br from-white to-sky-50 aspect-square flex flex-col items-center justify-center shadow-2xl border-4 border-white/80 transition-shadow hover:shadow-kids-warm"
            >
              {lang.src ? (
                <img src={lang.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl md:text-[12rem] drop-shadow-md">{lang.fallback}</span>
              )}
            </motion.div>
          ))};
content = content.replace(langRegex, newLangBlock);

const storiesMapRegex = /discoveryPool\.slice\(0, 16\)\.map\(book => \(/;
content = content.replace(storiesMapRegex, 
// Assets to randomly cycle through for story placeholders
const placeholders = [
  '/illustrations/hkids_stories_1785859306807.jpg',
  '/illustrations/hkids_explore_1785859328927.jpg',
  '/illustrations/hkids_games_1785859317533.jpg',
  '/illustrations/hkids_surprise_1785859339044.jpg',
  '/illustrations/hkids_avatar_1785859297185.jpg',
  '/illustrations/avatar_lion.jpg',
  '/illustrations/avatar_princess.jpg'
];
return discoveryPool.slice(0, 16).map((book, index) => {
  const placeholderImg = placeholders[index % placeholders.length];
  return ();

content = content.replace(/<img[^>]*src=\{book\.cover_url\}[^>]*\/>/g, <img src={book.cover_url || placeholderImg} alt="" className="w-full h-full object-cover" />);

fs.writeFileSync('c:/Users/omare/Desktop/HKids/frontend/src/pages/KidsLibrary.jsx', content);
console.log('Fixed KidsLibrary.jsx');
