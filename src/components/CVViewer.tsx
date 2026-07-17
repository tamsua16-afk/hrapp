import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Highlighter, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface CVViewerProps {
  cvText: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export default function CVViewer({ cvText, matchedSkills, missingSkills }: CVViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightMode, setHighlightMode] = useState<'all' | 'matched' | 'missing' | 'none'>('all');

  // Simple escaping for regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const getHighlightedText = (text: string) => {
    if (!text) return <span className="text-slate-400 italic">Hồ sơ này không có văn bản hoặc chưa được trích xuất thành công.</span>;
    
    // We will build a list of patterns to match
    interface Replacement {
      word: string;
      type: 'search' | 'matched' | 'missing';
      start: number;
      end: number;
    }
    
    let matches: Replacement[] = [];

    // 1. Search term match
    if (searchTerm.trim().length >= 2) {
      const regex = new RegExp(escapeRegExp(searchTerm.trim()), 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          word: match[0],
          type: 'search',
          start: match.index,
          end: regex.lastIndex
        });
      }
    }

    // 2. Matched skills highlight
    if (highlightMode === 'all' || highlightMode === 'matched') {
      matchedSkills.forEach(skill => {
        if (skill.length < 2) return;
        const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b|${escapeRegExp(skill)}`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            word: match[0],
            type: 'matched',
            start: match.index,
            end: regex.lastIndex
          });
        }
      });
    }

    // 3. Missing skills highlight (though missing, maybe we find partial mentions or related keyword)
    if (highlightMode === 'all' || highlightMode === 'missing') {
      missingSkills.forEach(skill => {
        if (skill.length < 2) return;
        const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b|${escapeRegExp(skill)}`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            word: match[0],
            type: 'missing',
            start: match.index,
            end: regex.lastIndex
          });
        }
      });
    }

    // Sort matches by start position, remove overlapping matches
    matches.sort((a, b) => a.start - b.start);
    
    const filteredMatches: Replacement[] = [];
    let lastEnd = 0;
    
    matches.forEach(m => {
      if (m.start >= lastEnd) {
        filteredMatches.push(m);
        lastEnd = m.end;
      }
    });

    // Construct the elements
    const elements: React.ReactNode[] = [];
    let cursor = 0;
    
    filteredMatches.forEach((m, idx) => {
      // Unmatched text before
      if (m.start > cursor) {
        elements.push(text.slice(cursor, m.start));
      }
      
      // Highlighted term
      const highlightClass = cn(
        "px-0.5 rounded font-bold transition-colors duration-200",
        m.type === 'search' && "bg-yellow-200 text-yellow-900 border-b-2 border-yellow-400",
        m.type === 'matched' && "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-b border-green-400/50",
        m.type === 'missing' && "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-b border-red-400/50"
      );
      
      elements.push(
        <mark key={`highlight-${idx}`} className={highlightClass}>
          {text.slice(m.start, m.end)}
        </mark>
      );
      
      cursor = m.end;
    });

    if (cursor < text.length) {
      elements.push(text.slice(cursor));
    }

    return elements;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[650px]">
      {/* Header and Controls */}
      <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Nội dung CV chi tiết
          </h3>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            {[
              { id: 'all', label: 'Tô sáng tất cả' },
              { id: 'matched', label: 'Khớp CV' },
              { id: 'none', label: 'Không tô sáng' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHighlightMode(tab.id as any)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg transition-all",
                  highlightMode === tab.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm từ khóa trong nội dung CV..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>

      {/* CV Content text container */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap select-text selection:bg-indigo-150 custom-scrollbar max-h-[480px]">
        {getHighlightedText(cvText)}
      </div>

      {/* Legend footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-400 mt-2 select-none">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-green-500/80 rounded"/>
          Kỹ năng tương thích
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-red-400/80 rounded"/>
          Từ khóa liên quan/thiếu
        </span>
        {searchTerm.trim().length >= 2 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-yellow-400 rounded"/>
            Từ khóa tìm kiếm
          </span>
        )}
      </div>
    </div>
  );
}
