import { get, set } from 'idb-keyval';
import { AppSettings, Category, Item } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ITEMS, DEFAULT_SETTINGS } from './seedData';

const KEYS = {
  CATEGORIES: 'smart_memory_categories',
  ITEMS: 'smart_memory_items',
  SETTINGS: 'smart_memory_settings',
  STARS: 'smart_memory_stars',
  SEEDED: 'smart_memory_seeded_v1',
} as const;

export interface PersistedState {
  categories: Category[];
  items: Item[];
  settings: AppSettings;
  stars: number;
}

export async function initializeAndLoadData(): Promise<PersistedState> {
  const isSeeded = await get<boolean>(KEYS.SEEDED);
  const existingCategories = await get<Category[]>(KEYS.CATEGORIES);

  if (!isSeeded || !existingCategories) {
    await set(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    await set(KEYS.ITEMS, DEFAULT_ITEMS);
    await set(KEYS.SETTINGS, DEFAULT_SETTINGS);
    await set(KEYS.STARS, 0);
    await set(KEYS.SEEDED, true);
    return {
      categories: DEFAULT_CATEGORIES,
      items: DEFAULT_ITEMS,
      settings: DEFAULT_SETTINGS,
      stars: 0,
    };
  }

  const [categories, items, settings, stars] = await Promise.all([
    get<Category[]>(KEYS.CATEGORIES),
    get<Item[]>(KEYS.ITEMS),
    get<AppSettings>(KEYS.SETTINGS),
    get<number>(KEYS.STARS),
  ]);

  return {
    categories: (categories ?? DEFAULT_CATEGORIES).sort((a, b) => a.order - b.order),
    items: items ?? DEFAULT_ITEMS,
    settings: settings ?? DEFAULT_SETTINGS,
    stars: typeof stars === 'number' ? stars : 0,
  };
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await set(KEYS.CATEGORIES, categories);
}

export async function saveItems(items: Item[]): Promise<void> {
  await set(KEYS.ITEMS, items);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(KEYS.SETTINGS, settings);
}

export async function saveStars(stars: number): Promise<void> {
  await set(KEYS.STARS, stars);
}

export async function resetToSeedData(): Promise<PersistedState> {
  await set(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  await set(KEYS.ITEMS, DEFAULT_ITEMS);
  await set(KEYS.SETTINGS, DEFAULT_SETTINGS);
  await set(KEYS.STARS, 0);
  await set(KEYS.SEEDED, true);
  return {
    categories: DEFAULT_CATEGORIES,
    items: DEFAULT_ITEMS,
    settings: DEFAULT_SETTINGS,
    stars: 0,
  };
}

// Convert Blob -> base64 DataURL for portable JSON export
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Convert base64 DataURL -> Blob for clean IndexedDB storage on import
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function serializeMedia(media?: Blob | string | null): Promise<string | null> {
  if (!media) return null;
  if (typeof media === 'string') return media;
  return blobToDataUrl(media);
}

async function deserializeAudio(media?: string | null): Promise<Blob | string | null> {
  if (!media) return null;
  if (media.startsWith('data:')) {
    return dataUrlToBlob(media);
  }
  return media;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  categories: Array<{
    id: string;
    title: string;
    coverImage: string;
    isLocked: boolean;
    order: number;
  }>;
  items: Array<{
    id: string;
    categoryId: string;
    name: string;
    imageUrl: string;
    audioDataUrl: string | null;
  }>;
  settings: {
    winAudioDataUrl: string | null;
    retryAudioDataUrl: string | null;
    targetPromptAudioDataUrl: string | null;
  };
  stars: number;
}

export async function exportDatabaseToJson(state: PersistedState): Promise<string> {
  const categories = await Promise.all(
    state.categories.map(async (cat) => ({
      id: cat.id,
      title: cat.title,
      coverImage: (await serializeMedia(cat.coverImage)) ?? '',
      isLocked: cat.isLocked,
      order: cat.order,
    }))
  );

  const items = await Promise.all(
    state.items.map(async (item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      imageUrl: (await serializeMedia(item.imageUrl)) ?? '',
      audioDataUrl: await serializeMedia(item.audioBlobOrUrl),
    }))
  );

  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    items,
    settings: {
      winAudioDataUrl: await serializeMedia(state.settings.winAudioBlob),
      retryAudioDataUrl: await serializeMedia(state.settings.retryAudioBlob),
      targetPromptAudioDataUrl: await serializeMedia(state.settings.targetPromptAudioBlob),
    },
    stars: state.stars,
  };

  return JSON.stringify(payload, null, 2);
}

export async function importDatabaseFromJson(jsonText: string): Promise<PersistedState> {
  const parsed = JSON.parse(jsonText) as Partial<ExportPayload>;
  if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح.');
  }

  const categories: Category[] = parsed.categories.map((c, idx) => ({
    id: String(c.id),
    title: String(c.title),
    coverImage: String(c.coverImage || ''),
    isLocked: Boolean(c.isLocked),
    order: typeof c.order === 'number' ? c.order : idx,
  }));

  const items: Item[] = await Promise.all(
    parsed.items.map(async (item) => ({
      id: String(item.id),
      categoryId: String(item.categoryId),
      name: String(item.name),
      imageUrl: String(item.imageUrl || ''),
      audioBlobOrUrl: await deserializeAudio(item.audioDataUrl),
    }))
  );

  const settings: AppSettings = {
    winAudioBlob: await deserializeAudio(parsed.settings?.winAudioDataUrl),
    retryAudioBlob: await deserializeAudio(parsed.settings?.retryAudioDataUrl),
    targetPromptAudioBlob: await deserializeAudio(parsed.settings?.targetPromptAudioDataUrl),
  };

  const stars = typeof parsed.stars === 'number' ? parsed.stars : 0;

  await Promise.all([
    set(KEYS.CATEGORIES, categories),
    set(KEYS.ITEMS, items),
    set(KEYS.SETTINGS, settings),
    set(KEYS.STARS, stars),
    set(KEYS.SEEDED, true),
  ]);

  return {
    categories: categories.sort((a, b) => a.order - b.order),
    items,
    settings,
    stars,
  };
}
