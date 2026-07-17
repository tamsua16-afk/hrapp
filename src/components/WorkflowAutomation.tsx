import React, { useState } from 'react';
import { 
  Settings2, 
  Slack, 
  Send, 
  Calendar, 
  Mail, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  History, 
  HelpCircle,
  Database,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface WorkflowConfig {
  useKnowledgeBase: boolean;
  notifySlack: boolean;
  notifyTeams: boolean;
  scheduleInterview: boolean;
  draftEmail: boolean;
  slackWebhookUrl: string;
  teamsWebhookUrl: string;
}

export interface WorkflowLog {
  id: string;
  candidateName: string;
  candidateId: string;
  role: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  steps: {
    name: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    message: string;
    timestamp: string;
  }[];
}

interface WorkflowAutomationProps {
  config: WorkflowConfig;
  onUpdateConfig: (updates: Partial<WorkflowConfig>) => void;
  logs: WorkflowLog[];
  candidates: { id: string; name: string; status: string; group: string; result?: any }[];
  onTriggerWorkflow: (candidateId: string) => void;
}

export default function WorkflowAutomation({
  config,
  onUpdateConfig,
  logs,
  candidates,
  onTriggerWorkflow
}: WorkflowAutomationProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'history'>('settings');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filter candidates who are idle or completed
  const triggerableCandidates = candidates.filter(
    c => c.status === 'idle' || c.status === 'completed' || c.status === 'error'
  );

  const currentRunningLog = logs.find(log => log.status === 'running');

  const handleStartWorkflow = () => {
    if (!selectedCandidateId) return;
    onTriggerWorkflow(selectedCandidateId);
    setSelectedCandidateId('');
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />;
      default:
        return <Clock className="w-5 h-5 text-slate-300 dark:text-slate-700 shrink-0" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings2 className="w-7 h-7 text-indigo-500" />
          Tự động hóa & Tích hợp (Workflow Automation)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Thiết lập quy trình tự động hóa nhiều giai đoạn và tích hợp kết quả đánh giá với Slack, Microsoft Teams, Lịch và Email.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeSubTab === 'settings'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Cấu hình quy trình & Liên kết
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeSubTab === 'history'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Lịch sử thực thi ({logs.length})
        </button>
      </div>

      {activeSubTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Stage 1: Trigger */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px]">1</span>
                Kích hoạt (Trigger) & Ngữ cảnh
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Khi tải lên và xử lý hồ sơ CV</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quy trình tự động hóa sẽ tự động kích hoạt sau khi CV được gửi lên.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Tự động kích hoạt</span>
                </div>

                <div className="flex items-center justify-between p-2">
                  <div className="flex gap-3 items-center">
                    <Database className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Áp dụng Thư viện Kiến thức</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tự động chèn tất cả tài liệu Active làm ngữ cảnh cho AI.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateConfig({ useKnowledgeBase: !config.useKnowledgeBase })}
                    className={cn(
                      "w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer",
                      config.useKnowledgeBase ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-white shadow-sm"
                      animate={{ x: config.useKnowledgeBase ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Stage 2: Actions */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px]">2</span>
                Hành động đầu ra (Automation Actions)
              </h3>

              <div className="space-y-6">
                {/* Slack notification */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <Slack className="w-5 h-5 text-[#4A154B] shrink-0" />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Gửi thông báo Slack Webhook</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Đăng kết quả phân tích và chấm điểm lên kênh Slack.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateConfig({ notifySlack: !config.notifySlack })}
                      className={cn(
                        "w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer",
                        config.notifySlack ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                      )}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-sm"
                        animate={{ x: config.notifySlack ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                  {config.notifySlack && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="pl-8"
                    >
                      <input
                        type="text"
                        placeholder="Nhập Slack Incoming Webhook URL..."
                        value={config.slackWebhookUrl}
                        onChange={(e) => onUpdateConfig({ slackWebhookUrl: e.target.value })}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Teams notification */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <Send className="w-5 h-5 text-[#6264A7] shrink-0" />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Gửi thông báo Microsoft Teams Webhook</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Đăng thông báo dạng thẻ thông tin lên Teams.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateConfig({ notifyTeams: !config.notifyTeams })}
                      className={cn(
                        "w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer",
                        config.notifyTeams ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                      )}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-sm"
                        animate={{ x: config.notifyTeams ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                  {config.notifyTeams && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="pl-8"
                    >
                      <input
                        type="text"
                        placeholder="Nhập Microsoft Teams Webhook URL..."
                        value={config.teamsWebhookUrl}
                        onChange={(e) => onUpdateConfig({ teamsWebhookUrl: e.target.value })}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Google Calendar integration */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <Calendar className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Lên lịch Phỏng vấn trên Google Calendar</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tự động giữ chỗ lịch trống và tạo liên kết họp cho hồ sơ phù hợp.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateConfig({ scheduleInterview: !config.scheduleInterview })}
                    className={cn(
                      "w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer",
                      config.scheduleInterview ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-white shadow-sm"
                      animate={{ x: config.scheduleInterview ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Email Auto drafting */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Tự động soạn Email tương ứng</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tự động tạo email mời phỏng vấn hoặc email phản hồi từ chối lịch sự.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateConfig({ draftEmail: !config.draftEmail })}
                    className={cn(
                      "w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer",
                      config.draftEmail ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-white shadow-sm"
                      animate={{ x: config.draftEmail ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Test Automation panel */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-500" />
                Chạy thử quy trình
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chọn một ứng viên có sẵn trong hệ thống để kích hoạt chạy toàn bộ quy trình đa đoạn đã cấu hình.
              </p>

              <div className="space-y-4 pt-2">
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                >
                  <option value="">-- Chọn ứng viên chạy thử --</option>
                  {triggerableCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.group} ({c.status === 'completed' ? 'Đã screening' : 'Chưa xử lý'})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleStartWorkflow}
                  disabled={!selectedCandidateId || !!currentRunningLog}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentRunningLog ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Quy trình khác đang chạy...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Bắt đầu thực thi quy trình
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Live Progress Tracker */}
            {currentRunningLog && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-indigo-500/30 dark:border-indigo-500/20 rounded-3xl p-6 shadow-md relative overflow-hidden"
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -z-10" />

                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Đang xử lý thực tế</span>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white mt-0.5">
                      {currentRunningLog.candidateName}
                    </h3>
                  </div>
                  <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>

                <div className="mt-6 space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                  {currentRunningLog.steps.map((step, idx) => {
                    const isStepRunning = step.status === 'running';
                    const isStepCompleted = step.status === 'completed';
                    const isStepFailed = step.status === 'failed';
                    return (
                      <div key={idx} className="relative flex gap-3 items-start">
                        {/* Dot marker */}
                        <div className={cn(
                          "absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-900 z-10 transition-all",
                          isStepCompleted ? "border-emerald-500 bg-emerald-500" :
                          isStepFailed ? "border-rose-500 bg-rose-500" :
                          isStepRunning ? "border-indigo-500 animate-pulse bg-indigo-500" :
                          "border-slate-300 dark:border-slate-700"
                        )} />

                        <div className="space-y-0.5">
                          <h4 className={cn(
                            "text-xs font-bold",
                            isStepCompleted ? "text-emerald-600 dark:text-emerald-400" :
                            isStepFailed ? "text-rose-600 dark:text-rose-400" :
                            isStepRunning ? "text-indigo-600 dark:text-indigo-400" :
                            "text-slate-400 dark:text-slate-600"
                          )}>
                            {step.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {step.message}
                          </p>
                          {step.timestamp && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              {step.timestamp}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      ) : (
        /* Exec Logs History Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          {logs.length === 0 ? (
            <div className="text-center py-20">
              <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-4">Chưa có lịch sử thực thi</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Các quy trình tự động hóa đã hoàn thành sẽ hiển thị nhật ký chi tiết tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{log.candidateName}</h4>
                          <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{log.role}</span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          ID: {log.id} • Bắt đầu: {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold border",
                          log.status === 'completed' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                          log.status === 'failed' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                        )}>
                          {log.status === 'completed' ? 'Hoàn thành' : log.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                        </span>

                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Steps logs detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 overflow-hidden"
                        >
                          <div className="space-y-4 pl-4 border-l border-slate-100 dark:border-slate-800">
                            {log.steps.map((step, idx) => (
                              <div key={idx} className="flex gap-3 items-start text-xs">
                                {getStepIcon(step.status)}
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{step.name}</span>
                                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{step.message}</p>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{step.timestamp}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
