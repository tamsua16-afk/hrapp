import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Users, 
  Briefcase, 
  ChevronRight, 
  Star, 
  BrainCircuit,
  Loader2,
  X,
  ArrowLeft,
  MessageSquareQuote,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Plus,
  Trash2,
  Clock,
  ClipboardCheck,
  StickyNote,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { screenCV, ScreeningResult } from './lib/gemini';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const JOB_PRESETS = [
  {
    title: "Kinh doanh BĐS (Cho thuê)",
    description: "Yêu cầu: Có kỹ năng giao tiếp, đàm phán tốt. Am hiểu thị trường bất động sản cho thuê, văn phòng. Khả năng tìm kiếm khách hàng tiềm năng, tư vấn mặt bằng và chốt hợp đồng. Ưu tiên ứng viên có kinh nghiệm làm việc với các đơn vị đại lý hoặc quản lý tài sản."
  },
  {
    title: "Quản lý Vận hành Tòa nhà",
    description: "Yêu cầu: Kinh nghiệm quản lý vận hành tòa nhà, chung cư hoặc trung tâm thương mại. Hiểu biết về hệ thống kỹ thuật (M&E), an ninh, vệ sinh. Khả năng điều phối nhà thầu, xử lý sự cố và làm việc với cư dân/khách thuê. Có chứng chỉ quản lý vận hành là một lợi thế."
  },
  {
    title: "Giám sát Sản xuất",
    description: "Yêu cầu: Tốt nghiệp đại học chuyên ngành kỹ thuật hoặc quản lý công nghiệp. Có kinh nghiệm giám sát dây chuyền sản xuất, quản lý công nhân. Am hiểu về tiêu chuẩn chất lượng (ISO, 5S, Kaizen). Khả năng lập kế hoạch sản xuất và tối ưu hóa quy trình để giảm thiểu lãng phí."
  },
  {
    title: "Nhân viên Thu mua",
    description: "Yêu cầu: Kinh nghiệm tìm kiếm và đánh giá nhà cung cấp (đặc biệt là nguyên vật liệu sản xuất). Kỹ năng đàm phán giá, quản lý đơn hàng và theo dõi tiến độ giao hàng. Sử dụng thành thạo phần mềm ERP/SAP. Tiếng Anh giao tiếp tốt là một điểm cộng."
  },
  {
    title: "Kế toán Tổng hợp",
    description: "Yêu cầu: Nắm vững chuẩn mực kế toán và các quy định về thuế hiện hành. Có kinh nghiệm quyết toán thuế, lập báo cáo tài chính. Khả năng kiểm soát chi phí sản xuất và dòng tiền. Sử dụng thành thạo các phần mềm kế toán (Misa, Bravo...)."
  },
  {
    title: "Hành chính Nhân sự",
    description: "Yêu cầu: Kinh nghiệm tuyển dụng, đào tạo và quản lý hồ sơ nhân sự. Am hiểu Luật Lao động, BHXH. Khả năng tổ chức các hoạt động nội bộ, quản lý tài sản văn phòng và hỗ trợ các phòng ban khác. Kỹ năng giao tiếp và giải quyết vấn đề tốt."
  }
];

interface Candidate {
  id: string;
  name: string;
  fileName: string;
  result?: ScreeningResult;
  status: 'idle' | 'processing' | 'completed' | 'error';
  customQuestions: string[];
  file: File;
  group: string;
  isTransferred?: boolean;
  interviewData?: {
    scorecard: {
      technical: number;
      softSkills: number;
      culturalFit: number;
    };
    notes: string;
    checkedQuestions: string[];
    startTime: number | null;
    finalDecision: 'recommend' | 'consider' | 'reject' | null;
    decisionReason: string;
  };
  errorMessage?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'hr' | 'manager'>('hr');
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [customPresets, setCustomPresets] = useState<{title: string, description: string}[]>([]);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [currentRoleTitle, setCurrentRoleTitle] = useState('Chưa phân loại');

  const handleSelectPreset = (title: string, description: string) => {
    setJd(description);
    setCurrentRoleTitle(title);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newCandidates = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      status: 'idle' as const,
      file: file,
      customQuestions: [],
      group: currentRoleTitle
    }));
    setCandidates(prev => [...prev, ...newCandidates]);
  }, [currentRoleTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  } as any);

  const extractText = async (file: File): Promise<string> => {
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    }
    
    return "";
  };

  const processCandidate = async (candidate: Candidate) => {
    if (!jd.trim()) return;

    setCandidates(prev => prev.map(c => 
      c.id === candidate.id ? { ...c, status: 'processing' } : c
    ));

    try {
      const cvText = await extractText(candidate.file);
      const result = await screenCV(jd, cvText);
      
      setCandidates(prev => prev.map(c => 
        c.id === candidate.id ? { ...c, status: 'completed', result } : c
      ));
    } catch (error: any) {
      console.error('Error processing candidate:', error);
      setCandidates(prev => prev.map(c => 
        c.id === candidate.id ? { ...c, status: 'error', errorMessage: error?.message || 'Có lỗi xảy ra' } : c
      ));
    }
  };

  const handleProcessAll = async () => {
    if (!jd.trim() || candidates.length === 0) return;
    setIsProcessingAll(true);
    
    for (const candidate of candidates) {
      if (candidate.status !== 'completed') {
        await processCandidate(candidate);
      }
    }
    
    setIsProcessingAll(false);
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    if (selectedCandidateId === id) setSelectedCandidateId(null);
  };

  const addCustomQuestion = () => {
    if (!newQuestion.trim() || !selectedCandidateId) return;
    setCandidates(prev => prev.map(c => 
      c.id === selectedCandidateId 
        ? { ...c, customQuestions: [...c.customQuestions, newQuestion.trim()] } 
        : c
    ));
    setNewQuestion('');
  };

  const removeCustomQuestion = (index: number) => {
    if (!selectedCandidateId) return;
    setCandidates(prev => prev.map(c => 
      c.id === selectedCandidateId 
        ? { ...c, customQuestions: c.customQuestions.filter((_, i) => i !== index) } 
        : c
    ));
  };

  const addCustomPreset = () => {
    if (!newPresetTitle.trim()) {
      setIsAddingPreset(false);
      return;
    }
    const newPreset = {
      title: newPresetTitle.trim(),
      description: jd.trim() || `Yêu cầu cho vị trí ${newPresetTitle.trim()}...`
    };
    setCustomPresets(prev => [...prev, newPreset]);
    handleSelectPreset(newPreset.title, newPreset.description);
    setNewPresetTitle('');
    setIsAddingPreset(false);
  };

  const removeCustomPreset = (index: number) => {
    setCustomPresets(prev => prev.filter((_, i) => i !== index));
  };

  const transferToManager = (id: string) => {
    setCandidates(prev => prev.map(c => 
      c.id === id ? { 
        ...c, 
        isTransferred: true,
        interviewData: {
          scorecard: { technical: 0, softSkills: 0, culturalFit: 0 },
          notes: '',
          checkedQuestions: [],
          startTime: null,
          finalDecision: null,
          decisionReason: ''
        }
      } : c
    ));
  };

  const updateInterviewData = (id: string, data: Partial<Candidate['interviewData']>) => {
    setCandidates(prev => prev.map(c => 
      c.id === id ? { ...c, interviewData: { ...c.interviewData!, ...data } } : c
    ));
  };

  const toggleQuestionCheck = (candidateId: string, question: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id !== candidateId || !c.interviewData) return c;
      const checked = c.interviewData.checkedQuestions.includes(question)
        ? c.interviewData.checkedQuestions.filter(q => q !== question)
        : [...c.interviewData.checkedQuestions, question];
      return { ...c, interviewData: { ...c.interviewData, checkedQuestions: checked } };
    }));
  };

  const startInterview = (id: string) => {
    updateInterviewData(id, { startTime: Date.now() });
  };

  const InterviewTimer = ({ startTime }: { startTime: number | null }) => {
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
      if (!startTime) return;
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime) return null;

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-mono text-sm font-bold">
        <Timer className="w-4 h-4" />
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    );
  };

  const filteredCandidates = candidates.filter(c => 
    selectedGroup === 'all' || c.group === selectedGroup
  );

  const groups = Array.from(new Set(candidates.map(c => c.group)));

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">
              AI CV Screener
            </h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('hr')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                activeTab === 'hr' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="w-4 h-4" />
              HR Dashboard
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                activeTab === 'manager' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Quản lý / Phỏng vấn
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 font-medium text-sm">
              Hướng dẫn
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              HR
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'hr' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* JD Input */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-display font-semibold text-slate-900">Mô tả công việc (JD)</h2>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <LayoutGrid className="w-3 h-3" />
                    Mẫu nhanh
                  </div>
                </div>

                {/* Job Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {JOB_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      onClick={() => handleSelectPreset(preset.title, preset.description)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        jd === preset.description
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                      )}
                    >
                      {preset.title}
                    </button>
                  ))}
                  
                  {customPresets.map((preset, idx) => (
                    <div key={`custom-preset-${idx}`} className="relative group">
                      <button
                        onClick={() => handleSelectPreset(preset.title, preset.description)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border pr-6",
                          jd === preset.description
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                        )}
                      >
                        {preset.title}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeCustomPreset(idx); }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition-all"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {isAddingPreset ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={newPresetTitle}
                        onChange={(e) => setNewPresetTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomPreset()}
                        onBlur={addCustomPreset}
                        placeholder="Tên vị trí..."
                        className="px-2 py-1.5 rounded-lg text-xs border border-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none w-24"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingPreset(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-dashed border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Khác
                    </button>
                  )}
                </div>

                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Chọn một vị trí mẫu ở trên hoặc dán mô tả công việc tại đây..."
                  className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                />
              </section>

              {/* Upload Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-display font-semibold text-slate-900">Tải lên CV Ứng viên</h2>
                </div>
                
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer h-[calc(100%-40px)] flex flex-col justify-center",
                    isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    Kéo thả CV vào đây hoặc click để chọn
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ PDF, DOCX, TXT (Tối đa 10MB)
                  </p>
                </div>
              </section>
            </div>

            {/* Group Filter */}
            {candidates.length > 0 && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <LayoutGrid className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-bold text-slate-600">Phân loại theo nhóm:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGroup('all')}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                      selectedGroup === 'all' 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                        : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                    )}
                  >
                    Tất cả ({candidates.length})
                  </button>
                  {groups.map(group => (
                    <button
                      key={group}
                      onClick={() => setSelectedGroup(group)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                        selectedGroup === group 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                          : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {group} ({candidates.filter(c => c.group === group).length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Candidates Table */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  Bảng xếp loại ứng viên ({filteredCandidates.length})
                </h2>
                <button 
                  onClick={handleProcessAll}
                  disabled={!jd.trim() || isProcessingAll || candidates.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {isProcessingAll ? 'Đang xử lý...' : 'Phân tích hàng loạt'}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ứng viên</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nhóm / Vị trí</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kết quả PV</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Match</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Đánh giá</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                          Không tìm thấy ứng viên nào trong nhóm này.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c) => (
                        <tr 
                          key={c.id} 
                          className={cn(
                            "hover:bg-slate-50 transition-all cursor-pointer group",
                            selectedCandidateId === c.id ? "bg-indigo-50/50" : ""
                          )}
                          onClick={() => setSelectedCandidateId(c.id)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                <p className="text-[10px] text-slate-500">{c.fileName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                              {c.group}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {c.status === 'completed' ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                                </span>
                              ) : c.status === 'processing' ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý
                                </span>
                              ) : c.status === 'error' ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                                  <FileText className="w-3.5 h-3.5" /> Chờ xử lý
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {c.interviewData?.finalDecision ? (
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                c.interviewData.finalDecision === 'recommend' ? "bg-green-100 text-green-700" :
                                c.interviewData.finalDecision === 'consider' ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {c.interviewData.finalDecision === 'recommend' && <ThumbsUp className="w-3 h-3" />}
                                {c.interviewData.finalDecision === 'consider' && <Search className="w-3 h-3" />}
                                {c.interviewData.finalDecision === 'reject' && <ThumbsDown className="w-3 h-3" />}
                                {c.interviewData.finalDecision === 'recommend' ? 'Đề xuất tuyển' :
                                 c.interviewData.finalDecision === 'consider' ? 'Cân nhắc' : 'Từ chối'}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase italic">Chưa có kết quả</span>
                            )}
                          </td>
                          <td className="p-4">
                            {c.result ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full transition-all duration-1000",
                                      c.result.score >= 80 ? "bg-green-500" :
                                      c.result.score >= 60 ? "bg-amber-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${c.result.score}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{c.result.score}%</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-4">
                            {c.result ? (
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                                c.result.recommendation === 'Strong Hire' ? "bg-green-100 text-green-700" :
                                c.result.recommendation === 'Hire' ? "bg-blue-100 text-blue-700" :
                                c.result.recommendation === 'Maybe' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              )}>
                                {c.result.recommendation}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {c.status === 'completed' && !c.isTransferred && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); transferToManager(c.id); }}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                                  title="Chuyển cho quản lý"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                              {c.isTransferred && (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Đã chuyển</span>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeCandidate(c.id); }}
                                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Manager View: Left Sidebar (Transferred Only) */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Ứng viên chờ phỏng vấn
                  </h2>
                  <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full">
                    {candidates.filter(c => c.isTransferred).length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {candidates.filter(c => c.isTransferred).length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Chưa có ứng viên nào được chuyển qua.</p>
                    </div>
                  ) : (
                    candidates.filter(c => c.isTransferred).map((c) => (
                      <div 
                        key={c.id}
                        onClick={() => setSelectedCandidateId(c.id)}
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                          selectedCandidateId === c.id 
                            ? "bg-indigo-50 border-indigo-200" 
                            : "bg-white border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-indigo-600">{c.result?.score}% Match</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-all",
                          selectedCandidateId === c.id ? "text-indigo-600 translate-x-1" : "text-slate-300"
                        )} />
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Manager View: Right Content */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedCandidate && selectedCandidate.isTransferred ? (
                  <motion.div
                    key={selectedCandidate.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Header with Timer and Quick View CV */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                          {selectedCandidate.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-lg font-display font-bold text-slate-900">{selectedCandidate.name}</h2>
                          <p className="text-xs text-slate-500">{selectedCandidate.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <InterviewTimer startTime={selectedCandidate.interviewData?.startTime || null} />
                        {!selectedCandidate.interviewData?.startTime && (
                          <button 
                            onClick={() => startInterview(selectedCandidate.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            Bắt đầu phỏng vấn
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            const url = URL.createObjectURL(selectedCandidate.file);
                            window.open(url, '_blank');
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Xem CV gốc
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Scorecard Section */}
                      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-display font-semibold text-slate-900">Bảng điểm phỏng vấn</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {[
                            { key: 'technical', label: 'Kỹ năng chuyên môn' },
                            { key: 'softSkills', label: 'Kỹ năng mềm' },
                            { key: 'culturalFit', label: 'Sự phù hợp văn hóa' }
                          ].map((item) => (
                            <div key={item.key} className="space-y-2">
                              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>{item.label}</span>
                                <span>{selectedCandidate.interviewData?.scorecard[item.key as keyof typeof selectedCandidate.interviewData.scorecard]}/5</span>
                              </div>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((score) => (
                                  <button
                                    key={score}
                                    onClick={() => updateInterviewData(selectedCandidate.id, {
                                      scorecard: { ...selectedCandidate.interviewData!.scorecard, [item.key]: score }
                                    })}
                                    className={cn(
                                      "flex-1 h-8 rounded-lg text-xs font-bold transition-all",
                                      selectedCandidate.interviewData?.scorecard[item.key as keyof typeof selectedCandidate.interviewData.scorecard] === score
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Notes Section */}
                      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <StickyNote className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-display font-semibold text-slate-900">Ghi chú phỏng vấn</h3>
                        </div>
                        <textarea
                          value={selectedCandidate.interviewData?.notes}
                          onChange={(e) => updateInterviewData(selectedCandidate.id, { notes: e.target.value })}
                          placeholder="Nhập nhận xét nhanh về ứng viên..."
                          className="flex-1 w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                        />
                      </section>
                    </div>

                    {/* Questions Checklist */}
                    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-display font-semibold text-slate-900">Checklist câu hỏi phỏng vấn</h3>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          Đã hỏi: {selectedCandidate.interviewData?.checkedQuestions.length} / {(selectedCandidate.result?.interviewQuestions.length || 0) + selectedCandidate.customQuestions.length}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {[...(selectedCandidate.result?.interviewQuestions || []), ...selectedCandidate.customQuestions].map((q, i) => (
                          <div 
                            key={i} 
                            onClick={() => toggleQuestionCheck(selectedCandidate.id, q)}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                              selectedCandidate.interviewData?.checkedQuestions.includes(q)
                                ? "bg-green-50 border-green-100 opacity-60"
                                : "bg-white border-slate-100 hover:border-indigo-200"
                            )}
                          >
                            <div className={cn(
                              "mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all",
                              selectedCandidate.interviewData?.checkedQuestions.includes(q)
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-slate-300 bg-white"
                            )}>
                              {selectedCandidate.interviewData?.checkedQuestions.includes(q) && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <p className={cn(
                              "text-sm font-medium leading-relaxed",
                              selectedCandidate.interviewData?.checkedQuestions.includes(q) ? "text-green-800 line-through" : "text-slate-700"
                            )}>
                              {q}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Final Decision Section */}
                    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-display font-semibold text-slate-900">Quyết định cuối cùng</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[
                          { key: 'recommend', label: 'Đề xuất tuyển', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-600' },
                          { key: 'consider', label: 'Cân nhắc thêm', icon: Search, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-600' },
                          { key: 'reject', label: 'Từ chối', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', activeBg: 'bg-red-600' }
                        ].map((decision) => (
                          <button
                            key={decision.key}
                            onClick={() => updateInterviewData(selectedCandidate.id, { finalDecision: decision.key as any })}
                            className={cn(
                              "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                              selectedCandidate.interviewData?.finalDecision === decision.key
                                ? `${decision.activeBg} text-white border-transparent shadow-lg`
                                : `${decision.bg} ${decision.color} ${decision.border} hover:scale-[1.02]`
                            )}
                          >
                            <decision.icon className="w-6 h-6" />
                            <span className="text-sm font-bold">{decision.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Lý do quyết định</label>
                        <textarea
                          value={selectedCandidate.interviewData?.decisionReason}
                          onChange={(e) => updateInterviewData(selectedCandidate.id, { decisionReason: e.target.value })}
                          placeholder="Nhập lý do cụ thể cho quyết định này..."
                          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm h-24"
                        />
                      </div>
                    </section>
                  </motion.div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Users className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-display font-bold text-slate-400">Chọn ứng viên để xem chi tiết phỏng vấn</h3>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Candidate Detail Modal (for HR Tab) */}
        <AnimatePresence>
          {activeTab === 'hr' && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCandidateId(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedCandidateId(null)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-display font-bold text-slate-900">Chi tiết ứng viên: {selectedCandidate.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCandidate.status === 'completed' && !selectedCandidate.isTransferred && (
                      <button 
                        onClick={() => transferToManager(selectedCandidate.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4" />
                        Chuyển cho Quản lý
                      </button>
                    )}
                    {selectedCandidate.isTransferred && (
                      <span className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã chuyển
                      </span>
                    )}
                    <button 
                      onClick={() => setSelectedCandidateId(null)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                  {selectedCandidate.status === 'completed' && selectedCandidate.result ? (
                    <div className="space-y-8">
                      {/* Score & Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center">
                          <div className="text-5xl font-display font-bold mb-1">{selectedCandidate.result.score}%</div>
                          <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">Match Score</div>
                          <div className="mt-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">
                            {selectedCandidate.result.recommendation}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tóm tắt đánh giá</h3>
                          <p className="text-slate-600 leading-relaxed italic">"{selectedCandidate.result.summary}"</p>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Ưu điểm
                          </h3>
                          <ul className="space-y-3">
                            {selectedCandidate.result.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-green-50/50 p-3 rounded-xl border border-green-100">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" /> Điểm yếu
                          </h3>
                          <ul className="space-y-3">
                            {selectedCandidate.result.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                          <MessageSquareQuote className="w-4 h-4" /> Câu hỏi phỏng vấn gợi ý
                        </h3>
                        
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomQuestion()}
                            placeholder="Thêm câu hỏi phỏng vấn tùy chỉnh..."
                            className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                          />
                          <button
                            onClick={addCustomQuestion}
                            disabled={!newQuestion.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                          >
                            Thêm
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {selectedCandidate.customQuestions.map((q, i) => (
                            <div key={`custom-${i}`} className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex justify-between items-start group">
                              <p className="text-sm text-indigo-900 font-medium">{q}</p>
                              <button onClick={() => removeCustomQuestion(i)} className="text-indigo-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {selectedCandidate.result.interviewQuestions.map((q, i) => (
                            <div key={`ai-${i}`} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-sm text-slate-700 font-medium">{q}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : selectedCandidate.status === 'processing' ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                      <h3 className="text-xl font-bold text-slate-900">Đang phân tích...</h3>
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                      <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                      <h3 className="text-xl font-bold text-slate-900">Lỗi phân tích</h3>
                      {selectedCandidate.errorMessage && (
                        <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg max-w-md break-words whitespace-pre-wrap">
                          {selectedCandidate.errorMessage}
                        </div>
                      )}
                      <button 
                        onClick={() => processCandidate(selectedCandidate)}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                      >
                        Thử lại
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Powered by Google Gemini AI • Built for HR Excellence
          </p>
        </div>
      </footer>
    </div>
  );
}
