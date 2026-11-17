import { Category, Item, AppSettings } from '../types';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

const PREVIEW_ART = {
  apple: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M100 54 C98 36 112 24 124 24" stroke="#6B4423" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M104 44 C122 30 142 36 138 54 C126 58 112 54 104 44 Z" fill="#06D6A0"/>
      <path d="M100 62 C72 54 44 74 44 108 C44 146 70 170 92 168 C97 167 103 167 108 168 C130 170 156 146 156 108 C156 74 128 54 100 62 Z" fill="#FF6B5B"/>
      <ellipse cx="74" cy="92" rx="10" ry="18" transform="rotate(-18 74 92)" fill="#FFA197" opacity="0.65"/>
      <circle cx="82" cy="112" r="5" fill="#2B2523"/>
      <circle cx="118" cy="112" r="5" fill="#2B2523"/>
      <path d="M90 124 Q100 134 110 124" stroke="#2B2523" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  banana: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M52 138 C76 156 126 144 148 92 C156 72 154 50 144 38 L134 44 C138 62 128 96 104 114 C84 128 62 128 46 124 Z" fill="#FFD166" stroke="#E5B03B" stroke-width="4" stroke-linejoin="round"/>
      <path d="M142 38 L150 32" stroke="#7A5230" stroke-width="7" stroke-linecap="round"/>
      <circle cx="106" cy="100" r="4.5" fill="#2B2523"/>
      <circle cx="122" cy="88" r="4.5" fill="#2B2523"/>
      <path d="M112 104 Q120 110 126 101" stroke="#2B2523" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  orange: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <circle cx="100" cy="108" r="56" fill="#FF9F43"/>
      <path d="M100 52 C100 40 106 32 114 30" stroke="#6B4423" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M102 44 C120 30 138 38 134 52 C122 56 110 52 102 44 Z" fill="#06D6A0"/>
      <circle cx="72" cy="86" r="5" fill="#FFC078" opacity="0.8"/>
      <circle cx="84" cy="106" r="5" fill="#2B2523"/>
      <circle cx="116" cy="106" r="5" fill="#2B2523"/>
      <path d="M90 120 Q100 130 110 120" stroke="#2B2523" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  strawberry: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M100 58 C66 58 48 84 56 116 C64 148 84 168 100 170 C116 168 136 148 144 116 C152 84 134 58 100 58 Z" fill="#FF5D73"/>
      <path d="M68 62 Q100 42 132 62 L116 74 L100 64 L84 74 Z" fill="#06D6A0"/>
      <circle cx="76" cy="96" r="3" fill="#FFD166"/>
      <circle cx="124" cy="96" r="3" fill="#FFD166"/>
      <circle cx="80" cy="136" r="3" fill="#FFD166"/>
      <circle cx="120" cy="136" r="3" fill="#FFD166"/>
      <circle cx="86" cy="108" r="5" fill="#2B2523"/>
      <circle cx="114" cy="108" r="5" fill="#2B2523"/>
      <path d="M92 122 Q100 130 108 122" stroke="#2B2523" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  grapes: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M100 44 L100 28" stroke="#6B4423" stroke-width="6" stroke-linecap="round"/>
      <path d="M102 38 C122 26 138 36 132 48 C120 52 110 46 102 38 Z" fill="#06D6A0"/>
      <circle cx="76" cy="76" r="20" fill="#845EC2"/>
      <circle cx="100" cy="74" r="20" fill="#9B72CF"/>
      <circle cx="124" cy="76" r="20" fill="#845EC2"/>
      <circle cx="86" cy="106" r="20" fill="#9B72CF"/>
      <circle cx="114" cy="106" r="20" fill="#845EC2"/>
      <circle cx="100" cy="136" r="20" fill="#9B72CF"/>
      <circle cx="92" cy="104" r="4" fill="#FFFDFB"/>
      <circle cx="108" cy="104" r="4" fill="#FFFDFB"/>
      <path d="M94 114 Q100 120 106 114" stroke="#FFFDFB" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  car: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M48 112 L62 76 C66 68 74 64 84 64 L118 64 C128 64 136 68 140 76 L154 112 Z" fill="#FF7A59"/>
      <rect x="36" y="106" width="128" height="36" rx="14" fill="#FF7A59"/>
      <path d="M68 78 L132 78 L142 106 L58 106 Z" fill="#BCE3FA"/>
      <circle cx="68" cy="144" r="18" fill="#2B2523"/>
      <circle cx="68" cy="144" r="8" fill="#FDF8F5"/>
      <circle cx="134" cy="144" r="18" fill="#2B2523"/>
      <circle cx="134" cy="144" r="8" fill="#FDF8F5"/>
      <circle cx="154" cy="120" r="6" fill="#FFD166"/>
    </svg>
  `),
  bus: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <rect x="34" y="64" width="132" height="76" rx="18" fill="#FFD166"/>
      <rect x="46" y="78" width="26" height="26" rx="6" fill="#4EA8DE"/>
      <rect x="80" y="78" width="26" height="26" rx="6" fill="#4EA8DE"/>
      <rect x="114" y="78" width="38" height="26" rx="6" fill="#BCE3FA"/>
      <circle cx="68" cy="144" r="16" fill="#2B2523"/>
      <circle cx="68" cy="144" r="7" fill="#FDF8F5"/>
      <circle cx="134" cy="144" r="16" fill="#2B2523"/>
      <circle cx="134" cy="144" r="7" fill="#FDF8F5"/>
    </svg>
  `),
  train: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <rect x="52" y="48" width="96" height="92" rx="22" fill="#4EA8DE"/>
      <rect x="66" y="66" width="68" height="34" rx="10" fill="#FFFDFB"/>
      <circle cx="76" cy="118" r="8" fill="#FFD166"/>
      <circle cx="124" cy="118" r="8" fill="#FFD166"/>
      <path d="M72 146 L56 168 M128 146 L144 168 M62 158 L138 158" stroke="#2B2523" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `),
  plane: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M36 106 L160 88 C170 86 174 96 164 104 L126 122 L52 122 Z" fill="#4EA8DE"/>
      <path d="M88 94 L112 46 L128 48 L114 92 Z" fill="#FF7A59"/>
      <path d="M84 120 L104 156 L118 154 L106 120 Z" fill="#FF7A59"/>
      <path d="M40 106 L30 78 L46 78 L58 104 Z" fill="#FFD166"/>
      <circle cx="128" cy="102" r="5" fill="#FFFDFB"/>
      <circle cx="110" cy="105" r="5" fill="#FFFDFB"/>
    </svg>
  `),
  ship: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M100 42 L100 120" stroke="#6B4423" stroke-width="6" stroke-linecap="round"/>
      <path d="M104 46 L148 110 L104 110 Z" fill="#FF7A59"/>
      <path d="M96 58 L58 110 L96 110 Z" fill="#FFD166"/>
      <path d="M42 120 L158 120 L140 152 L60 152 Z" fill="#4EA8DE"/>
      <path d="M32 158 Q56 148 80 158 T128 158 T168 158" stroke="#06D6A0" stroke-width="6" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  happy: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <circle cx="100" cy="100" r="62" fill="#FFD166"/>
      <circle cx="78" cy="88" r="7" fill="#2B2523"/>
      <circle cx="122" cy="88" r="7" fill="#2B2523"/>
      <circle cx="64" cy="106" r="8" fill="#FF7A59" opacity="0.45"/>
      <circle cx="136" cy="106" r="8" fill="#FF7A59" opacity="0.45"/>
      <path d="M74 114 Q100 142 126 114" stroke="#2B2523" stroke-width="6" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  surprised: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <circle cx="100" cy="100" r="62" fill="#BCE3FA"/>
      <circle cx="78" cy="84" r="8" fill="#2B2523"/>
      <circle cx="122" cy="84" r="8" fill="#2B2523"/>
      <ellipse cx="100" cy="124" rx="12" ry="15" fill="#FF7A59"/>
    </svg>
  `),
  star: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M100 32 L120 74 L166 80 L132 112 L140 158 L100 136 L60 158 L68 112 L34 80 L80 74 Z" fill="#FFD166" stroke="#E5B03B" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="88" cy="98" r="5" fill="#2B2523"/>
      <circle cx="112" cy="98" r="5" fill="#2B2523"/>
      <path d="M92 110 Q100 118 108 110" stroke="#2B2523" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  triangle: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <path d="M100 38 L162 152 L38 152 Z" fill="#06D6A0" stroke="#04A77D" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="88" cy="112" r="5" fill="#2B2523"/>
      <circle cx="112" cy="112" r="5" fill="#2B2523"/>
      <path d="M92 126 Q100 134 108 126" stroke="#2B2523" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  sun: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#FFFDFB"/>
      <g stroke="#FF9F43" stroke-width="8" stroke-linecap="round">
        <line x1="100" y1="26" x2="100" y2="42"/>
        <line x1="100" y1="158" x2="100" y2="174"/>
        <line x1="26" y1="100" x2="42" y2="100"/>
        <line x1="158" y1="100" x2="174" y2="100"/>
        <line x1="48" y1="48" x2="60" y2="60"/>
        <line x1="140" y1="140" x2="152" y2="152"/>
        <line x1="152" y1="48" x2="140" y2="60"/>
        <line x1="60" y1="140" x2="48" y2="152"/>
      </g>
      <circle cx="100" cy="100" r="44" fill="#FFD166"/>
      <circle cx="86" cy="94" r="5" fill="#2B2523"/>
      <circle cx="114" cy="94" r="5" fill="#2B2523"/>
      <path d="M90 108 Q100 118 110 108" stroke="#2B2523" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>
  `),
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-animals',
    title: 'باب الحيوانات',
    coverImage: '/src/assets/images/cat_animals_cover_1794919584592.jpg',
    isLocked: false,
    order: 0,
  },
  {
    id: 'cat-fruits',
    title: 'باب الفواكه',
    coverImage: '/src/assets/images/cat_fruits_cover_1794919584994.jpg',
    isLocked: true,
    order: 1,
  },
  {
    id: 'cat-vehicles',
    title: 'باب المواصلات',
    coverImage: '/src/assets/images/cat_vehicles_cover_1794919587944.jpg',
    isLocked: true,
    order: 2,
  },
  {
    id: 'cat-emotions',
    title: 'باب المشاعر والمنطق',
    coverImage: '/src/assets/images/cat_emotions_cover_1794919585578.jpg',
    isLocked: true,
    order: 3,
  },
];

export const DEFAULT_ITEMS: Item[] = [
  // باب الحيوانات
  {
    id: 'item-rabbit',
    categoryId: 'cat-animals',
    name: 'أرنب',
    imageUrl: '/src/assets/images/item_rabbit_1794919600097.jpg',
    audioBlobOrUrl: null,
  },
  {
    id: 'item-lion',
    categoryId: 'cat-animals',
    name: 'أسد',
    imageUrl: '/src/assets/images/item_lion_1794919586618.jpg',
    audioBlobOrUrl: null,
  },
  {
    id: 'item-elephant',
    categoryId: 'cat-animals',
    name: 'فيل',
    imageUrl: '/src/assets/images/item_elephant_1794919586900.jpg',
    audioBlobOrUrl: null,
  },
  {
    id: 'item-giraffe',
    categoryId: 'cat-animals',
    name: 'زرافة',
    imageUrl: '/src/assets/images/item_giraffe_1794919586680.jpg',
    audioBlobOrUrl: null,
  },
  {
    id: 'item-monkey',
    categoryId: 'cat-animals',
    name: 'قرد',
    imageUrl: '/src/assets/images/item_monkey_1794919587552.jpg',
    audioBlobOrUrl: null,
  },

  // باب الفواكه (ready when unlocked)
  {
    id: 'item-apple',
    categoryId: 'cat-fruits',
    name: 'تفاحة',
    imageUrl: PREVIEW_ART.apple,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-banana',
    categoryId: 'cat-fruits',
    name: 'موزة',
    imageUrl: PREVIEW_ART.banana,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-orange',
    categoryId: 'cat-fruits',
    name: 'برتقالة',
    imageUrl: PREVIEW_ART.orange,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-strawberry',
    categoryId: 'cat-fruits',
    name: 'فراولة',
    imageUrl: PREVIEW_ART.strawberry,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-grapes',
    categoryId: 'cat-fruits',
    name: 'عنب',
    imageUrl: PREVIEW_ART.grapes,
    audioBlobOrUrl: null,
  },

  // باب المواصلات (ready when unlocked)
  {
    id: 'item-car',
    categoryId: 'cat-vehicles',
    name: 'سيارة',
    imageUrl: PREVIEW_ART.car,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-bus',
    categoryId: 'cat-vehicles',
    name: 'حافلة',
    imageUrl: PREVIEW_ART.bus,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-train',
    categoryId: 'cat-vehicles',
    name: 'قطار',
    imageUrl: PREVIEW_ART.train,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-plane',
    categoryId: 'cat-vehicles',
    name: 'طائرة',
    imageUrl: PREVIEW_ART.plane,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-ship',
    categoryId: 'cat-vehicles',
    name: 'سفينة',
    imageUrl: PREVIEW_ART.ship,
    audioBlobOrUrl: null,
  },

  // باب المشاعر والمنطق (ready when unlocked)
  {
    id: 'item-happy',
    categoryId: 'cat-emotions',
    name: 'سعيد',
    imageUrl: PREVIEW_ART.happy,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-surprised',
    categoryId: 'cat-emotions',
    name: 'مندهش',
    imageUrl: PREVIEW_ART.surprised,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-star',
    categoryId: 'cat-emotions',
    name: 'نجمة',
    imageUrl: PREVIEW_ART.star,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-triangle',
    categoryId: 'cat-emotions',
    name: 'مثلث',
    imageUrl: PREVIEW_ART.triangle,
    audioBlobOrUrl: null,
  },
  {
    id: 'item-sun',
    categoryId: 'cat-emotions',
    name: 'شمس',
    imageUrl: PREVIEW_ART.sun,
    audioBlobOrUrl: null,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  winAudioBlob: null,
  retryAudioBlob: null,
  targetPromptAudioBlob: null,
};
