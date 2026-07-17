import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Bookmark,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: 'technical' | 'softskills' | 'culture' | 'guideline' | 'other';
  content: string;
  isActive: boolean;
  updatedAt: string;
}

interface KnowledgeBaseProps {
  docs: KnowledgeDoc[];
  onAddDoc: (doc: Omit<KnowledgeDoc, 'id' | 'updatedAt'>) => void;
  onUpdateDoc: (id: string, updates: Partial<KnowledgeDoc>) => void;
  onDeleteDoc: (id: string) => void;
}

const CATEGORY_LABELS = {
  technical: { label: 'Chuyên môn & Kỹ thuật', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  softskills: { label: 'Kỹ năng mềm', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  culture: { label: 'Văn hóa & Phù hợp', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  guideline: { label: 'Quy trình & Quy chế', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  other: { label: 'Khác', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' }
};

export default function KnowledgeBase({
  docs,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc
}: KnowledgeBaseProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<KnowledgeDoc['category']>('technical');
  const [content, setContent] = useState('');

  const handleSaveNew = () => {
    if (!title.trim() || !content.trim()) return;
    onAddDoc({
      title: title.trim(),
      category,
      content: content.trim(),
      isActive: true
    });
    // Reset form
    setTitle('');
    setCategory('technical');
    setContent('');
    setIsAdding(false);
  };

  const handleStartEdit = (doc: KnowledgeDoc) => {
    setEditingId(doc.id);
    setTitle(doc.title);
    setCategory(doc.category);
    setContent(doc.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!title.trim() || !content.trim()) return;
    onUpdateDoc(id, {
      title: title.trim(),
      category,
      content: content.trim()
    });
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const filteredDocs = docs.filter(doc => selectedCategory === 'all' || doc.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            Thư viện Kiến thức (Knowledge Base)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý các tài liệu tham khảo, tiêu chuẩn chuyên môn và quy chế nội bộ giúp AI đánh giá CV chính xác hơn.
          </p>
        </div>
        {!isAdding && !editingId && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Thêm tài liệu mới
          </motion.button>
        )}
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 text-blue-600 dark:text-blue-400 flex gap-3 text-sm">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">AI sẽ tích hợp các tài liệu được kích hoạt vào quá trình đánh giá.</p>
          <p className="opacity-90 mt-0.5">Khi bạn tải lên CV hoặc trò chuyện với Copilot, hệ thống sẽ tự động ghép các tài liệu kiến thức đang <span className="font-bold underline">kích hoạt (Active)</span> vào ngữ cảnh xử lý của Gemini API.</p>
        </div>
      </div>

      {/* Adding / Editing Modal Panel */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-3xl shadow-xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                {isAdding ? 'Tạo tài liệu kiến thức mới' : 'Chỉnh sửa tài liệu kiến thức'}
              </h3>
              <button 
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Tiêu đề tài liệu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiêu chuẩn đánh giá Lập trình viên ReactJS..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as KnowledgeDoc['category'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="technical">Chuyên môn & Kỹ thuật</option>
                  <option value="softskills">Kỹ năng mềm</option>
                  <option value="culture">Văn hóa & Phù hợp</option>
                  <option value="guideline">Quy trình & Quy chế</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Nội dung tài liệu (Markdown hoặc văn bản thô)</label>
              <textarea
                rows={10}
                placeholder="Nhập chi tiết các tiêu chuẩn đánh giá, câu hỏi gợi ý, từ khóa chuyên môn, hoặc quy chế cụ thể của công ty ở đây..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 font-medium cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => isAdding ? handleSaveNew() : handleSaveEdit(editingId!)}
                disabled={!title.trim() || !content.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lưu tài liệu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
            selectedCategory === 'all' 
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm" 
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-950"
          )}
        >
          Tất cả tài liệu
        </button>
        {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
          <button
            key={catKey}
            onClick={() => setSelectedCategory(catKey)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              selectedCategory === catKey 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-950"
            )}
          >
            {info.label}
          </button>
        ))}
      </div>

      {/* Documents list */}
      <div className="grid grid-cols-1 gap-6">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm">
            <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-4">Chưa có tài liệu nào</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Bắt đầu bằng cách tạo tài liệu kiến thức chuyên môn đầu tiên của bạn.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              className={cn(
                "p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 shadow-sm relative overflow-hidden group",
                doc.isActive 
                  ? "border-indigo-500/30 dark:border-indigo-500/20 ring-1 ring-indigo-500/10" 
                  : "border-slate-200/60 dark:border-slate-800/80 opacity-75 hover:opacity-100"
              )}
            >
              {/* Active Indicator overlay gradient */}
              {doc.isActive && (
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {doc.title}
                    </h3>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", CATEGORY_LABELS[doc.category]?.color)}>
                      {CATEGORY_LABELS[doc.category]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Cập nhật cuối cùng: {new Date(doc.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Active Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {doc.isActive ? 'Đang kích hoạt' : 'Vô hiệu hóa'}
                    </span>
                    <button
                      onClick={() => onUpdateDoc(doc.id, { isActive: !doc.isActive })}
                      className={cn(
                        "w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer",
                        doc.isActive ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                      )}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-sm"
                        animate={{ x: doc.isActive ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2 border-l border-slate-100 dark:border-slate-800 pl-3">
                    <button
                      onClick={() => handleStartEdit(doc)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteDoc(doc.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Doc Content Preview */}
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {doc.content}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
