import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithCV } from '../lib/gemini';
import { cn } from '../lib/utils';


interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  cvText: string;
  jdText: string;
}

const SUGGESTED_QUESTIONS = [
  "Tóm tắt 3 dự án nổi bật nhất của ứng viên này?",
  "Ứng viên có những kỹ năng nào phù hợp nhất với JD?",
  "Liệt kê các điểm cần chất vấn thêm trong buổi phỏng vấn?",
  "Ứng viên có kinh nghiệm quản lý hay làm việc nhóm không?",
];

export default function AICopilot({ isOpen, onClose, candidateName, cvText, jdText }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset chat and add welcome message
      setMessages([
        {
          role: 'model',
          text: `Xin chào! Tôi là Trợ lý Tuyển dụng AI. Tôi đã đọc CV của ứng viên **${candidateName}** và đối chiếu với JD của bạn. Bạn muốn tôi làm rõ điều gì về ứng viên này?`
        }
      ]);
    }
  }, [isOpen, candidateName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Exclude first welcome message from API history to avoid clutter
      const apiHistory = messages
        .slice(1)
        .map(msg => ({ role: msg.role, text: msg.text }));

      const reply = await chatWithCV(cvText, jdText, text, apiHistory);
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error: any) {
      console.error("Error chatting with CV:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Rất tiếc, đã xảy ra lỗi trong quá trình phân tích: ${error?.message || 'Không rõ nguyên nhân'}. Vui lòng thử lại.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        text: `Tôi đã làm sạch lịch sử chat. Hãy bắt đầu đặt câu hỏi mới về ứng viên **${candidateName}**!`
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-slate-900/50 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white">AI Copilot Trợ lý CV</h3>
            <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Ứng viên: {candidateName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Làm mới cuộc hội thoại"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex gap-3 max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white ml-auto rounded-tr-none" 
                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 mr-auto rounded-tl-none"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {msg.role === 'user' ? (
                <User className="w-4 h-4 opacity-75" />
              ) : (
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div className="whitespace-pre-line font-medium">{msg.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] rounded-2xl p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-slate-500 mr-auto rounded-tl-none shadow-sm items-center">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold">AI đang đọc CV và trả lời...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        {/* Suggestion tags (only shown if history has only welcome message) */}
        {messages.length <= 2 && !isLoading && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gợi ý câu hỏi:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-xs bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-800 rounded-lg px-2.5 py-1.5 transition-all font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
            placeholder="Hỏi về kinh nghiệm, học vấn, kỹ năng..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
