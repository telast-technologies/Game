import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Star } from 'lucide-react';
import { Category, DifficultyLevel, DIFFICULTY_CONFIGS, Item } from '../types';
import { MediaImage } from './MediaImage';

interface CategoriesScreenProps {
  categories: Category[];
  items: Item[];
  stars: number;
  difficulty: DifficultyLevel;
  onBack: () => void;
  onSelectCategory: (category: Category) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categories,
  items,
  stars,
  difficulty,
  onBack,
  onSelectCategory,
}) => {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="flex flex-col h-full bg-[#FDF8F5]">
      {/* Sticky Top Header */}
      <header className="flex items-center justify-between px-4 py-3.5 border-b border-[#EFE5DD] bg-[#FDF8F5]/95 backdrop-blur-xs shrink-0">
        <button
          onClick={onBack}
          className="btn-tactile w-11 h-11 rounded-2xl bg-white border-2 border-[#E9DFD7] border-b-4 flex items-center justify-center text-[#2B2523] hover:bg-[#FFF9F5]"
          aria-label="رجوع للرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black text-[#2B2523]">الأبواب المعرفية</h1>
          <p className="text-xs font-bold text-[#7A6F69]">
            المستوى: {diffCfg.label} · {diffCfg.ageRange}
          </p>
        </div>

        <div className="h-10 px-3 rounded-2xl bg-[#FFF6DC] border-2 border-[#FFD166] flex items-center gap-1.5 shrink-0">
          <Star className="w-4 h-4 fill-[#FFD166] text-[#D99B00]" />
          <span className="text-sm font-black text-[#2B2523] tabular-nums">{stars}</span>
        </div>
      </header>

      {/* 2-Column Categories Grid */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4">
        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((cat, idx) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            return (
              <motion.button
                key={cat.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                onClick={() => onSelectCategory(cat)}
                className={`btn-tactile group text-right rounded-3xl bg-white border-2 border-b-[5px] overflow-hidden flex flex-col transition-all ${
                  cat.isLocked
                    ? 'border-[#E6DCD3] opacity-90 hover:opacity-100'
                    : 'border-[#DCEAE5] hover:border-[#06D6A0]'
                }`}
              >
                <div className="relative w-full aspect-[4/3] bg-[#FFFDFB] overflow-hidden">
                  <MediaImage
                    src={cat.coverImage}
                    alt={cat.title}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      cat.isLocked ? 'saturate-75' : ''
                    }`}
                  />
                  {cat.isLocked && (
                    <div className="absolute inset-0 bg-black/15 flex items-start justify-end p-2">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-[#2B2523]/90 text-[#FFD166] px-2.5 py-1 text-[11px] font-extrabold shadow-sm">
                        <Lock className="w-3 h-3" />
                        <span>باقة الأسرة</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between w-full">
                  <h2 className="text-sm font-black text-[#2B2523] leading-snug line-clamp-2">
                    {cat.title}
                  </h2>
                  <p className="mt-1.5 text-xs font-bold text-[#7A6F69] tabular-nums">
                    {count} عناصر
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
