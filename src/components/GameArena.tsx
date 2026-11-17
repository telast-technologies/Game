import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Check,
  HelpCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  Star,
  TrendingUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AppSettings,
  Category,
  DifficultyConfig,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  Item,
} from '../types';
import {
  generateItemRecognitionAudio,
  playBlobOrUrl,
  playEncouragement,
  playItemVoice,
  playShuffleTick,
  playTapChime,
  speakArabicText,
  stopAllAudio,
} from '../utils/audio';
import { MediaImage } from './MediaImage';

interface GameArenaProps {
  category: Category;
  categoryItems: Item[];
  difficulty: DifficultyLevel;
  settings: AppSettings;
  stars: number;
  onAddStars: (delta: number) => void;
  onSaveItemAudio: (itemId: string, audioBlob: Blob) => Promise<void>;
  onNextLevel: () => void;
  onBack: () => void;
}

type GamePhase = 'discovery' | 'focus' | 'shuffling' | 'recall' | 'won';

interface Point {
  x: number;
  y: number;
}

interface ActiveSwapAnim {
  step: number;
  cardAId: string;
  cardBId: string;
  fromA: Point;
  toA: Point;
  arcA: Point;
  fromB: Point;
  toB: Point;
  arcB: Point;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function computeLayout(
  count: number,
  stageW: number,
  stageH: number
): { cardW: number; cardH: number; positions: Point[] } {
  const safeW = Math.max(stageW, 300);
  const safeH = Math.max(stageH, 320);

  if (count <= 2) {
    const cardW = Math.min(132, Math.floor((safeW - 56) / 2));
    const cardH = Math.round(cardW * 1.2);
    const gap = 24;
    const totalW = cardW * 2 + gap;
    const startX = (safeW - totalW) / 2;
    const y = (safeH - cardH) / 2;
    return {
      cardW,
      cardH,
      positions: [
        { x: startX, y },
        { x: startX + cardW + gap, y },
      ].slice(0, count),
    };
  }

  if (count === 3) {
    const gap = 12;
    const cardW = Math.min(110, Math.floor((safeW - 32 - gap * 2) / 3));
    const cardH = Math.round(cardW * 1.24);
    const totalW = cardW * 3 + gap * 2;
    const startX = (safeW - totalW) / 2;
    const y = (safeH - cardH) / 2;
    return {
      cardW,
      cardH,
      positions: [0, 1, 2].map((i) => ({ x: startX + i * (cardW + gap), y })),
    };
  }

  if (count === 4) {
    const colGap = 20;
    const rowGap = 20;
    const cardW = Math.min(126, Math.floor((safeW - 48 - colGap) / 2));
    const cardH = Math.min(Math.round(cardW * 1.12), Math.floor((safeH - 56 - rowGap) / 2));
    const totalW = cardW * 2 + colGap;
    const totalH = cardH * 2 + rowGap;
    const startX = (safeW - totalW) / 2;
    const startY = (safeH - totalH) / 2;
    return {
      cardW,
      cardH,
      positions: [
        { x: startX, y: startY },
        { x: startX + cardW + colGap, y: startY },
        { x: startX, y: startY + cardH + rowGap },
        { x: startX + cardW + colGap, y: startY + cardH + rowGap },
      ],
    };
  }

  // 5 cards: 3 on top row + 2 centered on bottom row
  const gap = 12;
  const rowGap = 18;
  const cardW = Math.min(104, Math.floor((safeW - 32 - gap * 2) / 3));
  const cardH = Math.min(Math.round(cardW * 1.18), Math.floor((safeH - 48 - rowGap) / 2));
  const topW = cardW * 3 + gap * 2;
  const botW = cardW * 2 + gap * 1.6;
  const totalH = cardH * 2 + rowGap;
  const topStartX = (safeW - topW) / 2;
  const botStartX = (safeW - botW) / 2;
  const startY = (safeH - totalH) / 2;

  return {
    cardW,
    cardH,
    positions: [
      { x: topStartX, y: startY },
      { x: topStartX + cardW + gap, y: startY },
      { x: topStartX + (cardW + gap) * 2, y: startY },
      { x: botStartX, y: startY + cardH + rowGap },
      { x: botStartX + cardW + gap * 1.6, y: startY + cardH + rowGap },
    ],
  };
}

function buildSwapSchedule(
  cardCount: number,
  swapsCount: number,
  initialTargetSlot: number
): Array<[number, number]> {
  const minTargetSwaps = Math.ceil(swapsCount * 0.6);
  const flags = Array.from({ length: swapsCount }, (_, i) => i < minTargetSwaps);
  const shuffledFlags = shuffleArray(flags);

  let targetSlot = initialTargetSlot;
  let lastPairKey = '';
  const schedule: Array<[number, number]> = [];

  for (let i = 0; i < swapsCount; i++) {
    const mustIncludeTarget = shuffledFlags[i];
    let slotA = 0;
    let slotB = 1;

    for (let attempt = 0; attempt < 10; attempt++) {
      if (mustIncludeTarget) {
        slotA = targetSlot;
        const others = Array.from({ length: cardCount }, (_, idx) => idx).filter(
          (idx) => idx !== targetSlot
        );
        slotB = others[Math.floor(Math.random() * others.length)];
      } else {
        const all = shuffleArray(Array.from({ length: cardCount }, (_, idx) => idx));
        slotA = all[0];
        slotB = all[1];
      }
      const key = `${Math.min(slotA, slotB)}-${Math.max(slotA, slotB)}`;
      if (key !== lastPairKey || cardCount <= 2) {
        lastPairKey = key;
        break;
      }
    }

    if (slotA === targetSlot) {
      targetSlot = slotB;
    } else if (slotB === targetSlot) {
      targetSlot = slotA;
    }

    schedule.push([slotA, slotB]);
  }

  return schedule;
}

export const GameArena: React.FC<GameArenaProps> = ({
  category,
  categoryItems,
  difficulty,
  settings,
  stars,
  onAddStars,
  onSaveItemAudio,
  onNextLevel,
  onBack,
}) => {
  const diffCfg: DifficultyConfig = DIFFICULTY_CONFIGS[difficulty];
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 390, height: 350 });

  const [roundSeed, setRoundSeed] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('discovery');
  const [muted, setMuted] = useState(false);

  const [roundCards, setRoundCards] = useState<Item[]>([]);
  const [targetId, setTargetId] = useState<string>('');
  const [slotMap, setSlotMap] = useState<Record<string, number>>({});
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [activeTapId, setActiveTapId] = useState<string | null>(null);
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null);
  const [discoveryBanner, setDiscoveryBanner] = useState<string | null>(null);

  const [allFaceDown, setAllFaceDown] = useState(false);
  const [tempRevealId, setTempRevealId] = useState<string | null>(null);
  const [wonCardRevealed, setWonCardRevealed] = useState(false);
  const [wobbleCardId, setWobbleCardId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [activeSwap, setActiveSwap] = useState<ActiveSwapAnim | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);

  const runTokenRef = useRef(0);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const latestCategoryItemsRef = useRef(categoryItems);
  latestCategoryItemsRef.current = categoryItems;

  // Measure arena stage for responsive curved arcs
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      setStageSize({
        width: el.clientWidth || 390,
        height: el.clientHeight || 350,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initialize / reset round when category id, difficulty, or roundSeed changes
  useEffect(() => {
    runTokenRef.current += 1;
    stopAllAudio();

    const pool = latestCategoryItemsRef.current;
    if (pool.length < 2) {
      setRoundCards([]);
      return;
    }

    const n = Math.min(diffCfg.cardsCount, pool.length);
    const chosen = shuffleArray(pool).slice(0, n);
    const target = chosen[Math.floor(Math.random() * chosen.length)];
    const initialSlots: Record<string, number> = {};
    chosen.forEach((c, idx) => {
      initialSlots[c.id] = idx;
    });

    setRoundCards(chosen);
    setTargetId(target.id);
    setSlotMap(initialSlots);
    setDiscoveredIds(new Set());
    setActiveTapId(null);
    setGeneratingAudioId(null);
    setDiscoveryBanner(null);
    setAllFaceDown(false);
    setTempRevealId(null);
    setWonCardRevealed(false);
    setWobbleCardId(null);
    setFeedbackBanner(null);
    setActiveSwap(null);
    setShowWinModal(false);
    setPhase('discovery');

    return () => {
      runTokenRef.current += 1;
      stopAllAudio();
    };
  }, [category.id, diffCfg.cardsCount, roundSeed]);

  const targetItem = useMemo(
    () => roundCards.find((c) => c.id === targetId) ?? null,
    [roundCards, targetId]
  );

  const layout = useMemo(
    () => computeLayout(roundCards.length, stageSize.width, stageSize.height),
    [roundCards.length, stageSize.width, stageSize.height]
  );

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const startChallenge = useCallback(async () => {
    if (!targetItem || roundCards.length < 2) return;
    const token = ++runTokenRef.current;

    // Phase 2: Target Focus (2.5s)
    setPhase('focus');
    setFeedbackBanner(null);
    playEncouragement(
      `ركز كويس مع ${targetItem.name}`,
      'prompt',
      settings.targetPromptAudioBlob,
      mutedRef.current
    );

    await sleep(2500);
    if (runTokenRef.current !== token) return;

    // Phase 3: Flip face-down & Curved Cup-Shuffle
    setPhase('shuffling');
    setAllFaceDown(true);
    await sleep(520);
    if (runTokenRef.current !== token) return;

    const currentSlots = { ...slotMap };
    const initialTargetSlot = currentSlots[targetItem.id] ?? 0;
    const swapPairs = buildSwapSchedule(
      roundCards.length,
      diffCfg.swapsCount,
      initialTargetSlot
    );

    const swapMs = diffCfg.swapDurationSec * 1000;

    for (let step = 0; step < swapPairs.length; step++) {
      if (runTokenRef.current !== token) return;
      const [slotA, slotB] = swapPairs[step];

      const cardA = roundCards.find((c) => currentSlots[c.id] === slotA);
      const cardB = roundCards.find((c) => currentSlots[c.id] === slotB);
      if (!cardA || !cardB) continue;

      const posA = layout.positions[slotA];
      const posB = layout.positions[slotB];
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;

      const isMostlyHorizontal = Math.abs(dx) >= Math.abs(dy);
      const arcA: Point = isMostlyHorizontal ? { x: 0, y: -56 } : { x: -46, y: 0 };
      const arcB: Point = isMostlyHorizontal ? { x: 0, y: 56 } : { x: 46, y: 0 };

      // Commit new logical slot immediately so state stays consistent
      currentSlots[cardA.id] = slotB;
      currentSlots[cardB.id] = slotA;
      setSlotMap({ ...currentSlots });

      setActiveSwap({
        step,
        cardAId: cardA.id,
        cardBId: cardB.id,
        fromA: posA,
        toA: posB,
        arcA,
        fromB: posB,
        toB: posA,
        arcB,
      });

      playShuffleTick(mutedRef.current);

      await sleep(swapMs * 0.92);
      if (runTokenRef.current !== token) return;
      setActiveSwap(null);
      await sleep(Math.max(70, swapMs * 0.08));
    }

    if (runTokenRef.current !== token) return;

    // Phase 4: Recall
    setPhase('recall');
    playEncouragement(
      `فين ${targetItem.name} دلوقتي؟`,
      'prompt',
      null,
      mutedRef.current
    );
  }, [
    targetItem,
    roundCards,
    slotMap,
    diffCfg.swapsCount,
    diffCfg.swapDurationSec,
    layout.positions,
    settings.targetPromptAudioBlob,
  ]);

  const handleCardClick = async (card: Item) => {
    if (phase === 'discovery') {
      const token = runTokenRef.current;
      setActiveTapId(card.id);
      setTimeout(() => setActiveTapId((prev) => (prev === card.id ? null : prev)), 260);
      setDiscoveredIds((prev) => new Set(prev).add(card.id));

      if (card.audioBlobOrUrl) {
        setDiscoveryBanner(`استمع إلى: ${card.name}`);
        await playItemVoice(card.name, card.audioBlobOrUrl, mutedRef.current);
        return;
      }

      // Generate natural Arabic recognition voice for this image and cache it in IndexedDB
      playTapChime(mutedRef.current);
      setGeneratingAudioId(card.id);
      setDiscoveryBanner(`جاري توليد صوت للتعرف على «${card.name}»...`);

      try {
        const { blob, spokenText } = await generateItemRecognitionAudio(
          card,
          category.title
        );
        if (runTokenRef.current !== token) return;

        // Cache inside current roundCards & persist to IndexedDB
        setRoundCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, audioBlobOrUrl: blob } : c))
        );
        await onSaveItemAudio(card.id, blob);

        if (runTokenRef.current !== token) return;
        setDiscoveryBanner(spokenText);
        await playBlobOrUrl(blob, mutedRef.current);
      } catch (err) {
        if (runTokenRef.current !== token) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'تعذر توليد الصوت الذكي.';
        setDiscoveryBanner(`${card.name} (${msg})`);
        speakArabicText(card.name, mutedRef.current);
      } finally {
        if (runTokenRef.current === token) {
          setGeneratingAudioId((curr) => (curr === card.id ? null : curr));
        }
      }
      return;
    }

    if (phase !== 'recall') return;
    if (tempRevealId) return; // Wait for brief retry reveal to finish

    const token = runTokenRef.current;

    if (card.id === targetId) {
      // Correct recall!
      setPhase('won');
      setWonCardRevealed(true);
      setFeedbackBanner(`ممتاز! لقيت ${card.name} 🎉`);
      onAddStars(10);

      try {
        confetti({
          particleCount: 95,
          spread: 75,
          origin: { y: 0.62 },
          colors: ['#FF7A59', '#4EA8DE', '#FFD166', '#06D6A0'],
        });
      } catch {
        // Ignore if canvas unavailable
      }

      playEncouragement(
        `برافو! شاطر، لقيت ${card.name}`,
        'win',
        settings.winAudioBlob,
        mutedRef.current
      );

      await sleep(950);
      if (runTokenRef.current === token) {
        setShowWinModal(true);
      }
    } else {
      // Gentle non-punitive retry
      setWobbleCardId(card.id);
      setTempRevealId(card.id);
      setFeedbackBanner(`ده ${card.name}، جرب تاني!`);

      playEncouragement(
        `ده ${card.name}، جرب تاني`,
        'retry',
        settings.retryAudioBlob,
        mutedRef.current
      );

      await sleep(1400);
      if (runTokenRef.current === token) {
        setWobbleCardId(null);
        setTempRevealId(null);
        setFeedbackBanner(null);
      }
    }
  };

  if (categoryItems.length < 2) {
    return (
      <div className="flex flex-col h-full bg-[#FDF8F5] p-6 items-center justify-center text-center">
        <p className="text-lg font-black text-[#2B2523] mb-2">هذا الباب يحتاج عنصرين على الأقل</p>
        <p className="text-sm text-[#6E635C] mb-6">
          أضف بطاقتين على الأقل من لوحة تغذية المحتوى للبدء.
        </p>
        <button
          onClick={onBack}
          className="btn-tactile px-6 h-12 rounded-2xl bg-[#4EA8DE] text-white font-extrabold border-b-4 border-[#2E86BE]"
        >
          العودة للأبواب المعرفية
        </button>
      </div>
    );
  }

  const minDiscoverRequired = Math.min(2, roundCards.length);
  const canStartChallenge = discoveredIds.size >= minDiscoverRequired;

  // Determine banner copy
  let bannerText = discoveryBanner ?? 'اضغط على كل صورة لتتعرف عليها وتستمع لصوتها!';
  let bannerBg = 'bg-[#EBF6FC] border-[#BCE3FA] text-[#1D5B7F]';
  if (phase === 'focus' && targetItem) {
    bannerText = `ركز كويس مع ${targetItem.name}!`;
    bannerBg = 'bg-[#FFF7DC] border-[#FFD166] text-[#8A5A00]';
  } else if (phase === 'shuffling') {
    bannerText = 'ركز بعينيك... البطاقات بتتبدل!';
    bannerBg = 'bg-[#FFF0EC] border-[#FFC4B5] text-[#9E351B]';
  } else if (phase === 'recall' && targetItem) {
    bannerText = feedbackBanner ?? `فين ${targetItem.name} دلوقتي؟ اضغط على مكانه!`;
    bannerBg = feedbackBanner
      ? 'bg-[#FFF7DC] border-[#FFD166] text-[#8A5A00]'
      : 'bg-[#E6FAF4] border-[#8BEAD0] text-[#0D5B45]';
  } else if (phase === 'won') {
    bannerText = feedbackBanner ?? 'أحسنت!';
    bannerBg = 'bg-[#E6FAF4] border-[#06D6A0] text-[#0D5B45]';
  }

  return (
    <div className="flex flex-col h-full bg-[#FDF8F5] relative">
      {/* Top Arena HUD */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#EFE5DD] bg-[#FDF8F5] shrink-0">
        <button
          onClick={() => {
            stopAllAudio();
            onBack();
          }}
          className="btn-tactile w-10 h-10 rounded-xl bg-white border-2 border-[#E9DFD7] border-b-4 flex items-center justify-center text-[#2B2523]"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-sm font-black text-[#2B2523] truncate">{category.title}</p>
          <p className="text-[11px] font-bold text-[#7A6F69]">
            {diffCfg.label} · {roundCards.length} بطاقات
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const nextMuted = !muted;
              setMuted(nextMuted);
              if (nextMuted) stopAllAudio();
            }}
            className="btn-tactile w-10 h-10 rounded-xl bg-white border-2 border-[#E9DFD7] border-b-4 flex items-center justify-center text-[#5C534E]"
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-[#D95738]" /> : <Volume2 className="w-4 h-4 text-[#4EA8DE]" />}
          </button>

          <div className="h-10 px-2.5 rounded-xl bg-[#FFF6DC] border-2 border-[#FFD166] flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#FFD166] text-[#D99B00]" />
            <span className="text-xs font-black text-[#2B2523] tabular-nums">{stars}</span>
          </div>
        </div>
      </header>

      {/* Pedagogical Instruction Banner */}
      <div className="px-4 pt-3.5 shrink-0">
        <motion.div
          key={bannerText}
          initial={{ opacity: 0.7, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 px-4 py-3 text-center font-black text-base leading-snug shadow-xs ${bannerBg}`}
        >
          {bannerText}
        </motion.div>
      </div>

      {/* 2D Curved Cup-Shuffle Stage */}
      <div
        ref={stageRef}
        dir="ltr"
        className="flex-1 relative overflow-hidden my-2 mx-2 min-h-[300px]"
      >
        {roundCards.map((card) => {
          const slotIdx = slotMap[card.id] ?? 0;
          const restPos = layout.positions[slotIdx] ?? { x: 0, y: 0 };

          const isTarget = card.id === targetId;
          const isDiscovered = discoveredIds.has(card.id);
          const isSwappingA = activeSwap?.cardAId === card.id;
          const isSwappingB = activeSwap?.cardBId === card.id;
          const isWobbling = wobbleCardId === card.id;

          // Determine whether card shows its back (180deg)
          let showBack = allFaceDown;
          if (phase === 'recall' && tempRevealId === card.id) showBack = false;
          if (phase === 'won' && isTarget && wonCardRevealed) showBack = false;

          let animateProps: Record<string, unknown> = {
            x: restPos.x,
            y: restPos.y,
            scale: 1,
            opacity: 1,
          };
          let transitionProps: Record<string, unknown> = {
            type: 'spring',
            stiffness: 260,
            damping: 24,
          };
          let zIndex = 5;

          if (phase === 'discovery' && activeTapId === card.id) {
            animateProps = { x: restPos.x, y: restPos.y, scale: 1.09, opacity: 1 };
            zIndex = 15;
          } else if (phase === 'focus') {
            animateProps = {
              x: restPos.x,
              y: restPos.y,
              scale: isTarget ? [1, 1.09, 1.04] : 0.94,
              opacity: isTarget ? 1 : 0.45,
            };
            transitionProps = isTarget
              ? {
                  type: 'tween',
                  duration: 1.1,
                  times: [0, 0.5, 1],
                  ease: 'easeInOut',
                }
              : {
                  type: 'spring',
                  stiffness: 260,
                  damping: 24,
                };
            zIndex = isTarget ? 20 : 2;
          } else if (isSwappingA && activeSwap) {
            const midX = (activeSwap.fromA.x + activeSwap.toA.x) / 2 + activeSwap.arcA.x;
            const midY = (activeSwap.fromA.y + activeSwap.toA.y) / 2 + activeSwap.arcA.y;
            animateProps = {
              x: [activeSwap.fromA.x, midX, activeSwap.toA.x],
              y: [activeSwap.fromA.y, midY, activeSwap.toA.y],
              scale: [1, 1.08, 1],
              opacity: 1,
            };
            transitionProps = {
              type: 'tween',
              duration: diffCfg.swapDurationSec * 0.88,
              times: [0, 0.5, 1],
              ease: 'easeInOut',
            };
            zIndex = 30;
          } else if (isSwappingB && activeSwap) {
            const midX = (activeSwap.fromB.x + activeSwap.toB.x) / 2 + activeSwap.arcB.x;
            const midY = (activeSwap.fromB.y + activeSwap.toB.y) / 2 + activeSwap.arcB.y;
            animateProps = {
              x: [activeSwap.fromB.x, midX, activeSwap.toB.x],
              y: [activeSwap.fromB.y, midY, activeSwap.toB.y],
              scale: [1, 0.94, 1],
              opacity: 1,
            };
            transitionProps = {
              type: 'tween',
              duration: diffCfg.swapDurationSec * 0.88,
              times: [0, 0.5, 1],
              ease: 'easeInOut',
            };
            zIndex = 15;
          } else if (isWobbling) {
            animateProps = {
              x: [
                restPos.x,
                restPos.x - 10,
                restPos.x + 10,
                restPos.x - 7,
                restPos.x + 7,
                restPos.x,
              ],
              y: restPos.y,
              scale: 1,
              opacity: 1,
            };
            transitionProps = { type: 'tween', duration: 0.42, ease: 'easeInOut' };
            zIndex = 25;
          }

          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={phase === 'focus' || phase === 'shuffling' || phase === 'won'}
              initial={{ x: restPos.x, y: restPos.y, scale: 0.85, opacity: 0 }}
              animate={animateProps as never}
              transition={transitionProps as never}
              style={{
                width: layout.cardW,
                height: layout.cardH,
                zIndex,
              }}
              className="absolute top-0 left-0 perspective-1000 focus:outline-none"
              aria-label={showBack ? 'بطاقة مقلوبة' : card.name}
            >
              <motion.div
                animate={{ rotateY: showBack ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full preserve-3d relative"
              >
                {/* Front Face */}
                <div
                  dir="rtl"
                  className={`absolute inset-0 backface-hidden rounded-3xl bg-white border-2 border-b-[5px] p-2 flex flex-col items-center justify-between shadow-sm transition-shadow ${
                    phase === 'focus' && isTarget
                      ? 'border-[#FFD166] ring-4 ring-[#FFD166]/70 shadow-[0_0_24px_rgba(255,209,102,0.75)]'
                      : phase === 'won' && isTarget
                        ? 'border-[#06D6A0] ring-4 ring-[#06D6A0]/50'
                        : 'border-[#E6DCD3]'
                  }`}
                >
                  {phase === 'discovery' && generatingAudioId === card.id ? (
                    <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-[#4EA8DE] text-white flex items-center justify-center shadow-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </span>
                  ) : (
                    phase === 'discovery' &&
                    isDiscovered && (
                      <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-[#06D6A0] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )
                  )}

                  <div className="w-full flex-1 rounded-2xl overflow-hidden bg-[#FFFDFB] flex items-center justify-center">
                    <MediaImage
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <span className="mt-1.5 text-sm font-black text-[#2B2523] leading-tight truncate w-full text-center">
                    {card.name}
                  </span>
                </div>

                {/* Back Face */}
                <div
                  dir="rtl"
                  className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl card-back-pattern border-[3px] border-white border-b-[6px] shadow-md flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-xs flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-white stroke-[2.5]" />
                  </div>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Action Zone (Discovery CTA or Status Helper) */}
      <div className="px-4 pb-5 pt-2 shrink-0">
        {phase === 'discovery' ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={startChallenge}
              disabled={!canStartChallenge}
              className={`btn-tactile w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all ${
                canStartChallenge
                  ? 'bg-[#06D6A0] text-[#113D31] border-b-[5px] border-[#04A77D] shadow-md hover:brightness-105'
                  : 'bg-[#E9DFD7] text-[#8E827A] border-b-4 border-[#D6C9BF] cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>جاهز للتحدي!</span>
            </button>
            {!canStartChallenge && (
              <p className="text-center text-xs font-bold text-[#7A6F69]">
                اضغط على {minDiscoverRequired} بطاقات على الأقل للاستماع إليها ثم ابدأ التحدي
              </p>
            )}
          </div>
        ) : (
          <div className="h-14 flex items-center justify-center">
            {phase === 'focus' && (
              <p className="text-sm font-extrabold text-[#B87D00]">احفظ مكان {targetItem?.name}...</p>
            )}
            {phase === 'shuffling' && (
              <p className="text-sm font-extrabold text-[#FF7A59]">تتبع الحركة بعينيك...</p>
            )}
            {phase === 'recall' && (
              <p className="text-sm font-extrabold text-[#0D5B45]">اضغط على البطاقة الصحيحة!</p>
            )}
          </div>
        )}
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showWinModal && targetItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="w-full max-w-[360px] rounded-3xl bg-[#FFFDFB] p-6 border-2 border-[#FFD166] shadow-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-[#FFF6DC] border-2 border-[#FFD166] p-2 overflow-hidden">
                <MediaImage
                  src={targetItem.imageUrl}
                  alt={targetItem.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-2xl font-black text-[#2B2523]">برافو! بطل الذاكرة 🏆</h2>
              <p className="mt-1 text-sm font-bold text-[#6E635C]">
                وجدت «{targetItem.name}» بنجاح وحصلت على +١٠ نجوم
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-[#FFF6DC] border border-[#FFD166] text-base font-black text-[#B87D00] tabular-nums">
                <Star className="w-5 h-5 fill-[#FFD166] text-[#D99B00]" />
                <span>+10 نجوم</span>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => setRoundSeed((s) => s + 1)}
                  className="btn-tactile w-full h-12 rounded-2xl bg-[#FF7A59] text-white font-black text-base border-b-4 border-[#D95738] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>العب تاني</span>
                </button>

                {difficulty !== 'advanced' && (
                  <button
                    onClick={() => {
                      onNextLevel();
                      setRoundSeed((s) => s + 1);
                    }}
                    className="btn-tactile w-full h-12 rounded-2xl bg-[#06D6A0] text-[#113D31] font-black text-base border-b-4 border-[#04A77D] flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>المستوى التالي</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    stopAllAudio();
                    onBack();
                  }}
                  className="w-full h-10 rounded-xl text-sm font-bold text-[#7A6F69] hover:text-[#2B2523]"
                >
                  تغيير الباب المعرفي
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
