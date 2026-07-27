import { PREMIUM_ACCESS } from '../services/premium/premiumContract.js';

const AREA_BY_THEME = {
  alphabet: 'languages',
  languages: 'languages',
  numbers: 'educational-activities',
  shapes: 'educational-activities',
  colors: 'creativity',
  creativity: 'creativity',
  rhymes: 'rhymes',
  spiritual: 'religion',
  spirituality: 'religion',
  science: 'science',
  space: 'science',
  geography: 'geography',
  world: 'geography',
  characters: 'characters',
};

const SEARCH_ALIASES = {
  audiobooks: ['audio', 'audiobook', 'livre audio', 'histoire audio', 'écouter', 'listen', 'كتاب صوتي', 'استماع'],
  languages: ['langue', 'français', 'anglais', 'arabe', 'language', 'english', 'french', 'arabic', 'لغة', 'لغات'],
  'educational-activities': ['activité', 'éducatif', 'quiz', 'jeu', 'apprendre', 'learning', 'game', 'تعلم', 'نشاط'],
  religion: ['religion', 'foi', 'valeurs', 'spiritualité', 'faith', 'values', 'دين', 'إيمان', 'قيم'],
  rhymes: ['comptine', 'chanson', 'rime', 'musique', 'rhyme', 'song', 'أنشودة', 'أغنية'],
  science: ['science', 'expérience', 'nature', 'espace', 'experiment', 'علوم', 'تجربة'],
  geography: ['géographie', 'carte', 'monde', 'pays', 'geography', 'map', 'world', 'جغرافيا', 'خريطة'],
  creativity: ['créativité', 'art', 'dessin', 'peinture', 'musique', 'creativity', 'إبداع', 'رسم'],
  characters: ['personnage', 'héros', 'premium', 'character', 'hero', 'شخصية', 'بطل'],
};

function inferPremiumFlags(item) {
  const slug = String(item.slug || '');
  let isPremium = item.is_premium === true || item.is_premium === 1;
  if (!isPremium && slug.startsWith('prem-')) isPremium = true;

  let premiumAccess = PREMIUM_ACCESS.FREE;
  if (isPremium) {
    if (item.premium_pack_id || item.metadata?.premium_pack_id) {
      premiumAccess = PREMIUM_ACCESS.PACK;
    } else if (item.premium_access === PREMIUM_ACCESS.UNLOCK) {
      premiumAccess = PREMIUM_ACCESS.UNLOCK;
    } else {
      premiumAccess = PREMIUM_ACCESS.SUBSCRIPTION;
    }
  }

  return { is_premium: isPremium, premium_access: premiumAccess };
}

// Editorial corrections for legacy machine-generated Arabic metadata.
// Keeping them here makes the catalog source deterministic without rewriting
// the large historical expansion file.
const ARABIC_METADATA_CORRECTIONS = {
  'prem-medecin-doudou': ['طبيبة الدمى', 'نينا تعالج الحيوانات المحشوة بضمادات من اللباد.'],
  'prem-a-abeille': ['أ مثل نحلة', 'اكتشف الحرف أ مع النحلة باز.'],
  'plus-triceratops-bouclier': ['التريسيراتوبس ودرع الأخوة', 'يحمي تريسيراتوبس أخاه الصغير أثناء عاصفة رماد.'],
  'plus-brachiosaure-nuages': ['البراكيوصور يلمس السحب', 'براكيوصور فضولي يظن أنه يستطيع قضم سحب الصباح.'],
  'plus-pteranodon-ciel': ['البتيرانودون وخريطة السماء', 'يرسم بتيرانودون مسارات الريح للفراخ.'],
  'plus-stegosaure-etoiles': ['الستيغوصور يعد النجوم', 'يستخدم الستيغوصور صفائحه ليعكس ضوء النجوم.'],
  'plus-ankylosaure-armure': ['الأنكيلوصور والقلب تحت الدرع', 'يتعلم أنكيلوصور قوي أن لطفه يعادل قوة درعه.'],
  'plus-parasaurolophus-chant': ['الباراصور يغني للوادي', 'يؤلف الباراصور ألحاناً بعرفه المجوف.'],
  'plus-pyjama-etoiles': ['بيجاما بنجوم مطرزة', 'بيجاما سحرية تعرض نجوماً على السقف.'],
  'plus-velo-parc': ['دراجة حمراء في الحديقة', 'طفل يتعلم ركوب الدراجة دون عجلات مساعدة.'],
  'plus-maroc-souks': ['أسواق المغرب والألوان', 'تكتشف ياسمين عطور الأسواق المغربية وأقمشتها.'],
  'plus-japon-cerisiers': ['أزهار الكرز في اليابان', 'يتنزه كينجي تحت أزهار الكرز مع عائلته.'],
  'plus-kenya-safari': ['رحلة سفاري في كينيا مع أمينة', 'تراقب أمينة الزرافات وتتعلم احترام السافانا.'],
  'plus-canada-erables': ['القيقب الأحمر في كندا', 'يجمع ليو أوراق القيقب لإعداد مجموعة نباتية خريفية.'],
  'plus-perou-montagnes': ['جبال بيرو واللاما', 'يصعد ماتيو درباً في جبال الأنديز مع حيوان لاما هادئ.'],
  'plus-inde-festival': ['مهرجان الأنوار في الهند', 'تضيء بريا المصابيح مع عائلتها للاحتفال بديوالي.'],
  'plus-egypte-pyramides': ['أهرامات مصر وأبو الهول', 'تزور نور الأهرامات وتسمع حكايات أبي الهول.'],
  'plus-bresil-carnaval': ['الكرنفال في البرازيل والريش', 'يعد لوكاس زياً من الريش للمشاركة في العرض.'],
  'plus-rouge-grenade': ['أحمر كالرمان', 'تكتشف لينا اللون الأحمر في ثمار الحديقة وزهورها.'],
  'plus-bleu-ocean-ciel': ['أزرق المحيط، أزرق السماء', 'يمزج نوح درجات الأزرق ليرسم البحر والسماء.'],
  'plus-jaune-soleil-mais': ['أصفر الشمس والذرة', 'يجمع سام الأشياء الصفراء في مزرعة خالته.'],
  'plus-boulanger-matin': ['خباز الصباح بيدين مغطاتين بالدقيق', 'يعجن السيد بول الخبز قبل الفجر.'],
  'plus-infirmiere-soin': ['الممرضة كلارا والضمادة اللطيفة', 'تتعلم كلارا العلاج بكلمات لطيفة.'],
  'plus-pompier-courage': ['رجل الإطفاء ليو والسلم العالي', 'يتعلم ليو الشجاعة الهادئة أثناء تمرين.'],
  'plus-jardinier-graines': ['بستاني البذور الصبورة', 'يزرع عمر البذور وينتظر هطول المطر.'],
  'plus-musicien-notes': ['موسيقي النغمات الرحالة', 'يؤلف إلياس لحناً يعبر القارات.'],
  'plus-bibliothecaire-livres': ['أمينة المكتبة والكتاب المفقود', 'تعثر السيدة لين على كتاب ضائع وتعيده إلى قارئه المناسب.'],
  'plus-b-baleine': ['ب مثل بالون', 'يجمع بوريس كلمات تبدأ بحرف الباء.'],
  'plus-c-chateau-chat': ['ق مثل قلعة وقطة', 'تبني كاميل قلعة من الحروف والكرتون.'],
  'plus-comptine-feux': ['أنشودة نار المخيم', 'حول نار المخيم، تدفئ أنشودة أصوات الجميع.'],
  'plus-gratitude-matin': ['امتنان الصباح الهادئ', 'تشكر سارة على ثلاث أشياء صغيرة قبل المدرسة.'],
  'plus-patience-graine': ['الصبر وبذرة السعادة', 'يتعلم يوسف انتظار البذرة حتى تصبح زهرة.'],
  'plus-humilite-montagne': ['التواضع أمام الجبل', 'يشرح مرشد أن الجبل يعلمنا التواضع.'],
  'plus-esperance-lanterne': ['الأمل وفانوس رمضان', 'تضيء فاطمة فانوساً يحمل أمل الشهر المبارك.'],
  'plus-amis-arbre': ['أصدقاء تحت الشجرة الكبيرة', 'يتشارك حيوانان مختلفان شجرة وحكايات.'],
  'plus-gentillesse-coeur': ['لطف القلب المفتوح', 'تشارك ميلا وجبتها مع زميل نسي طعامه.'],
  'plus-grands-parents-histoire': ['الأجداد وصندوق الحكايات', 'تخرج الجدة صوراً وتحكي ماضي العائلة.'],
  'plus-rentree-crayons': ['العودة إلى المدرسة وأقلام جديدة', 'تفوح من أول يوم دراسي رائحة الخشب والحماس.'],
  'plus-labo-couleurs': ['مختبر الألوان والبركان', 'يمزج الأطفال بيكربونات الصوديوم والخل لصنع بركان آمن.'],
  'plus-tigre-sentier': ['النمر ودرب الأدغال', 'يشير مرشد إلى نمر من بعيد داخل محمية طبيعية.'],
  'plus-ecole-jardin': ['حديقة المدرسة وأيدٍ خضراء', 'يزرع التلاميذ حديقة لتزويد مطعم المدرسة بالطعام.'],
};

const ARABIC_AUDIO_CORRECTIONS = {
  'plus-parasaurolophus-chant': 'يغني بارا فيجيبه الوادي. تعبر كل نغمة نبات السرخس كنسيم ودود.',
  'plus-souffle-dormir': 'تنفس بلطف، احبس أنفاسك قليلاً، ثم ازفر ببطء. يأتي النوم كموجة هادئة.',
  'plus-comptine-feux': 'يا نار المخيم، يا لهباً صديقاً، ارقصي قبل النوم. تتشابك أصواتنا كجمر يضحك.',
  'plus-esperance-lanterne': 'يا فانوس الأمل، أضيئي بلطف. يجلب رمضان المشاركة والصلاة ويملأ القلوب رحمة.',
};

function cleanTerms(values) {
  return [...new Set(values
    .flat()
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean))];
}

export function inferCatalogArea(item) {
  if (item.catalog_area) return item.catalog_area;
  if (item.content_type === 'audio_story') return 'audiobooks';
  return AREA_BY_THEME[item.theme] || 'stories';
}

export function finalizeCatalogMetadata(items) {
  return items.map((item, index) => {
    const correctedArabic = ARABIC_METADATA_CORRECTIONS[item.slug];
    let localizations = correctedArabic
      ? {
        ...item.localizations,
        ar: {
          ...item.localizations?.ar,
          title: correctedArabic[0],
          description: correctedArabic[1],
        },
      }
      : item.localizations;
    if (ARABIC_AUDIO_CORRECTIONS[item.slug] && localizations?.ar) {
      localizations = {
        ...localizations,
        ar: {
          ...localizations.ar,
          audio_text: ARABIC_AUDIO_CORRECTIONS[item.slug],
        },
      };
    }
    const catalogArea = inferCatalogArea(item);
    const premiumFlags = inferPremiumFlags({ ...item, catalog_area: catalogArea });
    const subjects = cleanTerms(item.subjects || [item.theme]);
    const skills = cleanTerms(item.skills || []);
    const localizedTerms = Object.values(localizations || {}).flatMap((localization) => [
      localization.title,
      localization.description,
    ]);
    const searchTerms = cleanTerms([
      item.title,
      item.description,
      item.author,
      item.category_name,
      item.theme,
      item.tags || [],
      subjects,
      skills,
      SEARCH_ALIASES[catalogArea] || [],
      localizedTerms,
    ]);
    const tags = cleanTerms([
      item.tags || [],
      `area:${catalogArea}`,
      ...subjects.map((subject) => `subject:${subject}`),
      ...skills.map((skill) => `skill:${skill}`),
      item.character ? `character:${item.character}` : null,
      item.series ? `series:${item.series}` : null,
    ]);

    return {
      ...item,
      is_premium: premiumFlags.is_premium,
      localizations,
      tags,
      catalog_area: catalogArea,
      subjects,
      skills,
      search_terms: searchTerms,
      editorial_rank: Number(item.editorial_rank || (item.is_recommended ? 70 : item.is_popular ? 60 : 40)),
      metadata: {
        schema_version: 2,
        catalog_area: catalogArea,
        premium_access: premiumFlags.premium_access,
        premium_pack_id: item.premium_pack_id || item.metadata?.premium_pack_id || null,
        seasonal: Boolean(item.seasonal || item.is_seasonal),
        subjects,
        skills,
        search_terms: searchTerms,
        character: item.character || null,
        series: item.series || null,
        editorial_rank: Number(item.editorial_rank || (item.is_recommended ? 70 : item.is_popular ? 60 : 40)),
        accessibility: {
          narrated: Boolean(item.audio_text || item.content_type === 'audio_story' || item.content_type === 'song'),
          text_available: Array.isArray(item.pages) && item.pages.length > 0,
        },
        localization_status: {
          fr: Boolean(item.title && item.description),
          en: Boolean(item.localizations?.en?.title && item.localizations?.en?.description),
          ar: Boolean(item.localizations?.ar?.title && item.localizations?.ar?.description),
        },
        cover: {
          strategy: 'generated',
          aspect_ratio: '4:5',
          seed: `${item.slug}:${index}`,
        },
      },
    };
  });
}
