export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  ageRange: string;
  cardsCount: number;
  swapsCount: number;
  swapDurationSec: number;
  description: string;
  accentColor: string;
  borderColor: string;
}

export interface Category {
  id: string;
  title: string;
  coverImage: string | Blob;
  isLocked: boolean;
  order: number;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  imageUrl: string | Blob;
  audioBlobOrUrl?: Blob | string | null;
}

export interface AppSettings {
  winAudioBlob?: Blob | string | null;
  retryAudioBlob?: Blob | string | null;
  targetPromptAudioBlob?: Blob | string | null;
}

export type AppScreen = 'home' | 'categories' | 'game' | 'admin';

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  beginner: {
    id: 'beginner',
    label: 'مبتدئ',
    ageRange: '3–4 سنوات',
    cardsCount: 3,
    swapsCount: 3,
    swapDurationSec: 1.3,
    description: '٣ بطاقات · ٣ تبديلات بطيئة',
    accentColor: '#06D6A0',
    borderColor: '#04A77D',
  },
  intermediate: {
    id: 'intermediate',
    label: 'متوسط',
    ageRange: '5–6 سنوات',
    cardsCount: 4,
    swapsCount: 5,
    swapDurationSec: 0.9,
    description: '٤ بطاقات · ٥ تبديلات متوسطة',
    accentColor: '#4EA8DE',
    borderColor: '#2E86BE',
  },
  advanced: {
    id: 'advanced',
    label: 'متقدم',
    ageRange: '7–9 سنوات',
    cardsCount: 5,
    swapsCount: 7,
    swapDurationSec: 0.6,
    description: '٥ بطاقات · ٧ تبديلات سريعة',
    accentColor: '#FF7A59',
    borderColor: '#D95738',
  },
};
