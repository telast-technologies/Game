import React from 'react';
import { motion } from 'framer-motion';
import { Settings, BarChart3, Play, Star, Mic } from 'lucide-react';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types';
import { BrandLogo } from './BrandLogo';

interface HomeScreenProps {
  difficulty: DifficultyLevel;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onStartPlay: () => void;
  onOpenAdminGate: () => void;
  onOpenPitch: () => void;
  onOpenLiveVoice: () => void;
  stars: number;
}

const LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onStartPlay,
  onOpenAdminGate,
  onOpenPitch,
  onOpenLiveVoice,
  stars,
}) => {
  return (
    <div className="flex flex-col h-full px-5 pt-4 pb-6 justify-between overflow-y-auto custom-scroll">
      {/* Top Action Header */}
      <header className="flex items-center justify-between gap-2">
        <button
          onClick={onOpenAdminGate}
          className="btn-tactile h-10 px-3 rounded-xl bg-white border-2 border-[#E9DFD7] border-b-4 text-xs font-extrabold text-[#4A413C] flex items-center gap-1.5 hover:bg-[#FFF9F5] whitespace-nowrap shrink-0"
        >
          <Settings className="w-4 h-4 text-[#4EA8DE]" />
          <span>تغذية المحتوى</span>
        </button>

        <button
          onClick={onOpenPitch}
          className="btn-tactile h-10 px-3 rounded-xl bg-white border-2 border-[#E9DFD7] border-b-4 text-xs font-extrabold text-[#4A413C] flex items-center gap-1.5 hover:bg-[#FFF9F5] whitespace-nowrap shrink-0"
        >
          <BarChart3 className="w-4 h-4 text-[#FF7A59]" />
          <span>رؤية المشروع</span>
        </button>
      </header>

      {/* Hero Brand Lockup */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center text-center my-4"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
          className="mb-3"
        >
          <BrandLogo size={74} />
        </motion.div>

        <h1 className="text-3xl font-black text-[#2B2523] tracking-tight text-balance">
          ذاكرة ذكية
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-[#6E635C] max-w-[300px] leading-relaxed">
          حوّل وقت الشاشة إلى تدريب ممتع للذاكرة والتركيز
        </p>

        {stars > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[#B87D00]">
            <Star className="w-4 h-4 fill-[#FFD166] text-[#D99B00]" />
            <span className="tabular-nums">مجموع النجوم: {stars}</span>
          </div>
        )}
      </motion.div>

      {/* Age / Difficulty Selector Pills */}
      <section aria-label="اختيار العمر والمستوى" className="space-y-2.5 my-2">
        <p className="text-xs font-extrabold text-[#7A6F69] px-1">اختر الفئة العمرية والمستوى:</p>
        <div className="space-y-2.5">
          {LEVELS.map((lvl) => {
            const cfg = DIFFICULTY_CONFIGS[lvl];
            const isSelected = difficulty === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectDifficulty(lvl)}
                className={`btn-tactile w-full text-right rounded-2xl p-3.5 border-2 border-b-4 transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-white border-[#2B2523] shadow-sm'
                    : 'bg-white/75 border-[#E9DFD7] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-xs"
                    style={{ backgroundColor: cfg.accentColor }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#2B2523]">{cfg.label}</span>
                      <span className="text-xs font-bold text-[#7A6F69]">· {cfg.ageRange}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#6E635C] mt-0.5 truncate">
                      {cfg.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#2B2523] bg-[#2B2523]' : 'border-[#D8CCC2] bg-transparent'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Primary Play CTA + Live Voice Teacher Trigger */}
      <div className="pt-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onStartPlay}
          className="btn-tactile flex-1 h-14 rounded-2xl bg-[#FF7A59] text-white font-black text-xl border-b-[5px] border-[#D95738] flex items-center justify-center gap-2.5 shadow-md hover:brightness-105"
        >
          <span>ابدأ اللعب</span>
          <Play className="w-5 h-5 fill-white rotate-180" />
        </button>

        <button
          type="button"
          onClick={onOpenLiveVoice}
          className="btn-tactile h-14 px-4 rounded-2xl bg-[#E6FAF4] text-[#0D5B45] border-2 border-[#06D6A0] border-b-[5px] font-extrabold text-xs flex flex-col items-center justify-center gap-0.5 shrink-0 hover:brightness-98"
          aria-label="المعلم الذكي المباشر"
          title="تحدث مع المعلم الذكي"
        >
          <Mic className="w-5 h-5" />
          <span>المعلم الذكي</span>
        </button>
      </div>
    </div>
  );
};
