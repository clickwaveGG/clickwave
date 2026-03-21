import { useState, useMemo, DragEvent } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, XCircle, RotateCcw,
  Video, Palette, Globe, Megaphone, Bot, Package, GripVertical, Calendar as CalendarIcon,
  Clapperboard, Send, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  capture_date: string | null;
  created_at: string;
  price: number | null;
};

type CalendarEntry = {
  task: Task;
  dateKey: string;
  isRecurring: boolean;
  isDone: boolean;
};

type Profile = {
  user_id: string;
  full_name: string;
  position: string | null;
};

type Completion = {
  task_id: string;
  completion_date: string;
};

type PendingService = {
  id: string;
  service_name: string;
  client_name: string;
  client_id: string;
  quantity_per_month: number | null;
  responsible_id: string | null;
  is_recurring: boolean;
  notes: string | null;
};

type ServiceDragData = PendingService & { dragType: 'entrega' | 'gravacao' };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function getServiceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('vídeo') || n.includes('video')) return Video;
  if (n.includes('design') || n.includes('post') || n.includes('branding')) return Palette;
  if (n.includes('site') || n.includes('landing')) return Globe;
  if (n.includes('tráfego') || n.includes('trafego')) return Megaphone;
  if (n.includes('automação') || n.includes('automacao') || n.includes('chatbot')) return Bot;
  return Package;
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
  const { user, role, profile: userProfile } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === 'admin';
  const isVideomaker = userProfile?.position === 'Videomaker';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedMiniDay, setSelectedMiniDay] = useState<number | null>(null);
  const [selectedMainDay, setSelectedMainDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [serviceDragTypes, setServiceDragTypes] = useState<Record<string, 'entrega' | 'gravacao'>>({});
  // Capture date dialog state (videomaker only)
  const [captureDialog, setCaptureDialog] = useState<{
    taskId: string;
    taskTitle: string;
    deliveryDate: string;
  } | null>(null);
  const [captureDate, setCaptureDate] = useState<Date | undefined>(undefined);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['calendar-tasks'] });
    qc.invalidateQueries({ queryKey: ['recurring-completions'] });
    qc.invalidateQueries({ queryKey: ['my-tasks'] });
    qc.invalidateQueries({ queryKey: ['pending-services'] });
  };

  const toggleEntryStatus = async (entry: CalendarEntry) => {
    if (entry.isRecurring) {
      if (entry.isDone) {
        await supabase
          .from('recurring_task_completions')
          .delete()
          .eq('task_id', entry.task.id)
          .eq('completion_date', entry.dateKey);
        toast.success('Reaberta');
      } else {
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

  // Fetch tasks
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

  // Fetch pending services for sidebar (user's services without tasks with due_date this month)
  const { data: userServices = [] } = useQuery({
    queryKey: ['pending-services', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_services')
        .select('*, clients(name)')
        .eq('responsible_id', user!.id);
      return (data || []).map((s: any) => ({
        ...s,
        client_name: s.clients?.name || 'Sem cliente',
      })) as PendingService[];
    },
    enabled: !!user,
  });

  // Fetch all user tasks to know which services already have scheduled tasks
  const { data: allUserTasks = [] } = useQuery({
    queryKey: ['all-user-tasks-for-calendar', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, client_name, due_date, capture_date, status')
        .eq('assigned_to', user!.id);
      return data || [];
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
      const { data } = await supabase.from('profiles').select('user_id, full_name, position');
      return (data || []) as Profile[];
    },
    enabled: !!user,
  });

  // Create task mutation (for drag-and-drop scheduling)
  const createTaskMutation = useMutation({
    mutationFn: async ({ service, dateStr, captureDateStr }: { service: PendingService; dateStr: string; captureDateStr?: string }) => {
      const { error } = await supabase.from('tasks').insert({
        title: `${service.service_name} — ${service.client_name}`,
        status: 'todo',
        priority: 'medium',
        assigned_to: service.responsible_id || user!.id,
        created_by: user!.id,
        client_name: service.client_name,
        due_date: dateStr,
        capture_date: captureDateStr || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Tarefa agendada no calendário!');
    },
    onError: () => toast.error('Erro ao agendar tarefa'),
  });

  // Save capture date mutation
  const saveCaptureDate = async () => {
    if (!captureDialog || !captureDate) return;
    await supabase.from('tasks').update({
      capture_date: format(captureDate, 'yyyy-MM-dd'),
    }).eq('id', captureDialog.taskId);
    toast.success('Data de gravação definida!');
    setCaptureDialog(null);
    setCaptureDate(undefined);
    invalidate();
  };

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
      if (t.due_date && t.weekday == null) {
        const dateKey = t.due_date.slice(0, 10);
        addEntry(dateKey, { task: t, dateKey, isRecurring: false, isDone: t.status === 'done' });
      }
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
              addEntry(dateKey, { task: t, dateKey, isRecurring: true, isDone });
              count++;
            }
          }
        }
      }
    });
    return map;
  }, [allTasks, year, month, daysInMonth, completionSet]);

  // Build pending services sidebar — group by client, count scheduled tasks
  const pendingByClient = useMemo(() => {
    const map = new Map<string, { name: string; services: (PendingService & { scheduledCount: number })[] }>();

    userServices.forEach((s: any) => {
      const qty = s.quantity_per_month || 1;
      // Count tasks already scheduled for this service/client this month
      const scheduledCount = allUserTasks.filter((t: any) =>
        t.client_name === s.client_name &&
        t.title?.toLowerCase().includes(s.service_name.toLowerCase().split(' ')[0]) &&
        t.due_date
      ).length;

      const remaining = Math.max(0, qty - scheduledCount);
      if (remaining <= 0 && s.is_recurring) return; // all scheduled

      if (!map.has(s.client_id)) {
        map.set(s.client_id, { name: s.client_name, services: [] });
      }
      map.get(s.client_id)!.services.push({ ...s, scheduledCount });
    });

    return map;
  }, [userServices, allUserTasks]);

  // Day status for mini calendar
  const dayStatus = useMemo(() => {
    const map: Record<number, boolean> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const entries = entriesByDate[dateStr];
      if (!entries || entries.length === 0) continue;
      if (dayDate <= now) {
        map[d] = entries.every(e => e.isDone);
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

  // Drag handlers
  const handleDragStart = (e: DragEvent, service: PendingService) => {
    const dragType = serviceDragTypes[service.id] || 'entrega';
    const dragData: ServiceDragData = { ...service, dragType };
    e.dataTransfer.setData('service', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDayDragOver = (e: DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverDay(day);
  };

  const handleDayDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDayDrop = async (e: DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const raw = e.dataTransfer.getData('service');
    if (!raw) return;

    const service: ServiceDragData = JSON.parse(raw);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isGravacao = service.dragType === 'gravacao';

    const taskTitle = isGravacao
      ? `Gravação: ${service.service_name} — ${service.client_name}`
      : `${service.service_name} — ${service.client_name}`;

    const { data: insertedTasks, error } = await supabase.from('tasks').insert({
      title: taskTitle,
      status: 'todo',
      priority: 'medium',
      assigned_to: service.responsible_id || user!.id,
      created_by: user!.id,
      client_name: service.client_name,
      due_date: isGravacao ? null : dateStr,
      capture_date: isGravacao ? dateStr : null,
    }).select();

    if (error) {
      toast.error('Erro ao agendar tarefa');
      return;
    }

    toast.success(isGravacao ? 'Gravação agendada!' : 'Entrega agendada!');
    invalidate();

    // If it's an entrega of video, prompt for capture date (videomaker)
    if (!isGravacao && isVideomaker && (service.service_name.toLowerCase().includes('vídeo') || service.service_name.toLowerCase().includes('video'))) {
      if (insertedTasks && insertedTasks.length > 0) {
        setCaptureDialog({
          taskId: insertedTasks[0].id,
          taskTitle: taskTitle,
          deliveryDate: dateStr,
        });
      }
    }
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
    return new Date(e.dateKey) < now;
  }).length;

  const renderMainCalendar = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] border border-white/5 bg-white/[0.01]" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const entries = entriesByDate[dateStr] || [];
      const isDragTarget = dragOverDay === d;

      cells.push(
        <button
          key={d}
          onClick={() => setSelectedMainDay(prev => prev === d ? null : d)}
          onDragOver={(e) => handleDayDragOver(e, d)}
          onDragLeave={handleDayDragLeave}
          onDrop={(e) => handleDayDrop(e, d)}
          className={`min-h-[100px] border p-1.5 transition-all text-left ${
            isDragTarget
              ? 'border-brand-orange/50 bg-brand-orange/10 scale-[1.02]'
              : isToday
              ? 'border-brand-orange/20 bg-brand-orange/5'
              : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
          } ${selectedMainDay === d ? 'ring-1 ring-brand-orange/40' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-mono ${isToday ? 'text-brand-orange font-bold' : 'text-white/40'}`}>
              {d}
            </span>
            {entries.length > 0 && (
              <span className="text-[8px] font-mono text-white/20">{entries.length}</span>
            )}
          </div>
          <div className="space-y-0.5 overflow-hidden max-h-[70px]">
            {entries.slice(0, 3).map((entry, idx) => {
              const assignee = entry.task.assigned_to ? profileMap[entry.task.assigned_to] : null;
              const firstName = assignee?.split(' ')[0] || '?';
              const priorityClass = PRIORITY_COLORS[entry.task.priority] || PRIORITY_COLORS.medium;

              return (
                <div
                  key={`${entry.task.id}-${idx}`}
                  className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] leading-tight border ${
                    entry.isDone ? 'opacity-40 line-through border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300/60' : priorityClass
                  }`}
                >
                  {entry.isDone && <CheckCircle2 className="w-2 h-2 text-emerald-400 shrink-0" />}
                  <span className="truncate flex-1">{entry.task.title}</span>
                  <span className="text-white/20 shrink-0">{firstName}</span>
                </div>
              );
            })}
            {entries.length > 3 && (
              <p className="text-[8px] text-white/15 font-mono pl-1">+{entries.length - 3}</p>
            )}
          </div>
        </button>
      );
    }

    const totalCells = firstDay + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(<div key={`pad-${i}`} className="min-h-[100px] border border-white/5 bg-white/[0.01]" />);
      }
    }

    return cells;
  };

  const renderMiniCalendar = () => {
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`me-${i}`} />);

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
          }`}>{d}</span>
          {dotClass && <div className={`w-1.5 h-1.5 rounded-full ${dotClass} mt-0.5`} />}
        </button>
      );
    }
    return cells;
  };

  const renderEntryCard = (entry: CalendarEntry, showToggle: boolean) => {
    const assignee = entry.task.assigned_to ? profileMap[entry.task.assigned_to] : null;
    const priorityLabel = entry.task.priority === 'high' ? 'Alta' : entry.task.priority === 'low' ? 'Baixa' : 'Média';

    return (
      <div
        key={`${entry.task.id}-${entry.dateKey}`}
        className={`px-4 py-3 rounded-xl border transition-colors ${
          entry.isDone ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-white/10 bg-white/[0.03]'
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
                  REC
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
            {assignee || 'Não atribuído'}
          </span>
          {entry.task.capture_date && (
            <span className="text-[10px] font-mono text-blue-400/50">
              📹 {format(new Date(entry.task.capture_date), 'dd/MM')}
            </span>
          )}
          {showToggle && !entry.isRecurring && !entry.isDone && (
            <button
              onClick={async () => {
                const { error } = await supabase.from('tasks').delete().eq('id', entry.task.id);
                if (error) { toast.error('Erro ao cancelar'); return; }
                toast.success('Tarefa cancelada — serviço voltou a pendente');
                invalidate();
              }}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg border border-red-500/20 text-red-400/70 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Cancelar
            </button>
          )}
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

  const totalPending = Array.from(pendingByClient.values()).reduce((sum, c) => sum + c.services.length, 0);

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-brand-orange" />
          Calendário <span className="italic">Geral</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">
          {isAdmin ? 'Visão completa de todas as entregas da equipe' : 'Arraste seus serviços pendentes para organizar entregas'}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Pending Services Sidebar (left) */}
        <div className="w-full xl:w-64 space-y-3 order-2 xl:order-first">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-brand-orange" />
              <h3 className="text-sm font-serif text-white">Pendentes</h3>
              {totalPending > 0 && (
                <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full ml-auto">
                  {totalPending}
                </span>
              )}
            </div>

            {totalPending === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-[11px] text-white/30 font-mono">Tudo organizado!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                {Array.from(pendingByClient.entries()).map(([clientId, { name, services }]) => (
                  <div key={clientId}>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1.5 px-1">{name}</p>
                    <div className="space-y-1">
                      {services.map((s) => {
                        const Icon = getServiceIcon(s.service_name);
                        const qty = s.quantity_per_month || 1;
                        const remaining = Math.max(0, qty - s.scheduledCount);

                        return (
                          <div key={s.id} className="space-y-1">
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, s)}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-white/8 bg-white/[0.02] cursor-grab active:cursor-grabbing hover:border-brand-orange/20 hover:bg-brand-orange/[0.03] transition-all group"
                            >
                              <GripVertical className="w-3 h-3 text-white/10 group-hover:text-white/30 shrink-0" />
                              <Icon className="w-3.5 h-3.5 text-brand-orange/50 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white/60 truncate">{s.service_name}</p>
                                <p className="text-[9px] font-mono text-white/20">
                                  {s.scheduledCount}/{qty} agendados • <span className="text-orange-400/70">{remaining} restam</span>
                                </p>
                              </div>
                            </div>
                            {/* Type selector: Entrega / Gravação */}
                            <div className="flex gap-1 px-1">
                              <button
                                onClick={() => setServiceDragTypes(prev => ({ ...prev, [s.id]: 'entrega' }))}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-mono transition-all border ${
                                  (serviceDragTypes[s.id] || 'entrega') === 'entrega'
                                    ? 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange'
                                    : 'border-white/5 bg-white/[0.01] text-white/25 hover:text-white/40'
                                }`}
                              >
                                <Send className="w-2.5 h-2.5" />
                                Entrega
                              </button>
                              <button
                                onClick={() => setServiceDragTypes(prev => ({ ...prev, [s.id]: 'gravacao' }))}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-mono transition-all border ${
                                  serviceDragTypes[s.id] === 'gravacao'
                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                    : 'border-white/5 bg-white/[0.01] text-white/25 hover:text-white/40'
                                }`}
                              >
                                <Clapperboard className="w-2.5 h-2.5" />
                                Gravação
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[9px] text-white/15 font-mono mt-3 text-center">
              Arraste para um dia do calendário
            </p>
          </div>
        </div>

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
                <div key={d} className="text-center text-[10px] font-mono uppercase text-white/25 py-2 tracking-wider">
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

        {/* Right Sidebar */}
        <div className="w-full xl:w-64 space-y-5 order-3">
          {/* Mini Calendar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-serif text-white">Status do Mês</h3>
              <div className="flex items-center gap-2 text-[8px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OK</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Atraso</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-[8px] font-mono uppercase text-white/20 py-1">{d.charAt(0)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {renderMiniCalendar()}
            </div>
          </div>

          {/* Mini day detail */}
          {selectedMiniDay !== null && (() => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedMiniDay).padStart(2, '0')}`;
            const dayEntries = entriesByDate[dateStr] || [];
            const completed = dayEntries.filter(e => e.isDone);
            const pending = dayEntries.filter(e => !e.isDone);

            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif text-white">Dia {selectedMiniDay}</h3>
                  <button onClick={() => setSelectedMiniDay(null)} className="text-white/20 hover:text-white/50 text-xs">✕</button>
                </div>
                {completed.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-emerald-400/70 tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluídas</p>
                    {completed.map(entry => (
                      <div key={`${entry.task.id}-${entry.dateKey}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-xs text-emerald-300/80 truncate flex-1">{entry.task.title}</span>
                        {isAdmin && (
                          <button onClick={() => toggleEntryStatus(entry)} className="text-yellow-400 hover:text-yellow-300 transition-colors shrink-0">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {pending.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-red-400/70 tracking-wider flex items-center gap-1"><XCircle className="w-3 h-3" /> Pendentes</p>
                    {pending.map(entry => (
                      <div key={`${entry.task.id}-${entry.dateKey}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                        <span className="text-xs text-red-300/80 truncate flex-1">{entry.task.title}</span>
                        {isAdmin && (
                          <button onClick={() => toggleEntryStatus(entry)} className="text-emerald-400 hover:text-emerald-300 transition-colors shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {dayEntries.length === 0 && <p className="text-xs text-white/20 font-mono">Nenhuma tarefa neste dia.</p>}
              </div>
            );
          })()}

          {/* Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-xs font-serif text-white">Resumo</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-mono">Total</span>
                <span className="text-sm font-serif text-white">{monthEntries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Concluídas</span>
                <span className="text-sm font-serif text-emerald-400">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-mono flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> Atrasadas</span>
                <span className="text-sm font-serif text-red-400">{overdueCount}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-white/25">Progresso</span>
                  <span className="text-[9px] font-mono text-white/25">
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

      {/* Capture Date Dialog (Videomaker only) */}
      <Dialog open={!!captureDialog} onOpenChange={(open) => { if (!open) { setCaptureDialog(null); setCaptureDate(undefined); } }}>
        <DialogContent className="bg-brand-black border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white font-serif text-lg">Data de Gravação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-white/40 font-mono">
              {captureDialog?.taskTitle}
            </p>
            <p className="text-xs text-white/30">
              Entrega: <span className="text-white/60">{captureDialog?.deliveryDate && format(new Date(captureDialog.deliveryDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={captureDate}
                onSelect={setCaptureDate}
                className={cn("p-3 pointer-events-auto rounded-xl border border-white/10 bg-white/[0.02]")}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setCaptureDialog(null); setCaptureDate(undefined); }}
                className="flex-1 py-2 rounded-xl border border-white/10 text-white/40 text-xs font-mono hover:bg-white/5 transition-colors"
              >
                Pular
              </button>
              <button
                onClick={saveCaptureDate}
                disabled={!captureDate}
                className="flex-1 py-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-mono hover:bg-brand-orange/20 transition-colors disabled:opacity-30"
              >
                Confirmar gravação
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
