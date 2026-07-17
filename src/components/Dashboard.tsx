import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Briefcase, 
  AlertCircle, 
  Star, 
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// Matching with App.tsx Candidate interface
interface Candidate {
  id: string;
  name: string;
  fileName: string;
  result?: {
    score: number;
    recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
    summary: string;
    criteriaScores?: {
      technical: number;
      experience: number;
      softSkills: number;
      education: number;
    };
  };
  status: 'idle' | 'processing' | 'completed' | 'error';
  group: string;
  isTransferred?: boolean;
  interviewData?: {
    finalDecision: 'recommend' | 'consider' | 'reject' | null;
  };
}

interface DashboardProps {
  candidates: Candidate[];
  onSelectCandidate: (id: string) => void;
  setActiveTab: (tab: 'hr' | 'manager') => void;
}

export default function Dashboard({ candidates, onSelectCandidate, setActiveTab }: DashboardProps) {
  const completedCandidates = candidates.filter(c => c.status === 'completed');
  
  // 1. Total count
  const totalCount = candidates.length;
  
  // 2. Average match score (recalculated or raw)
  const averageScore = completedCandidates.length > 0
    ? Math.round(completedCandidates.reduce((acc, c) => acc + (c.result?.score || 0), 0) / completedCandidates.length)
    : 0;

  // 3. Recommended for hire
  const strongHires = completedCandidates.filter(c => c.result?.recommendation === 'Strong Hire' || c.result?.recommendation === 'Hire').length;
  const recommendPercentage = totalCount > 0 ? Math.round((strongHires / totalCount) * 100) : 0;

  // 4. In Interview / Transferred
  const interviewCount = candidates.filter(c => c.isTransferred).length;

  // Score distribution ranges: 0-20, 21-40, 41-60, 61-80, 81-100
  const distribution = [0, 0, 0, 0, 0];
  completedCandidates.forEach(c => {
    const score = c.result?.score || 0;
    if (score <= 20) distribution[0]++;
    else if (score <= 40) distribution[1]++;
    else if (score <= 60) distribution[2]++;
    else if (score <= 80) distribution[3]++;
    else distribution[4]++;
  });

  const maxDistributionCount = Math.max(...distribution, 1);

  // Decision breakdown
  const decisions = {
    recommend: candidates.filter(c => c.interviewData?.finalDecision === 'recommend').length,
    consider: candidates.filter(c => c.interviewData?.finalDecision === 'consider').length,
    reject: candidates.filter(c => c.interviewData?.finalDecision === 'reject').length,
    none: candidates.filter(c => c.isTransferred && !c.interviewData?.finalDecision).length
  };

  // Group distribution
  const groupStats: { [key: string]: { count: number; totalScore: number; completedCount: number } } = {};
  candidates.forEach(c => {
    if (!groupStats[c.group]) {
      groupStats[c.group] = { count: 0, totalScore: 0, completedCount: 0 };
    }
    groupStats[c.group].count++;
    if (c.status === 'completed' && c.result) {
      groupStats[c.group].completedCount++;
      groupStats[c.group].totalScore += c.result.score;
    }
  });

  const groupList = Object.entries(groupStats).map(([name, stat]) => ({
    name,
    count: stat.count,
    avgScore: stat.completedCount > 0 ? Math.round(stat.totalScore / stat.completedCount) : 0
  })).sort((a, b) => b.count - a.count);

  // Top candidates
  const topCandidates = [...completedCandidates]
    .sort((a, b) => (b.result?.score || 0) - (a.result?.score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Tổng số ứng viên", 
            value: totalCount, 
            subtitle: `${candidates.filter(c => c.status === 'processing').length} đang xử lý...`,
            icon: Users,
            color: "from-indigo-500 to-blue-500",
            bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          },
          { 
            title: "Điểm tương thích TB", 
            value: `${averageScore}%`, 
            subtitle: `Dựa trên ${completedCandidates.length} ứng viên`,
            icon: TrendingUp,
            color: "from-violet-500 to-purple-500",
            bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
          },
          { 
            title: "Ứng viên Tiềm năng", 
            value: strongHires, 
            subtitle: `${recommendPercentage}% tổng số hồ sơ`,
            icon: Award,
            color: "from-emerald-500 to-teal-500",
            bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          },
          { 
            title: "Chờ Phỏng vấn", 
            value: interviewCount, 
            subtitle: `${decisions.recommend} đã được duyệt tuyển`,
            icon: UserCheck,
            color: "from-amber-500 to-orange-500",
            bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex items-center justify-between group"
          >
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</span>
              <h3 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.subtitle}</p>
            </div>
            <div className={cn("p-4 rounded-2xl relative z-10 transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className={cn("absolute -right-16 -bottom-16 w-32 h-32 rounded-full opacity-10 bg-gradient-to-tr blur-2xl", stat.color)} />
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts and Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Score Distribution Chart */}
        <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Phân bố điểm số tương thích</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Biểu thị số lượng ứng viên theo các nhóm khoảng điểm</p>
          </div>
          
          <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 border-b border-slate-100 dark:border-slate-800 px-4">
            {['0 - 20', '21 - 40', '41 - 60', '61 - 80', '81 - 100'].map((label, idx) => {
              const val = distribution[idx];
              const pct = (val / maxDistributionCount) * 100;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    {val > 0 && (
                      <span className="absolute -top-7 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        {val} hồ sơ
                      </span>
                    )}
                    <div 
                      style={{ height: `${val > 0 ? Math.max(pct, 6) : 2}%` }}
                      className={cn(
                        "w-full sm:w-16 rounded-t-xl transition-all duration-700",
                        val === 0 ? "bg-slate-100 dark:bg-slate-800" :
                        idx === 4 ? "bg-gradient-to-t from-emerald-500 to-teal-400" :
                        idx === 3 ? "bg-gradient-to-t from-indigo-500 to-violet-400" :
                        idx === 2 ? "bg-gradient-to-t from-blue-500 to-cyan-400" :
                        idx === 1 ? "bg-gradient-to-t from-amber-500 to-orange-400" :
                        "bg-gradient-to-t from-red-500 to-rose-400"
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 pb-2 text-center select-none">{label}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"/>Xuất sắc (81-100)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"/>Khá (61-80)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"/>Trung bình (21-60)</span>
            </div>
            <button 
              onClick={() => setActiveTab('hr')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Xem tất cả danh sách →
            </button>
          </div>
        </section>

        {/* Interview Decision Breakdown */}
        <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Kết quả phỏng vấn</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đánh giá chung sau phỏng vấn</p>
          </div>

          <div className="py-6 space-y-4 flex-1 flex flex-col justify-center">
            {[
              { label: "Đề xuất tuyển", count: decisions.recommend, color: "bg-green-500", text: "text-green-600 dark:text-green-400" },
              { label: "Cân nhắc thêm", count: decisions.consider, color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
              { label: "Từ chối", count: decisions.reject, color: "bg-red-500", text: "text-red-600 dark:text-red-400" },
              { label: "Chưa quyết định", count: decisions.none, color: "bg-slate-300 dark:bg-slate-600", text: "text-slate-400" }
            ].map(item => {
              const total = decisions.recommend + decisions.consider + decisions.reject + decisions.none || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", item.color)}/>
                      {item.label}
                    </span>
                    <span>{item.count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", item.color)} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => setActiveTab('manager')}
            className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline border-t border-slate-100 dark:border-slate-800 pt-4"
          >
            Đến phòng phỏng vấn →
          </button>
        </section>
      </div>

      {/* Roles and Top Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Candidates by role */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Phân loại vị trí tuyển dụng</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Danh sách vị trí có ứng viên ứng tuyển</p>
          </div>

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {groupList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic">
                Chưa có dữ liệu phân loại.
              </div>
            ) : (
              groupList.map(group => (
                <div key={group.name} className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{group.name}</h4>
                    <p className="text-xs text-slate-400">{group.count} hồ sơ</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-extrabold inline-block",
                      group.avgScore >= 80 ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" :
                      group.avgScore >= 60 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" :
                      group.avgScore > 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>
                      {group.avgScore > 0 ? `${group.avgScore}% Match` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top Candidates */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Top ứng viên nổi bật</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Các ứng viên có điểm số tương thích cao nhất được AI đánh giá</p>
          </div>

          <div className="space-y-3">
            {topCandidates.length === 0 ? (
              <div className="text-center py-16 text-slate-400 italic">
                Chưa có dữ liệu ứng viên phù hợp. Hãy tải lên CV và phân tích ở trang Sàng lọc!
              </div>
            ) : (
              topCandidates.map(c => (
                <div 
                  key={c.id}
                  onClick={() => onSelectCandidate(c.id)}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-2xl shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.group}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{c.result?.score}%</span>
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg",
                      c.result?.recommendation === 'Strong Hire' ? "bg-green-100 dark:bg-green-950/30 text-green-700" :
                      c.result?.recommendation === 'Hire' ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700" :
                      c.result?.recommendation === 'Maybe' ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700" : "bg-red-100 dark:bg-red-950/30 text-red-700"
                    )}>
                      {c.result?.recommendation}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
