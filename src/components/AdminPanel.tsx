import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Download,
  Edit3,
  FolderPlus,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Trash2,
  Unlock,
  Upload,
  Volume2,
} from 'lucide-react';
import { AppSettings, Category, Item } from '../types';
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
  PersistedState,
} from '../db/storage';
import { generateItemRecognitionAudio, playBlobOrUrl } from '../utils/audio';
import { AudioRecorderControl } from './AudioRecorderControl';
import { MediaImage } from './MediaImage';

interface AdminPanelProps {
  categories: Category[];
  items: Item[];
  settings: AppSettings;
  stars: number;
  onUpdateCategories: (cats: Category[]) => Promise<void>;
  onUpdateItems: (items: Item[]) => Promise<void>;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  onImportAll: (state: PersistedState) => void;
  onResetDefaults: () => Promise<void>;
  onBack: () => void;
}

type AdminTab = 'items' | 'categories' | 'audio_backup';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  categories,
  items,
  settings,
  stars,
  onUpdateCategories,
  onUpdateItems,
  onUpdateSettings,
  onImportAll,
  onResetDefaults,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('items');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id ?? ''
  );
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(
    null
  );

  // Category Form State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catCover, setCatCover] = useState<string | Blob>('');
  const [catLocked, setCatLocked] = useState(false);

  // Item Form State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState<string | Blob>('');
  const [itemAudio, setItemAudio] = useState<Blob | string | null>(null);
  const [isDraggingItemImg, setIsDraggingItemImg] = useState(false);
  const [isGeneratingAiVoice, setIsGeneratingAiVoice] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const showStatus = (text: string, type: 'ok' | 'err' = 'ok') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  // --- Image helper (File -> DataURL or Blob; we store Blob directly in IndexedDB!) ---
  const handleImageFile = (
    file: File | undefined,
    setter: (val: string | Blob) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showStatus('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG).', 'err');
      return;
    }
    setter(file);
  };

  // --- Category CRUD ---
  const resetCatForm = () => {
    setEditingCatId(null);
    setCatTitle('');
    setCatCover('');
    setCatLocked(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = catTitle.trim();
    if (!cleanTitle) {
      showStatus('يرجى إدخال اسم الباب المعرفي.', 'err');
      return;
    }

    if (editingCatId) {
      const updated = categories.map((c) =>
        c.id === editingCatId
          ? {
              ...c,
              title: cleanTitle,
              coverImage: catCover || c.coverImage,
              isLocked: catLocked,
            }
          : c
      );
      await onUpdateCategories(updated);
      showStatus('تم تحديث الباب المعرفي بنجاح.');
      resetCatForm();
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        title: cleanTitle,
        coverImage: catCover || '',
        isLocked: catLocked,
        order: categories.length,
      };
      await onUpdateCategories([...categories, newCat]);
      setSelectedCategoryId(newCat.id);
      showStatus('تمت إضافة الباب المعرفي بنجاح.');
      resetCatForm();
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatTitle(cat.title);
    setCatCover(cat.coverImage);
    setCatLocked(cat.isLocked);
  };

  const handleDeleteCategory = async (catId: string) => {
    const remainingCats = categories.filter((c) => c.id !== catId);
    const remainingItems = items.filter((i) => i.categoryId !== catId);
    await onUpdateCategories(remainingCats);
    await onUpdateItems(remainingItems);
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(remainingCats[0]?.id ?? '');
    }
    showStatus('تم حذف الباب المعرفي وعناصره.');
  };

  const handleToggleLock = async (catId: string) => {
    const updated = categories.map((c) =>
      c.id === catId ? { ...c, isLocked: !c.isLocked } : c
    );
    await onUpdateCategories(updated);
  };

  // --- Item CRUD ---
  const resetItemForm = () => {
    setEditingItemId(null);
    setItemName('');
    setItemImage('');
    setItemAudio(null);
  };

  const activeCategoryId =
    categories.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : categories[0]?.id ?? '';

  const categoryItems = items.filter((i) => i.categoryId === activeCategoryId);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId) {
      showStatus('أضف باباً معرفياً أولاً.', 'err');
      return;
    }
    const cleanName = itemName.trim();
    if (!cleanName) {
      showStatus('يرجى إدخال اسم العنصر بالعربية.', 'err');
      return;
    }
    if (!itemImage && !editingItemId) {
      showStatus('يرجى رفع صورة للعنصر.', 'err');
      return;
    }

    if (editingItemId) {
      const updated = items.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              categoryId: activeCategoryId,
              name: cleanName,
              imageUrl: itemImage || item.imageUrl,
              audioBlobOrUrl: itemAudio,
            }
          : item
      );
      await onUpdateItems(updated);
      showStatus('تم تحديث البطاقة بنجاح.');
      resetItemForm();
    } else {
      const newItem: Item = {
        id: `item-${Date.now()}`,
        categoryId: activeCategoryId,
        name: cleanName,
        imageUrl: itemImage,
        audioBlobOrUrl: itemAudio,
      };
      await onUpdateItems([...items, newItem]);
      showStatus('تمت إضافة البطاقة وحفظها في IndexedDB.');
      resetItemForm();
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id);
    setSelectedCategoryId(item.categoryId);
    setItemName(item.name);
    setItemImage(item.imageUrl);
    setItemAudio(item.audioBlobOrUrl ?? null);
  };

  const handleDeleteItem = async (itemId: string) => {
    await onUpdateItems(items.filter((i) => i.id !== itemId));
    if (editingItemId === itemId) resetItemForm();
    showStatus('تم حذف البطاقة.');
  };

  const handleGenerateItemAiVoice = async () => {
    const cleanName = itemName.trim();
    if (!cleanName) {
      showStatus('اكتب اسم العنصر أولاً لتوليد الصوت التعريفي.', 'err');
      return;
    }
    setIsGeneratingAiVoice(true);
    try {
      const catTitle = categories.find((c) => c.id === activeCategoryId)?.title;
      const { blob, spokenText } = await generateItemRecognitionAudio(
        { name: cleanName, imageUrl: itemImage },
        catTitle
      );
      setItemAudio(blob);
      showStatus(`تم توليد الصوت: «${spokenText}»`);
      await playBlobOrUrl(blob, false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'تعذر توليد الصوت التعريفي.';
      showStatus(msg, 'err');
    } finally {
      setIsGeneratingAiVoice(false);
    }
  };

  // --- Export / Import JSON ---
  const handleExportJson = async () => {
    try {
      const jsonStr = await exportDatabaseToJson({
        categories,
        items,
        settings,
        stars,
      });
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `zakira-zakiya-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showStatus('تم تصدير النسخة الاحتياطية بنجاح.');
    } catch {
      showStatus('حدث خطأ أثناء تصدير البيانات.', 'err');
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const restored = await importDatabaseFromJson(text);
      onImportAll(restored);
      if (restored.categories[0]) {
        setSelectedCategoryId(restored.categories[0].id);
      }
      showStatus('تم استيراد النسخة الاحتياطية وتحديث المحتوى بنجاح.');
    } catch {
      showStatus('تعذر استيراد الملف. تأكد أنه ملف نسخة احتياطية صالح.', 'err');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDF8F5]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#EFE5DD] bg-[#FFFDFB] shrink-0">
        <button
          onClick={onBack}
          className="btn-tactile w-10 h-10 rounded-xl bg-[#FDF8F5] border-2 border-[#E9DFD7] border-b-4 flex items-center justify-center text-[#2B2523]"
          aria-label="العودة للواجهة الرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black text-[#2B2523]">لوحة تغذية المحتوى</h1>
          <p className="text-[11px] font-bold text-[#7A6F69]">
            تخزين محلي غير محدود (IndexedDB)
          </p>
        </div>

        <div className="w-10" />
      </header>

      {/* Segmented Tabs */}
      <div className="px-4 pt-3 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#EFE5DD]/70">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`h-9 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-white text-[#2B2523] shadow-xs'
                : 'text-[#6E635C] hover:text-[#2B2523]'
            }`}
          >
            البطاقات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`h-9 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-white text-[#2B2523] shadow-xs'
                : 'text-[#6E635C] hover:text-[#2B2523]'
            }`}
          >
            الأبواب
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio_backup')}
            className={`h-9 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'audio_backup'
                ? 'bg-white text-[#2B2523] shadow-xs'
                : 'text-[#6E635C] hover:text-[#2B2523]'
            }`}
          >
            التشجيع والنسخ
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusMsg && (
        <div className="px-4 pt-2.5 shrink-0">
          <div
            className={`rounded-xl px-3 py-2 text-xs font-extrabold text-center border ${
              statusMsg.type === 'ok'
                ? 'bg-[#E6FAF4] border-[#06D6A0] text-[#0D5B45]'
                : 'bg-[#FFF0EC] border-[#FF7A59] text-[#9E351B]'
            }`}
          >
            {statusMsg.text}
          </div>
        </div>
      )}

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-5">
        {activeTab === 'items' && (
          <>
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#5C534E]">
                اختر الباب المعرفي لإدارته:
              </label>
              <select
                value={activeCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  resetItemForm();
                }}
                className="w-full h-11 rounded-2xl bg-white border-2 border-[#E3D7CE] px-3 text-sm font-bold text-[#2B2523] focus:outline-none focus:border-[#4EA8DE]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title} ({items.filter((i) => i.categoryId === cat.id).length} عناصر)
                  </option>
                ))}
              </select>
            </div>

            {/* Add / Edit Item Form */}
            <form
              onSubmit={handleSaveItem}
              className="rounded-3xl bg-white border-2 border-[#E9DFD7] p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#2B2523]">
                  {editingItemId ? 'تعديل البطاقة' : 'إضافة بطاقة جديدة'}
                </h2>
                {editingItemId && (
                  <button
                    type="button"
                    onClick={resetItemForm}
                    className="text-xs font-bold text-[#7A6F69] hover:text-[#2B2523]"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E635C] mb-1">
                  اسم العنصر بالعربية
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="مثال: فراشة، قطار، أرنب..."
                  className="w-full h-11 rounded-xl border-2 border-[#E3D7CE] bg-[#FDF8F5] px-3 text-sm font-bold text-[#2B2523] focus:outline-none focus:border-[#4EA8DE]"
                />
              </div>

              {/* Drag & Drop / File Image Upload with Square Preview */}
              <div>
                <label className="block text-xs font-bold text-[#6E635C] mb-1">
                  صورة العنصر (PNG, JPG, WEBP, SVG)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingItemImg(true);
                  }}
                  onDragLeave={() => setIsDraggingItemImg(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingItemImg(false);
                    handleImageFile(e.dataTransfer.files?.[0], setItemImage);
                  }}
                  className={`rounded-2xl border-2 border-dashed p-3 flex items-center gap-3 transition-colors ${
                    isDraggingItemImg
                      ? 'border-[#4EA8DE] bg-[#EBF6FC]'
                      : 'border-[#D8CCC2] bg-[#FDF8F5]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#E6DCD3] overflow-hidden shrink-0 flex items-center justify-center">
                    {itemImage ? (
                      <MediaImage
                        src={itemImage}
                        alt="معاينة"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-[#A3968D]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="btn-tactile inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-[#DED2C8] border-b-[3px] text-xs font-extrabold text-[#2B2523] cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#4EA8DE]" />
                      <span>اختر صورة أو اسحبها هنا</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => handleImageFile(e.target.files?.[0], setItemImage)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-[#7A6F69] mt-1">
                      تُحفظ الصور عالية الجودة مباشرة في IndexedDB
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Upload OR Live Mic Recording + AI Voice Generation */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateItemAiVoice}
                  disabled={isGeneratingAiVoice}
                  className="btn-tactile w-full h-10 rounded-2xl bg-[#EBF6FC] text-[#1D5B7F] border-2 border-[#BCE3FA] border-b-4 text-xs font-extrabold flex items-center justify-center gap-2 hover:brightness-98 disabled:opacity-60"
                >
                  {isGeneratingAiVoice ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span>
                    {isGeneratingAiVoice
                      ? 'جاري توليد الصوت التعريفي...'
                      : 'توليد صوت تعريفي للصورة بالذكاء الاصطناعي'}
                  </span>
                </button>

                <AudioRecorderControl
                  label="صوت نطق العنصر"
                  value={itemAudio}
                  onChange={setItemAudio}
                />
              </div>

              <button
                type="submit"
                className="btn-tactile w-full h-11 rounded-2xl bg-[#06D6A0] text-[#113D31] font-black text-sm border-b-4 border-[#04A77D] flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingItemId ? 'حفظ التعديلات' : 'إضافة البطاقة'}</span>
              </button>
            </form>

            {/* Existing Items List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold text-[#6E635C]">
                البطاقات الحالية في هذا الباب ({categoryItems.length})
              </h3>
              {categoryItems.length === 0 ? (
                <p className="rounded-2xl bg-white/70 border border-[#E9DFD7] p-4 text-center text-xs font-bold text-[#7A6F69]">
                  لا توجد بطاقات في هذا الباب بعد. أضف أول بطاقة من النموذج أعلاه.
                </p>
              ) : (
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white border border-[#E9DFD7] p-2.5 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#FDF8F5] border border-[#EFE5DD] overflow-hidden shrink-0">
                          <MediaImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#2B2523] truncate">{item.name}</p>
                          <p className="text-[11px] font-bold text-[#7A6F69]">
                            {item.audioBlobOrUrl ? '🎙️ صوت مخصص' : '🗣️ نطق عربي تلقائي'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          className="w-9 h-9 rounded-xl bg-[#FDF8F5] border border-[#E6DCD3] text-[#4EA8DE] flex items-center justify-center hover:bg-[#EBF6FC]"
                          aria-label={`تعديل ${item.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-9 h-9 rounded-xl bg-[#FDF8F5] border border-[#E6DCD3] text-[#D95738] flex items-center justify-center hover:bg-[#FFF0EC]"
                          aria-label={`حذف ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            {/* Add / Edit Category Form */}
            <form
              onSubmit={handleSaveCategory}
              className="rounded-3xl bg-white border-2 border-[#E9DFD7] p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#2B2523]">
                  {editingCatId ? 'تعديل الباب المعرفي' : 'إضافة باب معرفي جديد'}
                </h2>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={resetCatForm}
                    className="text-xs font-bold text-[#7A6F69] hover:text-[#2B2523]"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E635C] mb-1">
                  عنوان الباب المعرفي
                </label>
                <input
                  type="text"
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  placeholder="مثال: باب الألوان، باب الحروف..."
                  className="w-full h-11 rounded-xl border-2 border-[#E3D7CE] bg-[#FDF8F5] px-3 text-sm font-bold text-[#2B2523] focus:outline-none focus:border-[#4EA8DE]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-xl bg-[#FDF8F5] border border-[#E6DCD3] overflow-hidden shrink-0 flex items-center justify-center">
                  {catCover ? (
                    <MediaImage
                      src={catCover}
                      alt="غلاف"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="w-5 h-5 text-[#A3968D]" />
                  )}
                </div>

                <label className="btn-tactile flex-1 h-10 px-3 rounded-xl bg-[#FDF8F5] border border-[#DED2C8] border-b-[3px] text-xs font-extrabold text-[#2B2523] flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#4EA8DE]" />
                  <span>رفع صورة غلاف للباب</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => handleImageFile(e.target.files?.[0], setCatCover)}
                    className="hidden"
                  />
                </label>
              </div>

              <label className="flex items-center justify-between rounded-2xl bg-[#FDF8F5] border border-[#E6DCD3] px-3.5 py-2.5 cursor-pointer">
                <div>
                  <p className="text-xs font-extrabold text-[#2B2523]">حالة القفل (باقة الأسرة)</p>
                  <p className="text-[11px] text-[#7A6F69]">
                    {catLocked ? 'مقفل (يظهر ضمن باقة الأسرة 🔒)' : 'مفتوح مجاناً لجميع الأطفال'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={catLocked}
                  onChange={(e) => setCatLocked(e.target.checked)}
                  className="w-5 h-5 accent-[#FF7A59]"
                />
              </label>

              <button
                type="submit"
                className="btn-tactile w-full h-11 rounded-2xl bg-[#4EA8DE] text-white font-black text-sm border-b-4 border-[#2E86BE] flex items-center justify-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{editingCatId ? 'تحديث الباب' : 'إضافة الباب'}</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-[#6E635C]">
                الأبواب المعرفية ({categories.length})
              </h3>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl bg-white border border-[#E9DFD7] p-2.5 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-14 h-11 rounded-xl bg-[#FDF8F5] border border-[#EFE5DD] overflow-hidden shrink-0">
                      <MediaImage
                        src={cat.coverImage}
                        alt={cat.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#2B2523] truncate">{cat.title}</p>
                      <p className="text-[11px] font-bold text-[#7A6F69]">
                        {cat.isLocked ? 'مقفل (باقة الأسرة)' : 'مفتوح مجاناً'} ·{' '}
                        {items.filter((i) => i.categoryId === cat.id).length} عناصر
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(cat.id)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                        cat.isLocked
                          ? 'bg-[#FFF7DC] border-[#FFD166] text-[#B87D00]'
                          : 'bg-[#E6FAF4] border-[#06D6A0] text-[#0D5B45]'
                      }`}
                      aria-label="تبديل حالة القفل"
                      title={cat.isLocked ? 'فتح الباب' : 'قفل الباب'}
                    >
                      {cat.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCategory(cat)}
                      className="w-9 h-9 rounded-xl bg-[#FDF8F5] border border-[#E6DCD3] text-[#4EA8DE] flex items-center justify-center"
                      aria-label={`تعديل ${cat.title}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="w-9 h-9 rounded-xl bg-[#FDF8F5] border border-[#E6DCD3] text-[#D95738] flex items-center justify-center"
                      aria-label={`حذف ${cat.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'audio_backup' && (
          <div className="space-y-4">
            {/* Custom Encouragement Audio */}
            <div className="rounded-3xl bg-white border-2 border-[#E9DFD7] p-4 space-y-3">
              <div>
                <h2 className="text-sm font-black text-[#2B2523]">أصوات التشجيع المخصصة</h2>
                <p className="text-xs text-[#7A6F69] mt-0.5">
                  سجّل بصوتك أو ارفع ملفاً صوتياً لتشجيع الطفل أثناء اللعب
                </p>
              </div>

              <AudioRecorderControl
                label="صوت الفوز (مثال: برافو شاطر!)"
                value={settings.winAudioBlob}
                onChange={(val) => onUpdateSettings({ ...settings, winAudioBlob: val })}
                fallbackHint="التلقائي: نغمة فوز + برافو"
              />

              <AudioRecorderControl
                label="صوت المحاولة مرة أخرى"
                value={settings.retryAudioBlob}
                onChange={(val) => onUpdateSettings({ ...settings, retryAudioBlob: val })}
                fallbackHint="التلقائي: جرب تاني بلطف"
              />

              <AudioRecorderControl
                label="صوت تنبيه الهدف (اختياري)"
                value={settings.targetPromptAudioBlob}
                onChange={(val) =>
                  onUpdateSettings({ ...settings, targetPromptAudioBlob: val })
                }
                fallbackHint="التلقائي: ركز كويس مع [اسم العنصر]"
              />
            </div>

            {/* Portability: Export / Import JSON */}
            <div className="rounded-3xl bg-white border-2 border-[#E9DFD7] p-4 space-y-3">
              <div>
                <h2 className="text-sm font-black text-[#2B2523]">
                  نقل المحتوى والنسخ الاحتياطي (JSON)
                </h2>
                <p className="text-xs text-[#7A6F69] mt-0.5">
                  صدّر كل الأبواب والصور والتسجيلات الصوتية في ملف واحد لنقله إلى أي جهاز قبل العرض
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJson}
                className="btn-tactile w-full h-11 rounded-2xl bg-[#4EA8DE] text-white font-black text-sm border-b-4 border-[#2E86BE] flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تصدير نسخة احتياطية (Export JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => jsonImportRef.current?.click()}
                className="btn-tactile w-full h-11 rounded-2xl bg-[#FFD166] text-[#2B2523] font-black text-sm border-b-4 border-[#DFAD3B] flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>استيراد بيانات (Import JSON)</span>
              </button>

              <input
                ref={jsonImportRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="hidden"
              />

              <div className="pt-2 border-t border-[#EFE5DD]">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full h-10 rounded-xl text-xs font-extrabold text-[#D95738] hover:bg-[#FFF0EC] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة المحتوى الافتراضي للعرض</span>
                  </button>
                ) : (
                  <div className="rounded-2xl bg-[#FFF0EC] border border-[#FF7A59] p-3 text-center space-y-2">
                    <p className="text-xs font-extrabold text-[#9E351B]">
                      هل تريد مسح التعديلات الحالية واستعادة البيانات الافتراضية؟
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await onResetDefaults();
                          setConfirmReset(false);
                          showStatus('تمت استعادة المحتوى الافتراضي بنجاح.');
                        }}
                        className="flex-1 h-9 rounded-xl bg-[#D95738] text-white text-xs font-black"
                      >
                        نعم، استعادة
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 h-9 rounded-xl bg-white text-[#2B2523] text-xs font-bold border border-[#E6DCD3]"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
