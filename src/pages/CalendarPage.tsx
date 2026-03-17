import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  priority: string;
  client_name: string | null;
};

type Profile = {
  user_id: string;
  full_name: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday-first
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function CalendarPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedMiniDay, setSelectedMiniDay] = useState<number | null>(null);

  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks-calendar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });
      return (data || []) as Task[];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return (data || []) as Profile[];
    },
    enabled: !!user,
  });

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    profiles.forEach(p => { map[p.user_id] = p.full_name; });
    return map;
  }, [profiles]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = now.toISOString().slice(0, 10);

  // Group tasks by date (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    allTasks.forEach(t => {
      if (!t.due_date) return;
      const dateKey = t.due_date.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [allTasks]);

  // Day status for mini calendar: true = all done, false = has overdue, undefined = no tasks
  const dayStatus = useMemo(() => {
    const map: Record<number, boolean> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const tasks = tasksByDate[dateStr];
      if (!tasks || tasks.length === 0) continue;
      // Only evaluate past & today
      if (dayDate <= now) {
        const allDone = tasks.every(t => t.status === 'done');
        map[d] = allDone;
      }
    }
    return map;
  }, [tasksByDate, year, month, daysInMonth, now]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const renderMainCalendar = () => {
    const cells: React.ReactNode[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[120px] border border-white/5 bg-white/[0.01]" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const tasks = tasksByDate[dateStr] || [];

      cells.push(
        <div
          key={d}
          className={`min-h-[120px] border border-white/5 p-2 transition-colors ${
            isToday ? 'bg-brand-orange/5 border-brand-orange/20' : 'bg-white/[0.01] hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-mono ${isToday ? 'text-brand-orange font-bold' : 'text-white/40'}`}>
              {d}
            </span>
            {tasks.length > 0 && (
              <span className="text-[9px] font-mono text-white/20">{tasks.length}</span>
            )}
          </div>
          <div className="space-y-1 overflow-hidden max-h-[80px]">
            {tasks.slice(0, 3).map(task => {
              const assignee = task.assigned_to ? profileMap[task.assigned_to] : null;
              const firstName = assignee?.split(' ')[0] || '?';
              const priorityClass = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md border text-[10px] leading-tight ${
                    isDone ? 'opacity-40 line-through border-white/5 bg-white/[0.02] text-white/30' : priorityClass
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                  <span className="truncate flex-1">{task.title}</span>
                  <span className="text-white/30 shrink-0">{firstName}</span>
                </div>
              );
            })}
            {tasks.length > 3 && (
              <p className="text-[9px] text-white/20 font-mono pl-1">+{tasks.length - 3} mais</p>
            )}
          </div>
        </div>
      );
    }

    // Fill remaining cells to complete grid
    const totalCells = firstDay + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(<div key={`pad-${i}`} className="min-h-[120px] border border-white/5 bg-white/[0.01]" />);
      }
    }

    return cells;
  };

  const renderMiniCalendar = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`me-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
      const status = dayStatus[d]; // true=green, false=red, undefined=neutral

      let dotClass = '';
      if (status === true) dotClass = 'bg-emerald-500';
      else if (status === false) dotClass = 'bg-red-500';

      cells.push(
        <button
          key={d}
          onClick={() => status !== undefined ? setSelectedMiniDay(prev => prev === d ? null : d) : undefined}
          className={`relative flex flex-col items-center justify-center aspect-square rounded-lg transition-colors ${
            isToday ? 'bg-brand-orange/15 border border-brand-orange/30' : status !== undefined ? 'hover:bg-white/5 cursor-pointer' : ''
          } ${selectedMiniDay === d ? 'ring-1 ring-brand-orange/50' : ''}`}
        >
          <span className={`text-xs font-mono ${
            isToday ? 'text-brand-orange font-bold' : status === true ? 'text-emerald-400' : status === false ? 'text-red-400' : 'text-white/40'
          }`}>
            {d}
          </span>
          {dotClass && (
            <div className={`w-1.5 h-1.5 rounded-full ${dotClass} mt-0.5`} />
          )}
        </button>
      );
    }

    return cells;
  };

  // Stats
  const monthTasks = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return allTasks.filter(t => t.due_date?.startsWith(prefix));
  }, [allTasks, year, month]);

  const completedCount = monthTasks.filter(t => t.status === 'done').length;
  const overdueCount = monthTasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-brand-orange" />
            Calendário <span className="italic">Geral</span>
          </h1>
          <p className="text-white/40 text-sm font-mono mt-2">
            Visão completa de todas as entregas da equipe
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Calendar */}
        <div className="flex-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <button onClick={prevMonth} className="text-white/30 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-serif text-white">
                {MONTH_NAMES[month]} <span className="text-white/30">{year}</span>
              </h2>
              <button onClick={nextMonth} className="text-white/30 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-[10px] font-mono uppercase text-white/25 py-2.5 tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {renderMainCalendar()}
            </div>
          </div>
        </div>

        {/* Sidebar: Mini Calendar + Stats */}
        <div className="w-full xl:w-72 space-y-5">
          {/* Mini Calendar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-serif text-white">Status do Mês</h3>
              <div className="flex items-center gap-3 text-[9px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> OK</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Atrasada</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-[8px] font-mono uppercase text-white/20 py-1">
                  {d.charAt(0)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {renderMiniCalendar()}
            </div>
          </div>

          {/* Day detail panel */}
          {selectedMiniDay !== null && (() => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedMiniDay).padStart(2, '0')}`;
            const dayTasks = tasksByDate[dateStr] || [];
            const completed = dayTasks.filter(t => t.status === 'done');
            const overdue = dayTasks.filter(t => t.status !== 'done');

            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif text-white">
                    Dia {selectedMiniDay}
                  </h3>
                  <button onClick={() => setSelectedMiniDay(null)} className="text-white/20 hover:text-white/50 text-xs">✕</button>
                </div>

                {completed.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-emerald-400/70 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Concluídas
                    </p>
                    {completed.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-xs text-emerald-300/80 truncate flex-1">{t.title}</span>
                        <span className="text-[9px] text-white/25 font-mono shrink-0">
                          {t.assigned_to ? profileMap[t.assigned_to]?.split(' ')[0] : '?'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {overdue.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-red-400/70 tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-3 h-3" /> Atrasadas
                    </p>
                    {overdue.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                        <span className="text-xs text-red-300/80 truncate flex-1">{t.title}</span>
                        <span className="text-[9px] text-white/25 font-mono shrink-0">
                          {t.assigned_to ? profileMap[t.assigned_to]?.split(' ')[0] : '?'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {dayTasks.length === 0 && (
                  <p className="text-xs text-white/20 font-mono">Nenhuma tarefa neste dia.</p>
                )}
              </div>
            );
          })()}

          {/* Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-serif text-white">Resumo do Mês</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-mono">Total de entregas</span>
                <span className="text-sm font-serif text-white">{monthTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Concluídas
                </span>
                <span className="text-sm font-serif text-emerald-400">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-mono flex items-center gap-1.5">
                  <XCircle className="w-3 h-3 text-red-400" /> Atrasadas
                </span>
                <span className="text-sm font-serif text-red-400">{overdueCount}</span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-white/25">Progresso</span>
                  <span className="text-[10px] font-mono text-white/25">
                    {monthTasks.length > 0 ? Math.round((completedCount / monthTasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-orange to-emerald-500 transition-all duration-500"
                    style={{ width: `${monthTasks.length > 0 ? (completedCount / monthTasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
