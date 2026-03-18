import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type Task = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  priority: string;
  client_name: string | null;
  description: string | null;
  weekday: number | null;
  created_at: string;
};

// A calendar entry: either a regular task or one occurrence of a recurring task
type CalendarEntry = {
  task: Task;
  dateKey: string;
  isRecurring: boolean;
  isDone: boolean;
};

type Profile = {
  user_id: string;
  full_name: string;
};

type Completion = {
  task_id: string;
  completion_date: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
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
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === 'admin';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedMiniDay, setSelectedMiniDay] = useState<number | null>(null);
  const [selectedMainDay, setSelectedMainDay] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['calendar-tasks'] });
    qc.invalidateQueries({ queryKey: ['recurring-completions'] });
    qc.invalidateQueries({ queryKey: ['my-tasks'] });
  };

  const toggleEntryStatus = async (entry: CalendarEntry) => {
    if (entry.isRecurring) {
      if (entry.isDone) {
        // Remove completion
        await supabase
          .from('recurring_task_completions')
          .delete()
          .eq('task_id', entry.task.id)
          .eq('completion_date', entry.dateKey);
        toast.success('Reaberta');
      } else {
        // Add completion
        const { error } = await supabase.from('recurring_task_completions').insert({
          task_id: entry.task.id,
          completion_date: entry.dateKey,
          completed_by: user!.id,
        });
        if (error) { toast.error('Erro ao atualizar'); return; }
        toast.success('Marcada como concluída');
      }
    } else {
      const newStatus = entry.isDone ? 'todo' : 'done';
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', entry.task.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success(newStatus === 'done' ? 'Marcada como concluída' : 'Reaberta');
    }
    invalidate();
  };

  const { data: allTasks = [] } = useQuery({
    queryKey: ['calendar-tasks', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (!isAdmin) {
        query = query.eq('assigned_to', user!.id);
      }
      const { data } = await query;
      return ((data || []) as Task[]).filter(t => t.due_date || t.weekday != null);
    },
    enabled: !!user,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['recurring-completions', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${getDaysInMonth(year, month)}`;
      const { data } = await supabase
        .from('recurring_task_completions')
        .select('task_id, completion_date')
        .gte('completion_date', startDate)
        .lte('completion_date', endDate);
      return (data || []) as Completion[];
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

  const completionSet = useMemo(() => {
    const set = new Set<string>();
    completions.forEach(c => set.add(`${c.task_id}:${c.completion_date}`));
    return set;
  }, [completions]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = now.toISOString().slice(0, 10);

  const jsWeekdayToOurs = (jsDay: number) => jsDay === 0 ? 6 : jsDay - 1;

  // Build calendar entries per date
  const entriesByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};

    const addEntry = (dateKey: string, entry: CalendarEntry) => {
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(entry);
    };

    allTasks.forEach(t => {
      // Regular tasks with due_date
      if (t.due_date && t.weekday == null) {
        const dateKey = t.due_date.slice(0, 10);
        addEntry(dateKey, {
          task: t,
          dateKey,
          isRecurring: false,
          isDone: t.status === 'done',
        });
      }

      // Recurring weekday tasks — limit to 4 per month
      if (t.weekday != null) {
        const createdDate = new Date(t.created_at || '2000-01-01');
        const monthStart = new Date(year, month, 1);
        if (monthStart >= new Date(createdDate.getFullYear(), createdDate.getMonth(), 1)) {
          let count = 0;
          for (let d = 1; d <= daysInMonth && count < 4; d++) {
            const date = new Date(year, month, d);
            if (jsWeekdayToOurs(date.getDay()) === t.weekday) {
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isDone = completionSet.has(`${t.id}:${dateKey}`);
              addEntry(dateKey, {
                task: t,
                dateKey,
                isRecurring: true,
                isDone,
              });
              count++;
            }
          }
        }
      }
    });
    return map;
  }, [allTasks, year, month, daysInMonth, completionSet]);

  // Day status for mini calendar
  const dayStatus = useMemo(() => {
    const map: Record<number, boolean> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const entries = entriesByDate[dateStr];
      if (!entries || entries.length === 0) continue;
      if (dayDate <= now) {
        const allDone = entries.every(e => e.isDone);
        map[d] = allDone;
      }
    }
    return map;
  }, [entriesByDate, year, month, daysInMonth, now]);

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

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[120px] border border-white/5 bg-white/[0.01]" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const entries = entriesByDate[dateStr] || [];

      cells.push(
        <button
          key={d}
          onClick={() => setSelectedMainDay(prev => prev === d ? null : d)}
          className={`min-h-[120px] border border-white/5 p-2 transition-colors text-left ${
            isToday ? 'bg-brand-orange/5 border-brand-orange/20' : 'bg-white/[0.01] hover:bg-white/[0.03]'
          } ${selectedMainDay === d ? 'ring-1 ring-brand-orange/40' : ''}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-mono ${isToday ? 'text-brand-orange font-bold' : 'text-white/40'}`}>
              {d}
            </span>
            {entries.length > 0 && (
              <span className="text-[9px] font-mono text-white/20">{entries.length}</span>
            )}
          </div>
          <div className="space-y-1 overflow-hidden max-h-[80px]">
            {entries.slice(0, 3).map((entry, idx) => {
              const assignee = entry.task.assigned_to ? profileMap[entry.task.assigned_to] : null;
              const firstName = assignee?.split(' ')[0] || '?';
              const priorityClass = PRIORITY_COLORS[entry.task.priority] || PRIORITY_COLORS.medium;

              return (
                <div
                  key={`${entry.task.id}-${idx}`}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md border text-[10px] leading-tight ${
                    entry.isDone ? 'opacity-40 line-through border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300/60' : priorityClass
                  }`}
                >
                  {entry.isDone && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                  <span className="truncate flex-1">{entry.task.title}</span>
                  <span className="text-white/30 shrink-0">{firstName}</span>
                </div>
              );
            })}
            {entries.length > 3 && (
              <p className="text-[9px] text-white/20 font-mono pl-1">+{entries.length - 3} mais</p>
            )}
          </div>
        </button>
      );
    }

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
      const status = dayStatus[d];

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
  const monthEntries = useMemo(() => {
    const all: CalendarEntry[] = [];
    Object.values(entriesByDate).forEach(entries => all.push(...entries));
    return all;
  }, [entriesByDate]);

  const completedCount = monthEntries.filter(e => e.isDone).length;
  const overdueCount = monthEntries.filter(e => {
    if (e.isDone) return false;
    const entryDate = new Date(e.dateKey);
    return entryDate < now;
  }).length;

  const renderEntryCard = (entry: CalendarEntry, showToggle: boolean) => {
    const assignee = entry.task.assigned_to ? profileMap[entry.task.assigned_to] : null;
    const priorityLabel = entry.task.priority === 'high' ? 'Alta' : entry.task.priority === 'low' ? 'Baixa' : 'Média';

    return (
      <div
        key={`${entry.task.id}-${entry.dateKey}`}
        className={`px-4 py-3 rounded-xl border transition-colors ${
          entry.isDone
            ? 'border-emerald-500/15 bg-emerald-500/5'
            : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {entry.isDone
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-white/20 shrink-0" />
              }
              <span className={`text-sm font-medium ${entry.isDone ? 'text-emerald-300/80 line-through' : 'text-white/80'}`}>
                {entry.task.title}
              </span>
              {entry.isRecurring && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 text-blue-400/60 bg-blue-500/5">
                  RECORRENTE
                </span>
              )}
            </div>
            {entry.task.description && (
              <p className="text-xs text-white/30 mt-1 ml-6 line-clamp-2">{entry.task.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${PRIORITY_COLORS[entry.task.priority] || PRIORITY_COLORS.medium}`}>
              {priorityLabel}
            </span>
            {entry.task.client_name && (
              <span className="text-[10px] font-mono text-white/25">{entry.task.client_name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-6">
          <span className="text-[10px] font-mono text-white/30">
            Responsável: <span className="text-white/50">{assignee || 'Não atribuído'}</span>
          </span>
          <span className={`text-[10px] font-mono ${entry.isDone ? 'text-emerald-400/60' : 'text-yellow-400/60'}`}>
            • {entry.isDone ? 'Concluída' : 'Pendente'}
          </span>
          {showToggle && isAdmin && (
            <button
              onClick={() => toggleEntryStatus(entry)}
              className={`ml-auto flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
                entry.isDone
                  ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {entry.isDone ? <RotateCcw className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {entry.isDone ? 'Reabrir' : 'Concluir'}
            </button>
          )}
        </div>
      </div>
    );
  };

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
            {isAdmin ? 'Visão completa de todas as entregas da equipe' : 'Suas entregas e prazos'}
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Calendar */}
        <div className="flex-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
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

            <div className="grid grid-cols-7 border-b border-white/5">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-[10px] font-mono uppercase text-white/25 py-2.5 tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {renderMainCalendar()}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedMainDay !== null && (() => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedMainDay).padStart(2, '0')}`;
            const dayEntries = entriesByDate[dateStr] || [];

            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-serif text-white">
                    {selectedMainDay} de {MONTH_NAMES[month]}
                  </h3>
                  <button onClick={() => setSelectedMainDay(null)} className="text-white/20 hover:text-white/50 text-sm px-2">✕</button>
                </div>

                {dayEntries.length === 0 ? (
                  <p className="text-xs text-white/20 font-mono">Nenhuma tarefa agendada para este dia.</p>
                ) : (
                  <div className="space-y-2">
                    {dayEntries.map(entry => renderEntryCard(entry, true))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Sidebar */}
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
            const dayEntries = entriesByDate[dateStr] || [];
            const completed = dayEntries.filter(e => e.isDone);
            const pending = dayEntries.filter(e => !e.isDone);

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
                    {completed.map(entry => (
                      <div key={`${entry.task.id}-${entry.dateKey}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-xs text-emerald-300/80 truncate flex-1">{entry.task.title}</span>
                        <span className="text-[9px] text-white/25 font-mono shrink-0">
                          {entry.task.assigned_to ? profileMap[entry.task.assigned_to]?.split(' ')[0] : '?'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => toggleEntryStatus(entry)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors shrink-0"
                            title="Reabrir tarefa"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {pending.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-red-400/70 tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-3 h-3" /> Pendentes
                    </p>
                    {pending.map(entry => (
                      <div key={`${entry.task.id}-${entry.dateKey}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                        <span className="text-xs text-red-300/80 truncate flex-1">{entry.task.title}</span>
                        <span className="text-[9px] text-white/25 font-mono shrink-0">
                          {entry.task.assigned_to ? profileMap[entry.task.assigned_to]?.split(' ')[0] : '?'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => toggleEntryStatus(entry)}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                            title="Marcar como concluída"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {dayEntries.length === 0 && (
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
                <span className="text-sm font-serif text-white">{monthEntries.length}</span>
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-white/25">Progresso</span>
                  <span className="text-[10px] font-mono text-white/25">
                    {monthEntries.length > 0 ? Math.round((completedCount / monthEntries.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-orange to-emerald-500 transition-all duration-500"
                    style={{ width: `${monthEntries.length > 0 ? (completedCount / monthEntries.length) * 100 : 0}%` }}
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
