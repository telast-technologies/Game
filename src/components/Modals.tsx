import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Lock,
  Unlock,
  Check,
  Brain,
  TrendingUp,
  Layers,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Category } from '../types';

interface ParentGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ParentGateModal: React.FC<ParentGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() === '7' || answer.trim() === '٧') {
      setAnswer('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-3xl bg-[#FFFDFB] p-6 border-2 border-[#E9DFD7] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#4EA8DE]/15 text-[#2E86BE] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#2B2523]">بوابة الأهل والمحتوى</h3>
                  <p className="text-xs text-[#7A6F69]">للتأكد أنك ولي أمر أو مشرف</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#F4ECE6] text-[#5C534E] flex items-center justify-center hover:bg-[#EAE0D8] transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-2xl bg-[#FDF8F5] border-2 border-[#EFE5DD] p-4 text-center">
                <p className="text-sm font-bold text-[#6E635C] mb-2">أجب عن العملية الحسابية للدخول:</p>
                <p className="text-3xl font-black text-[#2B2523] tracking-wider tabular-nums" dir="ltr">
                  3 + 4 = ?
                </p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setError(false);
                  }}
                  placeholder="اكتب الناتج هنا..."
                  className="w-full h-12 rounded-2xl border-2 border-[#E3D7CE] bg-white px-4 text-center text-lg font-bold text-[#2B2523] focus:outline-none focus:border-[#4EA8DE]"
                  autoFocus
                />
                {error && (
                  <p className="mt-1.5 text-xs font-bold text-[#D95738] text-center">
                    الإجابة غير صحيحة، حاول مرة أخرى (٣ + ٤ = ٧).
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-tactile w-full h-12 rounded-2xl bg-[#4EA8DE] text-white font-extrabold text-base border-b-4 border-[#2E86BE] hover:brightness-105"
              >
                تحقق والدخول
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[#EFE5DD]">
              <button
                type="button"
                onClick={() => {
                  setAnswer('');
                  setError(false);
                  onSuccess();
                }}
                className="btn-tactile w-full h-11 rounded-2xl bg-[#FFD166] text-[#2B2523] font-extrabold text-sm border-b-4 border-[#DFAD3B] flex items-center justify-center gap-2 hover:brightness-105"
              >
                <Zap className="w-4 h-4" />
                <span>دخول سريع للمعاينة</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface FreemiumModalProps {
  category: Category | null;
  onClose: () => void;
  onDemoUnlock: (categoryId: string) => void;
}

export const FreemiumModal: React.FC<FreemiumModalProps> = ({
  category,
  onClose,
  onDemoUnlock,
}) => {
  return (
    <AnimatePresence>
      {category && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-3xl bg-[#FFFDFB] p-6 border-2 border-[#E9DFD7] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-[#FFD166]/30 text-[#B87D00] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#2B2523]">{category.title}</h3>
                  <p className="text-xs font-semibold text-[#7A6F69]">محتوى مميز ضمن باقة الأسرة</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#F4ECE6] text-[#5C534E] flex items-center justify-center hover:bg-[#EAE0D8]"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl bg-[#FDF8F5] border-2 border-[#EAE0D8] p-3.5">
                <p className="text-xs font-bold text-[#7A6F69]">الباقة المجانية</p>
                <p className="text-lg font-black text-[#2B2523] mt-0.5 mb-2">مجاناً</p>
                <ul className="space-y-1.5 text-xs text-[#5C534E]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#06D6A0] shrink-0" />
                    <span>باب الحيوانات مفتوح</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#06D6A0] shrink-0" />
                    <span>جميع المستويات العمرية</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-[#FFF8E6] border-2 border-[#FFD166] p-3.5">
                <p className="text-xs font-extrabold text-[#B87D00]">باقة الأسرة Pro</p>
                <p className="text-lg font-black text-[#2B2523] mt-0.5 mb-2 tabular-nums">$4.99 / شهر</p>
                <ul className="space-y-1.5 text-xs text-[#433B37]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                    <span>كل الأبواب المعرفية</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                    <span>تخصيص صوت الأهل</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                    <span>تقدم حتى ٣ أطفال</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => onDemoUnlock(category.id)}
                className="btn-tactile w-full h-12 rounded-2xl bg-[#06D6A0] text-[#113D31] font-extrabold text-base border-b-4 border-[#04A77D] flex items-center justify-center gap-2 hover:brightness-105"
              >
                <Unlock className="w-5 h-5" />
                <span>فتح تجريبي للمستثمر 🔓</span>
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl text-sm font-bold text-[#7A6F69] hover:text-[#2B2523] transition-colors"
              >
                العودة لاحقاً
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PitchModal: React.FC<PitchModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 18 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[540px] max-h-[88dvh] overflow-y-auto custom-scroll rounded-3xl bg-[#FFFDFB] p-6 border-2 border-[#E9DFD7] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#EFE5DD]">
              <div>
                <h2 className="text-xl font-black text-[#2B2523]">رؤية المشروع — ذاكرة ذكية</h2>
                <p className="text-xs font-semibold text-[#7A6F69] mt-0.5">
                  ملخص تنفيذي للمستثمرين · الفئة العمرية ٣–٩ سنوات
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#F4ECE6] text-[#5C534E] flex items-center justify-center hover:bg-[#EAE0D8]"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-[#4A413C] leading-relaxed">
              <div className="rounded-2xl bg-[#FDF8F5] border border-[#EAE0D8] p-4">
                <div className="flex items-center gap-2 text-[#FF7A59] font-extrabold mb-1.5">
                  <Brain className="w-5 h-5" />
                  <h3>الأساس العلمي (Visuospatial Working Memory)</h3>
                </div>
                <p>
                  يعتمد التطبيق على نموذج الذاكرة العاملة البصرية-المكانية (Baddeley) عبر تتبع الأجسام المتحركة
                  في مسارات منحنية، مما ينشّط الانتباه المستدام والذاكرة العاملة لدى الأطفال (٣–٩ سنوات)
                  بعيداً عن التمرير السلبي أمام الشاشات.
                </p>
              </div>

              <div className="rounded-2xl bg-[#FDF8F5] border border-[#EAE0D8] p-4">
                <div className="flex items-center gap-2 text-[#4EA8DE] font-extrabold mb-1.5">
                  <Layers className="w-5 h-5" />
                  <h3>ميزة تغذية المحتوى والتخصيص الصوتي</h3>
                </div>
                <p>
                  لوحة تغذية محتوى مدمجة تتيح للأهل ومعالجي النطق والروضات رفع صور واقعية من بيئة الطفل
                  وتسجيل النطق بصوت الأم أو الأخصائي، مما يرفع الارتباط العاطفي وسرعة الاكتساب اللغوي.
                </p>
              </div>

              <div className="rounded-2xl bg-[#FDF8F5] border border-[#EAE0D8] p-4">
                <div className="flex items-center gap-2 text-[#06D6A0] font-extrabold mb-1.5">
                  <TrendingUp className="w-5 h-5" />
                  <h3>نموذج الربح (Freemium & B2B)</h3>
                </div>
                <ul className="space-y-1.5">
                  <li>• <strong>B2C باقة الأسرة:</strong> اشتراك شهري ($4.99) لفتح جميع الأبواب المعرفية والتسجيل الصوتي وتعدد ملفات الأطفال.</li>
                  <li>• <strong>B2B الحضانات ومراكز التخاطب:</strong> تراخيص سنوية للعيادات والمدارس مع تصدير واستيراد الحزم التعليمية بضغطة زر.</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-[#FDF8F5] border border-[#EAE0D8] p-4">
                <div className="flex items-center gap-2 text-[#B87D00] font-extrabold mb-1.5">
                  <Users className="w-5 h-5" />
                  <h3>خارطة التوسع</h3>
                </div>
                <p>
                  دعم اللهجات العربية المحلية، تقارير تطور الأداء الإدراكي للأهل، وتكامل مع مناهج رياض الأطفال
                  في العالم العربي (سوق يتجاوز ٤٥ مليون طفل في الفئة المستهدفة).
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-tactile mt-5 w-full h-12 rounded-2xl bg-[#2B2523] text-white font-extrabold text-sm border-b-4 border-black"
            >
              فهمت، العودة للتجربة
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
