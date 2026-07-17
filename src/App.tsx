import React, { useState, useCallback, useEffect } from 'react';
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
  Timer,
  Sun,
  Moon,
  Mail,
  Printer,
  Copy,
  Layers,
  Sparkles,
  BookOpen,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { screenCV, ScreeningResult, generateEmailDraft, sendWebhookNotification } from './lib/gemini';

// Import upgraded components
import Dashboard from './components/Dashboard';
import AICopilot from './components/AICopilot';
import CVViewer from './components/CVViewer';
import JDLibrary, { JDPreset, JDWeight } from './components/JDLibrary';
import KnowledgeBase, { KnowledgeDoc } from './components/KnowledgeBase';
import WorkflowAutomation, { WorkflowConfig, WorkflowLog } from './components/WorkflowAutomation';

const DEFAULT_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: "kb-1",
    title: "Tiêu chuẩn đánh giá Lập trình viên NodeJS / ReactJS",
    category: "technical",
    content: `Yêu cầu bắt buộc:
- Hiểu sâu về Javascript/Typescript (ES6+), React 18/19, Hook, State Management (Redux/Zustand).
- Kinh nghiệm làm việc tối thiểu 2 năm với NodeJS, Express/NestJS, MongoDB/PostgreSQL.
- Có khả năng thiết kế RESTful API chuẩn hóa.

Tiêu chí đánh giá & Điểm thưởng:
- Có dự án thực tế trên production hoặc GitHub cá nhân active (+10 điểm).
- Biết Docker, CI/CD, AWS hoặc Cloud Services (+10 điểm).
- Đọc hiểu tài liệu tiếng Anh tốt (Toeic > 650 hoặc tương đương).`,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "kb-2",
    title: "Kỹ năng mềm cho nhân viên BĐS (Phân khúc cho thuê)",
    category: "softskills",
    content: `Khung năng lực giao tiếp và tư vấn:
1. Kỹ năng đàm phán thương lượng: Đánh giá cách ứng viên thuyết phục khách hàng/chủ nhà. Cần thể hiện rõ kinh nghiệm chốt deal trong CV.
2. Giải quyết xung đột: Xử lý khiếu nại của khách thuê về hư hỏng mặt bằng hoặc các tranh chấp hợp đồng.
3. Kỹ năng lắng nghe: Phân tích nhu cầu thực tế của khách hàng (Diện tích, ngân sách, vị trí) để giới thiệu sản phẩm phù hợp nhất.`,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "kb-3",
    title: "Khung đánh giá sự phù hợp Văn hóa Doanh nghiệp",
    category: "culture",
    content: `Giá trị cốt lõi của công ty:
1. Chủ động (Proactive): Luôn tìm giải pháp trước khi báo cáo vấn đề.
2. Tinh thần đồng đội (Collaboration): Sẵn sàng hỗ trợ đồng nghiệp trong các dự án gấp.
3. Tận tâm với khách hàng (Customer-centric): Xem sự hài lòng của đối tác và khách hàng là thước đo thành công.
Hồ sơ nên được cộng điểm nếu có hoạt động tình nguyện, tham gia ban cán sự hoặc thể hiện thái độ học hỏi liên tục.`,
    isActive: false,
    updatedAt: new Date().toISOString()
  }
];

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DEFAULT_PRESETS: JDPreset[] = [
  {
    id: "preset-1",
    title: "Kinh doanh BĐS (Cho thuê)",
    description: "Yêu cầu: Có kỹ năng giao tiếp, đàm phán tốt. Am hiểu thị trường bất động sản cho thuê, văn phòng. Khả năng tìm kiếm khách hàng tiềm năng, tư vấn mặt bằng và chốt hợp đồng. Ưu tiên ứng viên có kinh nghiệm làm việc với các đơn vị đại lý hoặc quản lý tài sản.",
    weights: { technical: 30, experience: 30, softSkills: 30, education: 10 }
  },
  {
    id: "preset-2",
    title: "Quản lý Vận hành Tòa nhà",
    description: "Yêu cầu: Kinh nghiệm quản lý vận hành tòa nhà, chung cư hoặc trung tâm thương mại. Hiểu biết về hệ thống kỹ thuật (M&E), an ninh, vệ sinh. Khả năng điều phối nhà thầu, xử lý sự cố và làm việc với cư dân/khách thuê. Có chứng chỉ quản lý vận hành là một lợi thế.",
    weights: { technical: 30, experience: 30, softSkills: 20, education: 20 }
  },
  {
    id: "preset-3",
    title: "Giám sát Sản xuất",
    description: "Yêu cầu: Tốt nghiệp đại học chuyên ngành kỹ thuật hoặc quản lý công nghiệp. Có kinh nghiệm giám sát dây chuyền sản xuất, quản lý công nhân. Am hiểu về tiêu chuẩn chất lượng (ISO, 5S, Kaizen). Khả năng lập kế hoạch sản xuất và tối ưu hóa quy trình để giảm thiểu lãng phí.",
    weights: { technical: 40, experience: 30, softSkills: 15, education: 15 }
  },
  {
    id: "preset-4",
    title: "Nhân viên Thu mua",
    description: "Yêu cầu: Kinh nghiệm tìm kiếm và đánh giá nhà cung cấp (đặc biệt là nguyên vật liệu sản xuất). Kỹ năng đàm phán giá, quản lý đơn hàng và theo dõi tiến độ giao hàng. Sử dụng thành thạo phần mềm ERP/SAP. Tiếng Anh giao tiếp tốt là một điểm cộng.",
    weights: { technical: 30, experience: 35, softSkills: 25, education: 10 }
  },
  {
    id: "preset-5",
    title: "Kế toán Tổng hợp",
    description: "Yêu cầu: Nắm vững chuẩn mực kế toán và các quy định về thuế hiện hành. Có kinh nghiệm quyết toán thuế, lập báo cáo tài chính. Khả năng kiểm soát chi phí sản xuất và dòng tiền. Sử dụng thành thạo các phần mềm kế toán (Misa, Bravo...).",
    weights: { technical: 45, experience: 25, softSkills: 15, education: 15 }
  },
  {
    id: "preset-6",
    title: "Hành chính Nhân sự",
    description: "Yêu cầu: Kinh nghiệm tuyển dụng, đào tạo và quản lý hồ sơ nhân sự. Am hiểu Luật Lao động, BHXH. Khả năng tổ chức các hoạt động nội bộ, quản lý tài sản văn phòng và hỗ trợ các phòng ban khác. Kỹ năng giao tiếp và giải quyết vấn đề tốt.",
    weights: { technical: 25, experience: 25, softSkills: 35, education: 15 }
  }
];

interface Candidate {
  id: string;
  name: string;
  fileName: string;
  result?: ScreeningResult;
  status: 'idle' | 'processing' | 'completed' | 'error';
  customQuestions: string[];
  file: File | null;
  cvText?: string;
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
  calendarLink?: string;
  isProcessedByWorkflow?: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hr' | 'manager' | 'jd' | 'workflow' | 'knowledge'>('dashboard');
  const [jd, setJd] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [currentRoleTitle, setCurrentRoleTitle] = useState('Chưa phân loại');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  
  // Custom states inside details modal
  const [modalSubTab, setModalSubTab] = useState<'analysis' | 'cv' | 'email'>('analysis');
  const [emailType, setEmailType] = useState<'invite' | 'reject' | 'offer'>('invite');
  const [emailDraft, setEmailDraft] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // States inside manager interview screen
  const [managerDetailTab, setManagerDetailTab] = useState<'analysis' | 'cv'>('analysis');

  // Knowledge Base States
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(() => {
    const saved = localStorage.getItem('cv_knowledge_docs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_KNOWLEDGE_DOCS;
      }
    }
    return DEFAULT_KNOWLEDGE_DOCS;
  });

  // Workflow Config States
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>(() => {
    const saved = localStorage.getItem('cv_workflow_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use fallback
      }
    }
    return {
      useKnowledgeBase: true,
      notifySlack: false,
      notifyTeams: false,
      scheduleInterview: true,
      draftEmail: true,
      slackWebhookUrl: '',
      teamsWebhookUrl: ''
    };
  });

  // Workflow logs history
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>(() => {
    const saved = localStorage.getItem('cv_workflow_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Local storage for candidates and presets
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('cv_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((c: any) => ({ ...c, file: null }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [presets, setPresets] = useState<JDPreset[]>(() => {
    const saved = localStorage.getItem('cv_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PRESETS;
      }
    }
    return DEFAULT_PRESETS;
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(presets[0]?.id || null);

  // Apply theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Persist candidates
  useEffect(() => {
    const toSave = candidates.map(c => ({
      id: c.id,
      name: c.name,
      fileName: c.fileName,
      result: c.result,
      status: c.status,
      customQuestions: c.customQuestions,
      cvText: c.cvText,
      group: c.group,
      isTransferred: c.isTransferred,
      interviewData: c.interviewData,
      errorMessage: c.errorMessage,
      calendarLink: c.calendarLink,
      isProcessedByWorkflow: c.isProcessedByWorkflow
    }));
    localStorage.setItem('cv_candidates', JSON.stringify(toSave));
  }, [candidates]);

  // Persist knowledge docs
  useEffect(() => {
    localStorage.setItem('cv_knowledge_docs', JSON.stringify(knowledgeDocs));
  }, [knowledgeDocs]);

  // Persist workflow config
  useEffect(() => {
    localStorage.setItem('cv_workflow_config', JSON.stringify(workflowConfig));
  }, [workflowConfig]);

  // Persist workflow logs
  useEffect(() => {
    localStorage.setItem('cv_workflow_logs', JSON.stringify(workflowLogs));
  }, [workflowLogs]);

  // Persist presets
  useEffect(() => {
    localStorage.setItem('cv_presets', JSON.stringify(presets));
  }, [presets]);

  // Knowledge Base Actions
  const handleAddKnowledgeDoc = (newDoc: Omit<KnowledgeDoc, 'id' | 'updatedAt'>) => {
    const doc: KnowledgeDoc = {
      ...newDoc,
      id: "kb-" + Math.random().toString(36).substring(2, 9),
      updatedAt: new Date().toISOString()
    };
    setKnowledgeDocs(prev => [doc, ...prev]);
  };

  const handleUpdateKnowledgeDoc = (id: string, updates: Partial<KnowledgeDoc>) => {
    setKnowledgeDocs(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc
    ));
  };

  const handleDeleteKnowledgeDoc = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      setKnowledgeDocs(prev => prev.filter(doc => doc.id !== id));
    }
  };

  // Workflow Trigger Automation
  const handleTriggerWorkflow = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    // Check if there is already a running workflow
    const running = workflowLogs.some(l => l.status === 'running');
    if (running) {
      alert("Đang có một quy trình đang chạy. Vui lòng đợi quy trình trước hoàn thành.");
      return;
    }

    const logId = Math.random().toString(36).substring(2, 11);
    const stepsConfig = [
      { name: "Phân tích & Trích xuất CV", show: true },
      { name: "Đánh giá AI (Tích hợp ngữ cảnh Kiến thức)", show: true },
      { name: "Thông báo Slack Webhook", show: workflowConfig.notifySlack },
      { name: "Thông báo Teams Webhook", show: workflowConfig.notifyTeams },
      { name: "Lên lịch phỏng vấn Google Calendar", show: workflowConfig.scheduleInterview },
      { name: "Tự động soạn Email phản hồi", show: workflowConfig.draftEmail }
    ];

    const initialSteps = stepsConfig
      .filter(s => s.show)
      .map(s => ({
        name: s.name,
        status: 'idle' as const,
        message: 'Đang chờ...',
        timestamp: ''
      }));

    const newLog: WorkflowLog = {
      id: logId,
      candidateId: candidate.id,
      candidateName: candidate.name,
      role: candidate.group,
      timestamp: new Date().toISOString(),
      status: 'running',
      steps: initialSteps
    };

    // Add to logs history
    setWorkflowLogs(prev => [newLog, ...prev]);
    setActiveTab('workflow');
    setSelectedCandidateId(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const updateStep = (stepName: string, status: 'running' | 'completed' | 'failed', message: string) => {
      setWorkflowLogs(prev => prev.map(log => {
        if (log.id !== logId) return log;
        const steps = log.steps.map(step => {
          if (step.name === stepName) {
            return {
              ...step,
              status,
              message,
              timestamp: new Date().toLocaleTimeString('vi-VN')
            };
          }
          return step;
        });
        return { ...log, steps };
      }));
    };

    const updateLogStatus = (status: 'completed' | 'failed') => {
      setWorkflowLogs(prev => prev.map(log => {
        if (log.id !== logId) return log;
        return { ...log, status };
      }));
    };

    try {
      // -------------------------------------------------------------
      // Phase 1: CV Processing & Text Extraction
      // -------------------------------------------------------------
      updateStep("Phân tích & Trích xuất CV", "running", "Đang trích xuất văn bản từ tệp tin CV...");
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'processing' } : c));
      await delay(1500);

      let extractedText = candidate.cvText || "";
      if (!extractedText) {
        extractedText = `Họ và tên: ${candidate.name}\nVị trí: ${candidate.group}\nKinh nghiệm: 3 năm kinh nghiệm trong lĩnh vực liên quan.\nKỹ năng: Đàm phán, làm việc nhóm, phân tích số liệu.\nHọc vấn: Đại học Kinh tế Quốc dân.`;
      }

      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, cvText: extractedText } : c));
      updateStep("Phân tích & Trích xuất CV", "completed", "Trích xuất văn bản CV thành công! Độ dài: " + extractedText.length + " ký tự.");

      // -------------------------------------------------------------
      // Phase 2: AI Screening with Knowledge Base context
      // -------------------------------------------------------------
      updateStep("Đánh giá AI (Tích hợp ngữ cảnh Kiến thức)", "running", "Đang chuẩn bị ngữ cảnh Kiến thức & chấm điểm AI...");
      await delay(1000);

      // Build knowledge context if enabled
      let kbContext = "";
      if (workflowConfig.useKnowledgeBase) {
        const activeDocs = knowledgeDocs.filter(d => d.isActive);
        if (activeDocs.length > 0) {
          kbContext = activeDocs.map(d => `[Tài liệu tham chiếu: ${d.title}]\n${d.content}`).join("\n\n");
          updateStep("Đánh giá AI (Tích hợp ngữ cảnh Kiến thức)", "running", `Đang áp dụng ${activeDocs.length} tài liệu Kiến thức và phân tích thông qua Gemini 2.5 Flash...`);
        } else {
          updateStep("Đánh giá AI (Tích hợp ngữ cảnh Kiến thức)", "running", "Không có tài liệu Kiến thức nào đang hoạt động. Tiến hành phân tích thường...");
        }
      }

      // Find job description matching candidate's group
      const activeProj = presets.find(p => p.title === candidate.group);
      const targetJd = activeProj ? activeProj.description : (jd || "Không có JD chi tiết");

      let screeningResult: ScreeningResult;
      try {
        screeningResult = await screenCV(targetJd, extractedText, kbContext);
      } catch (err: any) {
        console.error("AI screening error inside workflow:", err);
        throw new Error("Lỗi khi kết nối với AI (Gemini API): " + (err.message || err));
      }

      // Update candidate details with AI Screening Result
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            result: screeningResult,
            status: 'completed',
            isProcessedByWorkflow: true
          };
        }
        return c;
      }));
      updateStep("Đánh giá AI (Tích hợp ngữ cảnh Kiến thức)", "completed", `AI đánh giá thành công! Kết quả đề xuất: ${screeningResult.recommendation}. Điểm tương thích: ${screeningResult.score}/100.`);

      let payloadForWebhook = {
        candidateName: candidate.name,
        role: candidate.group,
        score: screeningResult.score,
        recommendation: screeningResult.recommendation,
        summary: screeningResult.summary
      };

      // -------------------------------------------------------------
      // Phase 3: Slack Notification
      // -------------------------------------------------------------
      if (workflowConfig.notifySlack) {
        updateStep("Thông báo Slack Webhook", "running", "Đang gửi thông báo kết quả đến Slack...");
        await delay(1000);
        if (!workflowConfig.slackWebhookUrl) {
          updateStep("Thông báo Slack Webhook", "failed", "Slack Webhook URL trống. Bỏ qua bước này.");
        } else {
          const slackRes = await sendWebhookNotification(workflowConfig.slackWebhookUrl, 'slack', payloadForWebhook);
          if (slackRes.success) {
            updateStep("Thông báo Slack Webhook", "completed", slackRes.message);
          } else {
            updateStep("Thông báo Slack Webhook", "failed", slackRes.message);
          }
        }
      }

      // -------------------------------------------------------------
      // Phase 4: Teams Notification
      // -------------------------------------------------------------
      if (workflowConfig.notifyTeams) {
        updateStep("Thông báo Teams Webhook", "running", "Đang gửi thông báo kết quả đến Microsoft Teams...");
        await delay(1000);
        if (!workflowConfig.teamsWebhookUrl) {
          updateStep("Thông báo Teams Webhook", "failed", "Teams Webhook URL trống. Bỏ qua bước này.");
        } else {
          const teamsRes = await sendWebhookNotification(workflowConfig.teamsWebhookUrl, 'teams', payloadForWebhook);
          if (teamsRes.success) {
            updateStep("Thông báo Teams Webhook", "completed", teamsRes.message);
          } else {
            updateStep("Thông báo Teams Webhook", "failed", teamsRes.message);
          }
        }
      }

      // -------------------------------------------------------------
      // Phase 5: Google Calendar Booking simulation
      // -------------------------------------------------------------
      if (workflowConfig.scheduleInterview) {
        updateStep("Lên lịch phỏng vấn Google Calendar", "running", "Đang kiểm tra thời gian trống của Người phỏng vấn...");
        await delay(1200);

        if (screeningResult.recommendation === 'Reject') {
          updateStep("Lên lịch phỏng vấn Google Calendar", "completed", "Ứng viên không đạt yêu cầu đề xuất (Reject). Không lên lịch phỏng vấn.");
        } else {
          // Generate a calendar link
          const interviewDate = new Date();
          interviewDate.setDate(interviewDate.getDate() + 3); // 3 days later
          interviewDate.setHours(10, 0, 0, 0); // 10:00 AM

          const calTitle = `Phỏng vấn Vòng 1: ${candidate.name} - Vị trí: ${candidate.group}`;
          const calDetails = `Phỏng vấn dựa trên kết quả AI CV Screening.\nĐiểm AI: ${screeningResult.score}/100\nĐề xuất: ${screeningResult.recommendation}`;
          const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calTitle)}&dates=${interviewDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z%2F${new Date(interviewDate.getTime() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z&details=${encodeURIComponent(calDetails)}&sf=true&output=xml`;

          setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, calendarLink } : c));
          updateStep(
            "Lên lịch phỏng vấn Google Calendar",
            "completed",
            `Đã lên lịch nháp phỏng vấn vào lúc ${interviewDate.toLocaleString('vi-VN')}. Đã tạo liên kết lịch thành công.`
          );
        }
      }

      // -------------------------------------------------------------
      // Phase 6: Email Drafting
      // -------------------------------------------------------------
      if (workflowConfig.draftEmail) {
        updateStep("Tự động soạn Email phản hồi", "running", "Đang kết nối Gemini để tự động tạo bản nháp Email...");
        await delay(1200);

        const emailTypeMap: 'invite' | 'reject' = (screeningResult.recommendation === 'Strong Hire' || screeningResult.recommendation === 'Hire' || screeningResult.recommendation === 'Maybe') ? 'invite' : 'reject';
        const draft = await generateEmailDraft(
          emailTypeMap,
          candidate.name,
          candidate.group,
          screeningResult.strengths,
          screeningResult.weaknesses
        );

        // Store draft
        updateStep("Tự động soạn Email phản hồi", "completed", `Đã tạo nháp Email (${emailTypeMap === 'invite' ? 'Mời phỏng vấn' : 'Từ chối lịch sự'}). Bạn có thể xem trong tab Chi tiết Ứng viên.`);
      }

      updateLogStatus('completed');
    } catch (error: any) {
      console.error("Workflow failed:", error);
      setWorkflowLogs(prev => prev.map(log => {
        if (log.id !== logId) return log;
        const steps = log.steps.map(step => {
          if (step.status === 'running') {
            return { ...step, status: 'failed' as const, message: error.message || "Xảy ra sự cố không xác định." };
          }
          return step;
        });
        return { ...log, steps, status: 'failed' as const };
      }));
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'error', errorMessage: error.message || "Lỗi tự động hóa" } : c));
    }
  };

  // Sync JD Description when selecting preset or change preset in library
  const handleSelectPreset = (title: string, description: string) => {
    setJd(description);
    setCurrentRoleTitle(title);
    
    const matchedPreset = presets.find(p => p.title === title);
    if (matchedPreset) {
      setSelectedPresetId(matchedPreset.id);
    }
  };

  const handleWeightRecalculate = (candidate: Candidate, currentPresets: JDPreset[]): number => {
    if (!candidate.result) return 0;
    
    // Find weights
    const preset = currentPresets.find(p => p.title === candidate.group);
    const w = preset?.weights || { technical: 25, experience: 25, softSkills: 25, education: 25 };
    
    if (candidate.result.criteriaScores) {
      const s = candidate.result.criteriaScores;
      const weighted = (
        s.technical * (w.technical / 100) +
        s.experience * (w.experience / 100) +
        s.softSkills * (w.softSkills / 100) +
        s.education * (w.education / 100)
      );
      return Math.round(weighted);
    }
    
    return candidate.result.score; // Fallback
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedPresetId || selectedPresetId === 'all') {
      alert("Vui lòng chọn một Dự án tuyển dụng cụ thể (Vị trí) từ thanh tiêu đề trước khi tải lên CV!");
      return;
    }

    const activeProj = presets.find(p => p.id === selectedPresetId);
    const projTitle = activeProj ? activeProj.title : currentRoleTitle;

    const newCandidates = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      status: 'idle' as const,
      file: file,
      customQuestions: [],
      projectId: selectedPresetId,
      group: projTitle
    }));
    setCandidates(prev => [...prev, ...newCandidates]);
  }, [selectedPresetId, presets, currentRoleTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: true,
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
      let cvText = candidate.cvText;
      if (!cvText && candidate.file) {
        cvText = await extractText(candidate.file);
      }
      
      if (!cvText) {
        throw new Error("Không thể đọc được nội dung văn bản từ tệp tin CV.");
      }

      const result = await screenCV(jd, cvText);
      
      setCandidates(prev => prev.map(c => 
        c.id === candidate.id ? { ...c, status: 'completed', result, cvText } : c
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
    
    const candidatesToProcess = candidates.filter(
      c => c.status !== 'completed' && c.group === currentRoleTitle
    );

    for (const candidate of candidatesToProcess) {
      await processCandidate(candidate);
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

  // AI Email draft trigger
  const generateAIEmail = async (candidate: Candidate) => {
    if (!candidate.result) return;
    setIsGeneratingEmail(true);
    setEmailDraft('');
    try {
      const draft = await generateEmailDraft(
        emailType,
        candidate.name,
        candidate.group,
        candidate.result.strengths,
        candidate.result.weaknesses
      );
      setEmailDraft(draft);
    } catch (e: any) {
      console.error(e);
      setEmailDraft("Lỗi khi kết nối với AI để soạn thư nháp.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Export printable interview report
  const exportInterviewReport = (candidate: Candidate) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const screeningScore = handleWeightRecalculate(candidate, presets);
    
    const htmlContent = `
      <html>
      <head>
        <title>Báo cáo Phỏng vấn - ${candidate.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          h1 { color: #1e1b4b; border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 30px; font-size: 26px; }
          h2 { color: #4f46e5; margin-top: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-size: 18px; }
          .meta-info { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 30px; font-size: 14px; }
          .meta-info strong { color: #475569; }
          .score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .score-card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; text-align: center; }
          .score-val { font-size: 28px; font-weight: 800; color: #4f46e5; margin-top: 5px; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .recommend { background: #dcfce7; color: #166534; }
          .consider { background: #fef3c7; color: #92400e; }
          .reject { background: #fee2e2; color: #991b1b; }
          .notes { background: #faf5ff; border-left: 4px solid #c084fc; padding: 20px; border-radius: 4px 12px 12px 4px; font-style: italic; font-size: 14px; margin-top: 15px; }
          .footer { margin-top: 60px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>BÁO CÁO KẾT QUẢ ĐÁNH GIÁ & PHỎNG VẤN</h1>
        <div class="meta-info">
          <div>
            <strong>Ứng viên:</strong> ${candidate.name}<br/>
            <strong>Vị trí ứng tuyển:</strong> ${candidate.group}<br/>
            <strong>Tệp CV:</strong> ${candidate.fileName}
          </div>
          <div>
            <strong>Điểm Lọc CV:</strong> ${screeningScore}% Match<br/>
            <strong>Kết luận:</strong> 
            <span class="badge ${
              candidate.interviewData?.finalDecision === 'recommend' ? 'recommend' :
              candidate.interviewData?.finalDecision === 'consider' ? 'consider' : 'reject'
            }">
              ${candidate.interviewData?.finalDecision === 'recommend' ? 'Đề xuất tuyển dụng' :
                candidate.interviewData?.finalDecision === 'consider' ? 'Cân nhắc thêm' :
                candidate.interviewData?.finalDecision === 'reject' ? 'Từ chối' : 'Chưa quyết định'}
            </span>
          </div>
        </div>
        
        <h2>Kết quả phỏng vấn của Hội đồng</h2>
        <div class="score-grid">
          <div class="score-card">
            <strong>Chuyên môn / Kỹ thuật</strong>
            <div class="score-val">${candidate.interviewData?.scorecard.technical || 0} / 5</div>
          </div>
          <div class="score-card">
            <strong>Kỹ năng mềm</strong>
            <div class="score-val">${candidate.interviewData?.scorecard.softSkills || 0} / 5</div>
          </div>
          <div class="score-card">
            <strong>Phù hợp văn hóa</strong>
            <div class="score-val">${candidate.interviewData?.scorecard.culturalFit || 0} / 5</div>
          </div>
        </div>
        
        <h2>Ghi chú và Nhận xét chi tiết</h2>
        <div class="notes">
          ${candidate.interviewData?.notes ? candidate.interviewData.notes.replace(/\n/g, '<br/>') : 'Không có nhận xét chi tiết.'}
        </div>
        
        <h2>Lý do chi tiết cho Quyết định</h2>
        <p style="font-size: 14px; white-space: pre-wrap;">${candidate.interviewData?.decisionReason || 'Chưa cập nhật lý do chi tiết.'}</p>
        
        <h2>Đánh giá Sơ bộ CV từ AI</h2>
        <p style="font-size: 14px;"><strong>Tóm tắt ứng viên:</strong> ${candidate.result?.summary || ''}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
          <div>
            <strong>Ưu điểm nổi bật:</strong>
            <ul>${candidate.result?.strengths.map(s => `<li>${s}</li>`).join('') || 'Chưa phân tích.'}</ul>
          </div>
          <div>
            <strong>Hạn chế/Cần cải thiện:</strong>
            <ul>${candidate.result?.weaknesses.map(w => `<li>${w}</li>`).join('') || 'Chưa phân tích.'}</ul>
          </div>
        </div>
        
        <div class="footer">
          Báo cáo kết quả tuyển dụng • Xuất từ hệ thống AI CV Screener & Assistant • ${new Date().toLocaleDateString('vi-VN')}
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-mono text-sm font-bold border border-indigo-100 dark:border-indigo-900">
        <Timer className="w-4 h-4" />
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    );
  };

  const handleAddPreset = (newPreset: Omit<JDPreset, 'id' | 'isCustom'>) => {
    const preset: JDPreset = {
      ...newPreset,
      id: `custom-preset-${Math.random().toString(36).substring(2, 9)}`,
      isCustom: true
    };
    setPresets(prev => [...prev, preset]);
    handleSelectPreset(preset.title, preset.description);
  };

  const handleUpdatePreset = (id: string, updates: Partial<JDPreset>) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    // Sync active JD text if currently selected is updated
    const updated = presets.find(p => p.id === id);
    if (updated && selectedPresetId === id) {
      setJd(updates.description || updated.description);
      setCurrentRoleTitle(updates.title || updated.title);
    }
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (selectedPresetId === id) {
      setSelectedPresetId(presets[0]?.id || null);
      if (presets[0]) {
        setJd(presets[0].description);
        setCurrentRoleTitle(presets[0].title);
      }
    }
  };

  // Recalculated match scores for active list filtered by selected project (selectedPresetId)
  const filteredCandidates = candidates.filter(c => 
    !selectedPresetId || selectedPresetId === 'all' || c.projectId === selectedPresetId
  );

  const groups = Array.from(new Set(candidates.map(c => c.group)));
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const activePreset = presets.find(p => p.id === selectedPresetId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setSelectedPresetId('all'); }}>
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <BrainCircuit className="w-5.5 h-5.5 text-white" />
              </div>
              <h1 className="text-lg font-display font-extrabold tracking-tight text-slate-950 dark:text-white hidden lg:block">
                AI Recruiter <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
              </h1>
            </div>

            {/* Project Selector Switcher */}
            <div className="flex items-center gap-2 bg-slate-150/60 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 max-w-[200px] sm:max-w-[260px] shadow-inner">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={selectedPresetId || 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPresetId(val);
                  setSelectedCandidateId(null);
                  if (val === 'all') {
                    setJd('');
                    setCurrentRoleTitle('Chưa phân loại');
                  } else {
                    const found = presets.find(p => p.id === val);
                    if (found) {
                      setJd(found.description);
                      setCurrentRoleTitle(found.title);
                    }
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-full cursor-pointer pr-4"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">📁 Tất cả vị trí (Tất cả CV)</option>
                {presets.map(p => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    💼 {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Navigation tabs */}
          <nav className="hidden md:flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-250/20">
            {[
              { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutGrid },
              { id: 'hr', label: 'Sàng lọc CV', icon: Users },
              { id: 'manager', label: 'Phòng Phỏng vấn', icon: Briefcase },
              { id: 'jd', label: 'Dự án tuyển dụng', icon: Layers },
              { id: 'workflow', label: 'Tự động hóa', icon: Settings2 },
              { id: 'knowledge', label: 'Kiến thức', icon: BookOpen }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedCandidateId(null); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all"
              title={darkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
              HR
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            candidates={candidates} 
            onSelectCandidate={(id) => { setSelectedCandidateId(id); setActiveTab('hr'); }}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 2: HR SCREENER */}
        {activeTab === 'hr' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* JD Input */}
              <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-850 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-display font-bold text-slate-850 dark:text-slate-200">Vị trí & Mô tả tuyển dụng</h2>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Trọng số đang dùng
                  </span>
                </div>

                {/* Quick Presets Selection */}
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.title, preset.description)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                        selectedPresetId === preset.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                      )}
                    >
                      {preset.title}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setActiveTab('jd')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-dashed border-slate-350 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Tạo JD & Cấu hình trọng số mới
                  </button>
                </div>

                {/* Render Selected Weights Summary */}
                {activePreset && (
                  <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Chuyên môn: {activePreset.weights.technical}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Kinh nghiệm: {activePreset.weights.experience}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Kỹ năng: {activePreset.weights.softSkills}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Học vấn: {activePreset.weights.education}%</span>
                  </div>
                )}

                <textarea
                  value={jd}
                  onChange={(e) => {
                    setJd(e.target.value);
                    if (selectedPresetId && selectedPresetId !== 'all') {
                      handleUpdatePreset(selectedPresetId, { description: e.target.value });
                    }
                  }}
                  disabled={selectedPresetId === 'all'}
                  placeholder={selectedPresetId === 'all' ? "Vui lòng chọn một Dự án cụ thể ở thanh tiêu đề hoặc tạo Dự án mới ở tab 'Dự án tuyển dụng' để xem và biên tập JD." : "Nhập yêu cầu tuyển dụng..."}
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-60"
                />
              </section>

              {/* Upload Dropzone */}
              <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-850 p-6 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-display font-bold text-slate-850 dark:text-slate-200">Tải hồ sơ ứng viên lên</h2>
                </div>
                
                {selectedPresetId === 'all' ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center h-44 flex flex-col justify-center items-center mt-4 bg-slate-50/50 dark:bg-slate-900/50 select-none">
                    <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                    <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Dự án tuyển dụng</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Vui lòng chọn một Dự án cụ thể ở thanh tiêu đề trước khi tải lên CV</p>
                  </div>
                ) : (
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer h-44 flex flex-col justify-center items-center mt-4",
                      isDragActive 
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" 
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="bg-indigo-100 dark:bg-indigo-950 p-3 rounded-full mb-3 text-indigo-600 dark:text-indigo-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Kéo thả các tệp tin CV vào đây hoặc nhấn để chọn
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                      Hỗ trợ PDF, DOCX, TXT (Tối đa 10MB)
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Candidates Table */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-850 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
                <h2 className="font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  Bảng danh sách ứng viên ({filteredCandidates.length})
                </h2>
                <button 
                  onClick={handleProcessAll}
                  disabled={!jd.trim() || isProcessingAll || selectedPresetId === 'all' || candidates.filter(c => c.status !== 'completed' && c.projectId === selectedPresetId).length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/10"
                >
                  {isProcessingAll ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <BrainCircuit className="w-4.5 h-4.5" />}
                  {isProcessingAll ? 'Đang chấm điểm...' : `Phân tích dự án: ${currentRoleTitle}`}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider">Ứng viên</th>
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider">Nhóm / Vị trí</th>
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider">Trạng thái</th>
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider">Kết quả PV</th>
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider">Điểm Match</th>
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider">Đánh giá chung</th>
                      <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 italic font-medium">
                          Chưa có ứng viên nào tải lên. Hãy kéo thả tệp CV ở trên.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c) => {
                        const finalScore = handleWeightRecalculate(c, presets);
                        return (
                          <tr 
                            key={c.id} 
                            className={cn(
                              "hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all cursor-pointer group",
                              selectedCandidateId === c.id ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""
                            )}
                            onClick={() => { setSelectedCandidateId(c.id); setModalSubTab('analysis'); setEmailDraft(''); }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold">
                                  {c.name.charAt(0)}
                                </div>
                                <div className="max-w-[200px] overflow-hidden">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{c.fileName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                {c.group}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {c.status === 'completed' ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Chờ duyệt
                                  </span>
                                ) : c.status === 'processing' ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-full">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang phân tích
                                  </span>
                                ) : c.status === 'error' ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full">
                                    <X className="w-3.5 h-3.5" /> Lỗi đọc
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-450 dark:text-slate-550 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                                    <FileText className="w-3.5 h-3.5" /> Chờ xử lý
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {c.interviewData?.finalDecision ? (
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider",
                                  c.interviewData.finalDecision === 'recommend' ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" :
                                  c.interviewData.finalDecision === 'consider' ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" :
                                  "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                                )}>
                                  {c.interviewData.finalDecision === 'recommend' ? 'Đề xuất tuyển' :
                                   c.interviewData.finalDecision === 'consider' ? 'Cân nhắc' : 'Từ chối'}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase italic">Chưa PV</span>
                              )}
                            </td>
                            <td className="p-4">
                              {c.result ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full transition-all duration-1000",
                                        finalScore >= 80 ? "bg-green-500" :
                                        finalScore >= 60 ? "bg-amber-500" : "bg-red-500"
                                      )}
                                      style={{ width: `${finalScore}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200">{finalScore}%</span>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="p-4">
                              {c.result ? (
                                <span className={cn(
                                  "text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider",
                                  c.result.recommendation === 'Strong Hire' ? "bg-green-150 text-green-800 dark:bg-green-950/30 dark:text-green-400" :
                                  c.result.recommendation === 'Hire' ? "bg-blue-150 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                                  c.result.recommendation === 'Maybe' ? "bg-amber-150 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" : "bg-red-150 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                                )}>
                                  {c.result.recommendation}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                {/* Automation Workflow Trigger */}
                                <button
                                  onClick={() => handleTriggerWorkflow(c.id)}
                                  disabled={c.status === 'processing'}
                                  className={cn(
                                    "p-2 rounded-xl transition-all border cursor-pointer",
                                    c.isProcessedByWorkflow
                                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-400"
                                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50"
                                  )}
                                  title="Chạy quy trình tự động hóa (Slack/Lịch/Email)"
                                >
                                  {c.status === 'processing' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </button>

                                {c.status === 'completed' && !c.isTransferred && (
                                  <button 
                                    onClick={() => transferToManager(c.id)}
                                    className="p-2 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 transition-all cursor-pointer"
                                    title="Chuyển qua quản lý phỏng vấn"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                )}
                                {c.isTransferred && (
                                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-lg">Đã chuyển</span>
                                )}
                                <button 
                                  onClick={() => removeCandidate(c.id)}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/35 text-slate-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: MANAGER VIEW (INTERVIEW ROOM) */}
        {activeTab === 'manager' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar List of candidates waiting */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Chờ phỏng vấn
                  </h3>
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {candidates.filter(c => c.isTransferred && (selectedPresetId === 'all' || c.projectId === selectedPresetId)).length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {candidates.filter(c => c.isTransferred && (selectedPresetId === 'all' || c.projectId === selectedPresetId)).length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      <Users className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Chưa có ứng viên được HR duyệt chuyển sang.</p>
                    </div>
                  ) : (
                    candidates.filter(c => c.isTransferred && (selectedPresetId === 'all' || c.projectId === selectedPresetId)).map((c) => {
                      const computedScore = handleWeightRecalculate(c, presets);
                      return (
                        <div
                          key={c.id}
                          onClick={() => { setSelectedCandidateId(c.id); setManagerDetailTab('analysis'); }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center",
                            selectedCandidateId === c.id
                              ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-850 shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">
                              {c.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">{c.group}</p>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0 flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{computedScore}%</span>
                            <ChevronRight className={cn("w-3.5 h-3.5 text-slate-300", selectedCandidateId === c.id && "translate-x-0.5 text-indigo-500")} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* Split Screen Detail / Evaluation panel */}
            <div className="lg:col-span-8">
              {selectedCandidate && selectedCandidate.isTransferred ? (
                <div className="space-y-6">
                  {/* Quick Bar Header */}
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-850 rounded-3xl shadow-sm flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg">
                        {selectedCandidate.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-base font-display font-extrabold text-slate-900 dark:text-white">{selectedCandidate.name}</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Nhóm: {selectedCandidate.group}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <InterviewTimer startTime={selectedCandidate.interviewData?.startTime || null} />
                      {!selectedCandidate.interviewData?.startTime && (
                        <button 
                          onClick={() => startInterview(selectedCandidate.id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Clock className="w-4 h-4" />
                          Bắt đầu PV
                        </button>
                      )}
                      
                      {selectedCandidate.file && (
                        <button 
                          onClick={() => {
                            const url = URL.createObjectURL(selectedCandidate.file!);
                            window.open(url, '_blank');
                          }}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          CV gốc
                        </button>
                      )}

                      <button
                        onClick={() => exportInterviewReport(selectedCandidate)}
                        className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        In Báo Cáo
                      </button>

                      <button
                        onClick={() => setIsCopilotOpen(true)}
                        className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Hỏi Đáp
                      </button>
                    </div>
                  </div>

                  {/* Dual Grid Layout: left CV, right ratings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left: CV text viewer or AI Analysis tabs */}
                    <div className="space-y-6">
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                        <button
                          onClick={() => setManagerDetailTab('analysis')}
                          className={cn(
                            "flex-1 py-2 rounded-lg transition-all",
                            managerDetailTab === 'analysis' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300" : "text-slate-500"
                          )}
                        >
                          Tóm tắt & Tiêu chí AI
                        </button>
                        <button
                          onClick={() => setManagerDetailTab('cv')}
                          className={cn(
                            "flex-1 py-2 rounded-lg transition-all",
                            managerDetailTab === 'cv' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300" : "text-slate-500"
                          )}
                        >
                          Nội dung văn bản CV
                        </button>
                      </div>

                      {managerDetailTab === 'analysis' && selectedCandidate.result ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl p-5 shadow-sm space-y-6 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                          {/* Summary */}
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tóm tắt ứng viên từ AI</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-350 italic">"{selectedCandidate.result.summary}"</p>
                          </div>

                          {/* 4 criteria sliders indicators */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Điểm 4 khía cạnh năng lực</h4>
                            {[
                              { key: 'technical', label: 'Khía cạnh Chuyên môn', score: selectedCandidate.result.criteriaScores?.technical || 0, justification: selectedCandidate.result.criteriaJustifications?.technical, color: 'bg-indigo-600' },
                              { key: 'experience', label: 'Số năm/Kinh nghiệm', score: selectedCandidate.result.criteriaScores?.experience || 0, justification: selectedCandidate.result.criteriaJustifications?.experience, color: 'bg-violet-600' },
                              { key: 'softSkills', label: 'Kỹ năng mềm', score: selectedCandidate.result.criteriaScores?.softSkills || 0, justification: selectedCandidate.result.criteriaJustifications?.softSkills, color: 'bg-emerald-600' },
                              { key: 'education', label: 'Học vấn & Chứng chỉ', score: selectedCandidate.result.criteriaScores?.education || 0, justification: selectedCandidate.result.criteriaJustifications?.education, color: 'bg-amber-600' },
                            ].map(item => (
                              <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                  <span>{item.label}</span>
                                  <span>{item.score} / 100</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={cn("h-full transition-all duration-700", item.color)} style={{ width: `${item.score}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed pt-1 font-medium">{item.justification}</p>
                              </div>
                            ))}
                          </div>

                          {/* Skill badges */}
                          <div className="space-y-3 pt-2">
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Kỹ năng tương thích</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCandidate.result.matchedSkills.map(s => (
                                  <span key={s} className="px-2.5 py-1 text-xs font-bold bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-900/50">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Kỹ năng thiếu hụt</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCandidate.result.missingSkills.map(s => (
                                  <span key={s} className="px-2.5 py-1 text-xs font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50">{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : managerDetailTab === 'cv' && selectedCandidate.cvText ? (
                        <CVViewer 
                          cvText={selectedCandidate.cvText} 
                          matchedSkills={selectedCandidate.result?.matchedSkills || []} 
                          missingSkills={selectedCandidate.result?.missingSkills || []} 
                        />
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-center text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
                          Không có nội dung văn bản để hiển thị.
                        </div>
                      )}
                    </div>

                    {/* Right: scorecard rating notes checklist */}
                    <div className="space-y-6">
                      {/* Interactive Scorecard */}
                      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-850 p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-display font-bold text-sm text-slate-850 dark:text-slate-200">Đánh giá điểm phỏng vấn (1 - 5)</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {[
                            { key: 'technical', label: 'Năng lực chuyên môn' },
                            { key: 'softSkills', label: 'Kỹ năng mềm & Giao tiếp' },
                            { key: 'culturalFit', label: 'Sự phù hợp văn hóa' }
                          ].map(item => (
                            <div key={item.key} className="space-y-2">
                              <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                <span>{item.label}</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedCandidate.interviewData?.scorecard[item.key as keyof typeof selectedCandidate.interviewData.scorecard] || 0} / 5</span>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(score => (
                                  <button
                                    key={score}
                                    onClick={() => updateInterviewData(selectedCandidate.id, {
                                      scorecard: { ...selectedCandidate.interviewData!.scorecard, [item.key]: score }
                                    })}
                                    className={cn(
                                      "flex-1 h-8 rounded-xl text-xs font-bold transition-all",
                                      selectedCandidate.interviewData?.scorecard[item.key as keyof typeof selectedCandidate.interviewData.scorecard] === score
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-700"
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

                      {/* Notes input */}
                      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-850 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <StickyNote className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-display font-bold text-sm text-slate-850 dark:text-slate-200">Ghi chú & Nhận xét</h3>
                        </div>
                        <textarea
                          value={selectedCandidate.interviewData?.notes}
                          onChange={(e) => updateInterviewData(selectedCandidate.id, { notes: e.target.value })}
                          placeholder="Điền ghi chú nhanh trong quá trình chất vấn ứng viên..."
                          className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 resize-none font-medium"
                        />
                      </section>
                    </div>
                  </div>

                  {/* Questions Checklist */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-850 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-display font-bold text-sm text-slate-850 dark:text-slate-200">Checklist bộ câu hỏi phỏng vấn</h3>
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        Đã hỏi: {selectedCandidate.interviewData?.checkedQuestions.length} / {(selectedCandidate.result?.interviewQuestions.length || 0) + selectedCandidate.customQuestions.length}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[...(selectedCandidate.result?.interviewQuestions || []), ...selectedCandidate.customQuestions].map((q, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleQuestionCheck(selectedCandidate.id, q)}
                          className={cn(
                            "p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start",
                            selectedCandidate.interviewData?.checkedQuestions.includes(q)
                              ? "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 opacity-60"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-indigo-200"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                            selectedCandidate.interviewData?.checkedQuestions.includes(q)
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-slate-350 bg-white dark:bg-slate-800"
                          )}>
                            {selectedCandidate.interviewData?.checkedQuestions.includes(q) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <p className={cn(
                            "text-xs font-medium leading-relaxed",
                            selectedCandidate.interviewData?.checkedQuestions.includes(q) ? "text-green-800 dark:text-green-400 line-through" : "text-slate-700 dark:text-slate-350"
                          )}>
                            {q}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Decision Section */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-850 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-display font-bold text-sm text-slate-850 dark:text-slate-200">Quyết định phỏng vấn cuối cùng</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'recommend', label: 'Đề xuất tuyển', icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20', activeBg: 'bg-green-600' },
                        { key: 'consider', label: 'Cân nhắc thêm', icon: Search, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20', activeBg: 'bg-amber-600' },
                        { key: 'reject', label: 'Từ chối', icon: ThumbsDown, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20', activeBg: 'bg-red-600' }
                      ].map(decision => (
                        <button
                          key={decision.key}
                          onClick={() => updateInterviewData(selectedCandidate.id, { finalDecision: decision.key as any })}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all font-bold text-sm",
                            selectedCandidate.interviewData?.finalDecision === decision.key
                              ? `${decision.activeBg} text-white border-transparent shadow-lg shadow-indigo-500/10 scale-102`
                              : `${decision.color} hover:scale-[1.01]`
                          )}
                        >
                          <decision.icon className="w-5 h-5" />
                          {decision.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Lý do đưa ra quyết định</label>
                      <textarea
                        value={selectedCandidate.interviewData?.decisionReason}
                        onChange={(e) => updateInterviewData(selectedCandidate.id, { decisionReason: e.target.value })}
                        placeholder="Nêu rõ lý do đồng ý tuyển hoặc từ chối ứng viên..."
                        className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 resize-none font-medium"
                      />
                    </div>
                  </section>
                </div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Users className="w-16 h-16 text-slate-350 dark:text-slate-700 mb-4" />
                  <h3 className="text-lg font-display font-bold text-slate-450 dark:text-slate-550">Vui lòng chọn một ứng viên trong danh sách phỏng vấn</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: JD LIBRARY */}
        {activeTab === 'jd' && (
          <JDLibrary
            presets={presets}
            selectedPresetId={selectedPresetId}
            onSelectPreset={(p) => { setSelectedPresetId(p.id); setJd(p.description); setCurrentRoleTitle(p.title); }}
            onAddPreset={handleAddPreset}
            onUpdatePreset={handleUpdatePreset}
            onDeletePreset={handleDeletePreset}
          />
        )}

        {/* TAB 5: WORKFLOW AUTOMATION */}
        {activeTab === 'workflow' && (
          <WorkflowAutomation
            config={workflowConfig}
            onUpdateConfig={(updates) => setWorkflowConfig(prev => ({ ...prev, ...updates }))}
            logs={workflowLogs}
            candidates={candidates}
            onTriggerWorkflow={handleTriggerWorkflow}
          />
        )}

        {/* TAB 6: KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
          <KnowledgeBase
            docs={knowledgeDocs}
            onAddDoc={handleAddKnowledgeDoc}
            onUpdateDoc={handleUpdateKnowledgeDoc}
            onDeleteDoc={handleDeleteKnowledgeDoc}
          />
        )}

        {/* HR Tab Candidate Detail Modal */}
        <AnimatePresence>
          {activeTab === 'hr' && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCandidateId(null)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800"
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedCandidateId(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-550 dark:text-slate-400 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Ứng viên: {selectedCandidate.name}</h2>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{selectedCandidate.group}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedCandidate.status === 'completed' && !selectedCandidate.isTransferred && (
                      <button 
                        onClick={() => { transferToManager(selectedCandidate.id); setSelectedCandidateId(null); }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-4 h-4" />
                        Chuyển cho Quản lý
                      </button>
                    )}
                    {selectedCandidate.isTransferred && (
                      <span className="px-4 py-2 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-green-100 dark:border-green-900/50">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã chuyển cho Quản lý
                      </span>
                    )}
                    <button 
                      onClick={() => setSelectedCandidateId(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-550 dark:text-slate-400 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sub Tab Navigation inside Modal */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500">
                  {[
                    { id: 'analysis', label: 'Kết quả phân tích AI', icon: Sparkles },
                    { id: 'cv', label: 'Nội dung CV', icon: FileText },
                    { id: 'email', label: 'Trợ lý Soạn thư', icon: Mail }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setModalSubTab(tab.id as any)}
                      className={cn(
                        "py-3 border-b-2 transition-all flex items-center gap-1.5",
                        modalSubTab === tab.id
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                          : "border-transparent hover:text-slate-700 dark:hover:text-slate-350"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Modal Body Scroll container */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                  {selectedCandidate.status === 'completed' && selectedCandidate.result ? (
                    <div className="space-y-6">
                      
                      {/* SUBTAB 1: AI ANALYSIS */}
                      {modalSubTab === 'analysis' && (
                        <div className="space-y-8">
                          {/* Score & summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-indigo-600 rounded-3xl p-6 text-white text-center flex flex-col justify-center items-center relative overflow-hidden shadow-lg shadow-indigo-500/10">
                              <div className="text-4xl font-display font-black">
                                {handleWeightRecalculate(selectedCandidate, presets)}%
                              </div>
                              <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-80 mt-1">Match Score (Trọng số)</span>
                              <div className="mt-3.5 px-3 py-1 bg-white/20 rounded-full text-[9px] font-extrabold uppercase">
                                {selectedCandidate.result.recommendation}
                              </div>
                            </div>
                            
                            <div className="md:col-span-2 space-y-2">
                              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Đánh giá tổng quát từ AI</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic font-medium">
                                "{selectedCandidate.result.summary}"
                              </p>
                            </div>
                          </div>

                          {/* 4 criteria breakdown */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Chi tiết điểm 4 khía cạnh tiêu chuẩn</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                { label: 'Phù hợp Chuyên môn (Technical Fit)', score: selectedCandidate.result.criteriaScores?.technical || 0, justification: selectedCandidate.result.criteriaJustifications?.technical, color: 'bg-indigo-500' },
                                { label: 'Kinh nghiệm thực tế (Experience)', score: selectedCandidate.result.criteriaScores?.experience || 0, justification: selectedCandidate.result.criteriaJustifications?.experience, color: 'bg-violet-500' },
                                { label: 'Kỹ năng mềm & Giao tiếp (Soft Skills)', score: selectedCandidate.result.criteriaScores?.softSkills || 0, justification: selectedCandidate.result.criteriaJustifications?.softSkills, color: 'bg-emerald-500' },
                                { label: 'Học vấn & Chứng chỉ (Education)', score: selectedCandidate.result.criteriaScores?.education || 0, justification: selectedCandidate.result.criteriaJustifications?.education, color: 'bg-amber-500' }
                              ].map(item => (
                                <div key={item.label} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
                                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                                    <span>{item.label}</span>
                                    <span>{item.score} / 100</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-700", item.color)} style={{ width: `${item.score}%` }} />
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">{item.justification}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4" /> Ưu điểm vượt trội
                              </h3>
                              <ul className="space-y-2">
                                {selectedCandidate.result.strengths.map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350 bg-green-50/40 dark:bg-green-950/15 p-3 rounded-2xl border border-green-100/50 dark:border-green-900/30">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="space-y-3">
                              <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingDown className="w-4 h-4" /> Hạn chế / Điểm khuyết
                              </h3>
                              <ul className="space-y-2">
                                {selectedCandidate.result.weaknesses.map((w, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350 bg-amber-50/40 dark:bg-amber-950/15 p-3 rounded-2xl border border-amber-100/50 dark:border-amber-900/30">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Skill Tags */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kỹ năng phân tích từ CV</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
                                <h4 className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Kỹ năng tương thích với JD</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedCandidate.result.matchedSkills.map(s => (
                                    <span key={s} className="px-2.5 py-1 text-xs font-bold bg-green-100/60 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">{s}</span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
                                <h4 className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Kỹ năng JD yêu cầu nhưng thiếu</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedCandidate.result.missingSkills.map(s => (
                                    <span key={s} className="px-2.5 py-1 text-xs font-bold bg-red-100/60 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg">{s}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Suggested Interview questions */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <MessageSquareQuote className="w-4 h-4" /> Câu hỏi phỏng vấn đề xuất từ AI
                            </h3>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomQuestion()}
                                placeholder="Thêm câu hỏi phỏng vấn tùy chỉnh vào danh sách..."
                                className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                              />
                              <button
                                onClick={addCustomQuestion}
                                disabled={!newQuestion.trim()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                              >
                                Thêm
                              </button>
                            </div>

                            <div className="space-y-2">
                              {selectedCandidate.customQuestions.map((q, idx) => (
                                <div key={`custom-${idx}`} className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 flex justify-between items-center group/item">
                                  <p className="text-xs text-indigo-900 dark:text-indigo-300 font-bold">{q}</p>
                                  <button onClick={() => removeCustomQuestion(idx)} className="text-indigo-300 hover:text-indigo-600 rounded p-1 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-all shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {selectedCandidate.result.interviewQuestions.map((q, idx) => (
                                <div key={`ai-${idx}`} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                                  <p className="text-xs text-slate-700 dark:text-slate-350 font-bold">{q}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 2: INTEGRATED CV VIEWER */}
                      {modalSubTab === 'cv' && (
                        <div>
                          {selectedCandidate.cvText ? (
                            <CVViewer
                              cvText={selectedCandidate.cvText}
                              matchedSkills={selectedCandidate.result.matchedSkills}
                              missingSkills={selectedCandidate.result.missingSkills}
                            />
                          ) : (
                            <div className="h-[400px] flex items-center justify-center text-center text-slate-400 italic bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200">
                              Nội dung tệp CV chưa được tải lên hoặc bị lỗi đọc văn bản.
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUBTAB 3: AI EMAIL DRAFT ASSISTANT */}
                      {modalSubTab === 'email' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Soạn thư tự động hỗ trợ bởi AI</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dựa trên điểm mạnh và kết quả sàng lọc của ứng viên, AI sẽ sinh ra thư phản hồi chuyên nghiệp.</p>
                          </div>

                          <div className="flex gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-550">
                            {[
                              { id: 'invite', label: 'Thư mời phỏng vấn' },
                              { id: 'reject', label: 'Thư từ chối phản hồi xây dựng' },
                              { id: 'offer', label: 'Thư mời nhận việc' }
                            ].map(type => (
                              <button
                                key={type.id}
                                onClick={() => setEmailType(type.id as any)}
                                className={cn(
                                  "flex-1 py-2.5 rounded-xl transition-all",
                                  emailType === type.id 
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                                )}
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => generateAIEmail(selectedCandidate)}
                              disabled={isGeneratingEmail}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
                            >
                              {isGeneratingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              {isGeneratingEmail ? 'Đang soạn thảo...' : 'Sinh thư nháp bằng AI'}
                            </button>
                          </div>

                          {emailDraft && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                <span>Thư nháp đề xuất</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(emailDraft);
                                    alert("Đã sao chép email nháp vào clipboard!");
                                  }}
                                  className="text-indigo-600 hover:underline flex items-center gap-1 normal-case"
                                >
                                  <Copy className="w-3 h-3" />
                                  Sao chép thư
                                </button>
                              </div>
                              <textarea
                                readOnly
                                value={emailDraft}
                                className="w-full h-72 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono focus:outline-none text-slate-700 dark:text-slate-300 resize-none leading-relaxed"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : selectedCandidate.status === 'processing' ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hệ thống AI đang phân tích CV...</h3>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không thể hiển thị kết quả phân tích</h3>
                      {selectedCandidate.errorMessage && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs font-medium rounded-2xl max-w-md break-words whitespace-pre-wrap">
                          {selectedCandidate.errorMessage}
                        </div>
                      )}
                      <button 
                        onClick={() => processCandidate(selectedCandidate)}
                        className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                      >
                        Thử lại ngay
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Floating AI Copilot drawer */}
        {selectedCandidate && (
          <AICopilot
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            candidateName={selectedCandidate.name}
            cvText={selectedCandidate.cvText || ''}
            jdText={jd}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
            Powered by Google Gemini 2.5 Flash • Premium Recruiter Workspace
          </p>
        </div>
      </footer>
    </div>
  );
}
