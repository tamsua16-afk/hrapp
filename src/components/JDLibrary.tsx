import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Edit3, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export interface JDWeight {
  technical: number;
  experience: number;
  softSkills: number;
  education: number;
}

export interface JDPreset {
  id: string;
  title: string;
  description: string;
  weights: JDWeight;
  isCustom?: boolean;
}

interface JDLibraryProps {
  presets: JDPreset[];
  selectedPresetId: string | null;
  onSelectPreset: (preset: JDPreset) => void;
  onAddPreset: (preset: Omit<JDPreset, 'id' | 'isCustom'>) => void;
  onUpdatePreset: (id: string, updates: Partial<JDPreset>) => void;
  onDeletePreset: (id: string) => void;
}

const DEFAULT_WEIGHTS: JDWeight = {
  technical: 30,
  experience: 30,
  softSkills: 20,
  education: 20
};

export default function JDLibrary({
  presets,
  selectedPresetId,
  onSelectPreset,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset
}: JDLibraryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  
  // Forms state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weights, setWeights] = useState<JDWeight>({ ...DEFAULT_WEIGHTS });

  const totalWeight = weights.technical + weights.experience + weights.softSkills + weights.education;

  const handleWeightChange = (key: keyof JDWeight, val: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, val))
    }));
  };

  const handleSaveNew = () => {
    if (!title.trim() || !description.trim()) return;
    if (totalWeight !== 100) return;

    onAddPreset({
      title: title.trim(),
      description: description.trim(),
      weights
    });
    
    // Reset state
    setTitle('');
    setDescription('');
    setWeights({ ...DEFAULT_WEIGHTS });
    setIsAdding(false);
  };

  const handleStartEdit = (preset: JDPreset) => {
    setIsEditingId(preset.id);
    setTitle(preset.title);
    setDescription(preset.description);
    setWeights({ ...preset.weights });
  };

  const handleSaveEdit = (id: string) => {
    if (!title.trim() || !description.trim()) return;
    if (totalWeight !== 100) return;

    onUpdatePreset(id, {
      title: title.trim(),
      description: description.trim(),
      weights
    });

    setIsEditingId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditingId(null);
    setTitle('');
    setDescription('');
    setWeights({ ...DEFAULT_WEIGHTS });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar: JD presets list */}
      <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between max-h-[650px] overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Thư viện JD ({presets.length})
            </h3>
            {!isAdding && (
              <button
                onClick={() => { setIsAdding(true); setIsEditingId(null); setTitle(''); setDescription(''); setWeights({ ...DEFAULT_WEIGHTS }); }}
                className="p-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
                title="Tạo mới mẫu JD"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => !isEditingId && !isAdding && onSelectPreset(preset)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start group",
                  selectedPresetId === preset.id
                    ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-850"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-slate-200"
                )}
              >
                <div className="space-y-1 overflow-hidden pr-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{preset.title}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Trọng số: {preset.weights.technical}/{preset.weights.experience}/{preset.weights.softSkills}/{preset.weights.education}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  {preset.isCustom && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(preset); }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Panel: JD Details, Weights sliders or Edit Forms */}
      <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {isAdding || isEditingId ? (
          <div className="space-y-6">
            <h3 className="text-base font-display font-bold text-slate-800 dark:text-white">
              {isAdding ? "Tạo mẫu JD mới" : "Chỉnh sửa mẫu JD"}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tên vị trí</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Lập trình viên React Senior..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Mô tả công việc (JD)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập yêu cầu chuyên môn, số năm kinh nghiệm, học vấn và kỹ năng cần có..."
                  className="w-full h-44 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white resize-none"
                />
              </div>

              {/* Adjust Weights */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Cấu hình trọng số (Tổng phải bằng 100%)
                  </label>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-lg",
                    totalWeight === 100 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700 flex items-center gap-1"
                  )}>
                    {totalWeight !== 100 && <AlertCircle className="w-3 h-3" />}
                    Tổng cộng: {totalWeight}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'technical', label: 'Chuyên môn (Technical)' },
                    { key: 'experience', label: 'Kinh nghiệm (Experience)' },
                    { key: 'softSkills', label: 'Kỹ năng mềm (Soft Skills)' },
                    { key: 'education', label: 'Học vấn (Education)' }
                  ].map((item) => (
                    <div key={item.key} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span>{weights[item.key as keyof JDWeight]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={weights[item.key as keyof JDWeight]}
                        onChange={(e) => handleWeightChange(item.key as keyof JDWeight, parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Hủy bỏ
                </button>
                <button
                  onClick={() => isAdding ? handleSaveNew() : handleSaveEdit(isEditingId!)}
                  disabled={!title.trim() || !description.trim() || totalWeight !== 100}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Lưu lại
                </button>
              </div>
            </div>
          </div>
        ) : selectedPresetId ? (
          (() => {
            const preset = presets.find(p => p.id === selectedPresetId);
            if (!preset) return null;
            return (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">{preset.title}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">Cấu hình trọng số tuyển dụng</p>
                  </div>
                  {preset.isCustom && (
                    <button
                      onClick={() => handleStartEdit(preset)}
                      className="px-3.5 py-2 border border-slate-200 hover:border-indigo-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {/* Weights Grid Displays */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Chuyên môn', value: preset.weights.technical, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20' },
                    { label: 'Kinh nghiệm', value: preset.weights.experience, color: 'text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-950/20' },
                    { label: 'Kỹ năng mềm', value: preset.weights.softSkills, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20' },
                    { label: 'Học vấn', value: preset.weights.education, color: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20' }
                  ].map((item) => (
                    <div key={item.label} className={cn("p-4 rounded-2xl border text-center space-y-1", item.color)}>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{item.label}</span>
                      <h4 className="text-2xl font-display font-black">{item.value}%</h4>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Chi tiết mô tả công việc (JD)</label>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                    {preset.description}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-display font-bold text-slate-450 dark:text-slate-550">Chọn một mẫu JD để xem hoặc chỉnh sửa trọng số</h3>
          </div>
        )}
      </section>
    </div>
  );
}
