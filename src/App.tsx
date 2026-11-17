import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Home, Layers, Mic, Settings, Star } from 'lucide-react';
import {
  AppScreen,
  AppSettings,
  Category,
  DifficultyLevel,
  Item,
} from './types';
import {
  initializeAndLoadData,
  PersistedState,
  resetToSeedData,
  saveCategories,
  saveItems,
  saveSettings,
  saveStars,
} from './db/storage';
import { HomeScreen } from './components/HomeScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { GameArena } from './components/GameArena';
import { AdminPanel } from './components/AdminPanel';
import { FreemiumModal, ParentGateModal, PitchModal } from './components/Modals';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { stopAllAudio } from './utils/audio';

const SCREEN_ORDER: Record<AppScreen, number> = {
  home: 0,
  categories: 1,
  game: 2,
  admin: 3,
};

const screenSlideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -36 : 36,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 36 : -36,
  }),
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [navDirection, setNavDirection] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [stars, setStars] = useState<number>(0);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [lockedModalCategory, setLockedModalCategory] = useState<Category | null>(
    null
  );
  const [isParentGateOpen, setIsParentGateOpen] = useState(false);
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  useEffect(() => {
    let active = true;
    initializeAndLoadData()
      .then((data) => {
        if (!active) return;
        setCategories(data.categories);
        setItems(data.items);
        setSettings(data.settings);
        setStars(data.stars);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const navigateTo = (next: AppScreen) => {
    stopAllAudio();
    const dir = SCREEN_ORDER[next] >= SCREEN_ORDER[screen] ? 1 : -1;
    setNavDirection(dir);
    setScreen(next);
  };

  const handleUpdateCategories = async (nextCats: Category[]) => {
    const ordered = nextCats.map((c, idx) => ({ ...c, order: idx }));
    setCategories(ordered);
    await saveCategories(ordered);
  };

  const handleUpdateItems = async (nextItems: Item[]) => {
    setItems(nextItems);
    await saveItems(nextItems);
  };

  const handleSaveItemAudio = async (itemId: string, audioBlob: Blob) => {
    setItems((prev) => {
      const updated = prev.map((it) =>
        it.id === itemId ? { ...it, audioBlobOrUrl: audioBlob } : it
      );
      saveItems(updated).catch(() => {});
      return updated;
    });
  };

  const handleUpdateSettings = async (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    await saveSettings(nextSettings);
  };

  const handleAddStars = async (delta: number) => {
    const next = stars + delta;
    setStars(next);
    await saveStars(next);
  };

  const handleSelectCategory = (cat: Category) => {
    if (cat.isLocked) {
      setLockedModalCategory(cat);
      return;
    }
    setActiveCategoryId(cat.id);
    navigateTo('game');
  };

  const handleDemoUnlock = async (categoryId: string) => {
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, isLocked: false } : c
    );
    await handleUpdateCategories(updated);
    setLockedModalCategory(null);
    setActiveCategoryId(categoryId);
    navigateTo('game');
  };

  const handleNextLevel = () => {
    setDifficulty((prev) =>
      prev === 'beginner'
        ? 'intermediate'
        : prev === 'intermediate'
          ? 'advanced'
          : 'advanced'
    );
  };

  const handleImportAll = (restored: PersistedState) => {
    setCategories(restored.categories);
    setItems(restored.items);
    setSettings(restored.settings);
    setStars(restored.stars);
  };

  const handleResetDefaults = async () => {
    const fresh = await resetToSeedData();
    handleImportAll(fresh);
  };

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null;

  const activeCategoryItems = activeCategory
    ? items.filter((i) => i.categoryId === activeCategory.id)
    : [];

  return (
    <div className="min-h-[100dvh] w-full bg-[#F4ECE6] flex flex-col md:flex-row items-center justify-center md:gap-8 md:p-6">
      {/* Subtle Desktop Investor / Admin Controls Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 rounded-3xl bg-[#FFFDFB] border-2 border-[#E6DCD3] p-5 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-black text-[#2B2523]">ذاكرة ذكية</h2>
          <p className="text-xs font-bold text-[#7A6F69] mt-0.5">
            أدوات المعاينة والعرض السريع
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFF6DC] border border-[#FFD166] px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#8A5A00]">نجوم الطفل</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#FFD166] text-[#D99B00]" />
            <span className="text-base font-black text-[#2B2523] tabular-nums">{stars}</span>
          </div>
        </div>

        <nav className="space-y-2" aria-label="التنقل السريع للمشرف">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`w-full h-11 px-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-colors ${
              screen === 'home'
                ? 'bg-[#2B2523] text-white'
                : 'bg-[#FDF8F5] text-[#4A413C] hover:bg-[#EFE5DD]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>الشاشة الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('categories')}
            className={`w-full h-11 px-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-colors ${
              screen === 'categories'
                ? 'bg-[#2B2523] text-white'
                : 'bg-[#FDF8F5] text-[#4A413C] hover:bg-[#EFE5DD]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الأبواب المعرفية</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              setIsParentGateOpen(true);
            }}
            className={`w-full h-11 px-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-colors ${
              screen === 'admin'
                ? 'bg-[#4EA8DE] text-white'
                : 'bg-[#FDF8F5] text-[#4A413C] hover:bg-[#EFE5DD]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>تغذية المحتوى (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLiveVoiceOpen(true)}
            className="w-full h-11 px-3.5 rounded-2xl bg-[#E6FAF4] text-[#0D5B45] hover:bg-[#D2F5EA] text-sm font-extrabold flex items-center gap-2.5 transition-colors"
          >
            <Mic className="w-4 h-4" />
            <span>المعلم الذكي المباشر</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPitchOpen(true)}
            className="w-full h-11 px-3.5 rounded-2xl bg-[#FFF0EC] text-[#9E351B] hover:bg-[#FFE3DB] text-sm font-extrabold flex items-center gap-2.5 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>رؤية المشروع (Pitch)</span>
          </button>
        </nav>

        <p className="text-[11px] font-semibold text-[#7A6F69] leading-relaxed pt-2 border-t border-[#EFE5DD]">
          تُحفظ الصور والتسجيلات والأصوات المولدة محلياً في IndexedDB للعمل السريع في أي وقت.
        </p>
      </aside>

      {/* Mobile Viewport Frame on Desktop / Full-screen on Mobile */}
      <main className="w-full h-[100dvh] md:w-[430px] md:max-w-[430px] md:h-[min(840px,calc(100dvh-3rem))] bg-[#FDF8F5] md:rounded-[40px] md:border-[8px] md:border-[#2B2523] md:shadow-[0_24px_60px_rgba(43,37,35,0.2)] overflow-hidden relative flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/15 border-2 border-[#FF7A59] animate-spin" />
            <p className="text-sm font-extrabold text-[#5C534E]">جاري تجهيز ذاكرة ذكية...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false} custom={navDirection}>
            <motion.div
              key={screen}
              custom={navDirection}
              variants={screenSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {screen === 'home' && (
                <HomeScreen
                  difficulty={difficulty}
                  onSelectDifficulty={setDifficulty}
                  onStartPlay={() => navigateTo('categories')}
                  onOpenAdminGate={() => setIsParentGateOpen(true)}
                  onOpenPitch={() => setIsPitchOpen(true)}
                  onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
                  stars={stars}
                />
              )}

              {screen === 'categories' && (
                <CategoriesScreen
                  categories={categories}
                  items={items}
                  stars={stars}
                  difficulty={difficulty}
                  onBack={() => navigateTo('home')}
                  onSelectCategory={handleSelectCategory}
                />
              )}

              {screen === 'game' && activeCategory && (
                <GameArena
                  category={activeCategory}
                  categoryItems={activeCategoryItems}
                  difficulty={difficulty}
                  settings={settings}
                  stars={stars}
                  onAddStars={handleAddStars}
                  onSaveItemAudio={handleSaveItemAudio}
                  onNextLevel={handleNextLevel}
                  onBack={() => navigateTo('categories')}
                />
              )}

              {screen === 'admin' && (
                <AdminPanel
                  categories={categories}
                  items={items}
                  settings={settings}
                  stars={stars}
                  onUpdateCategories={handleUpdateCategories}
                  onUpdateItems={handleUpdateItems}
                  onUpdateSettings={handleUpdateSettings}
                  onImportAll={handleImportAll}
                  onResetDefaults={handleResetDefaults}
                  onBack={() => navigateTo('home')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Modals */}
      <ParentGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => {
          setIsParentGateOpen(false);
          navigateTo('admin');
        }}
      />

      <FreemiumModal
        category={lockedModalCategory}
        onClose={() => setLockedModalCategory(null)}
        onDemoUnlock={handleDemoUnlock}
      />

      <PitchModal isOpen={isPitchOpen} onClose={() => setIsPitchOpen(false)} />

      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />
    </div>
  );
}
