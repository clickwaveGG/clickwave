import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { TaskDetailModal } from './TaskDetailModal';
import { format, isToday, isBefore, startOfDay, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  description: string | null;
  client_name: string | null;
  assigned_to: string | null;
  created_by: string;
  is_team_task: boolean;
  capture_date: string | null;
  created_at: string;
  updated_at: string;
  weekday: number | null;
  price: number | null;
}

function getWeekdayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // Mon=0, Sun=6
}

function getTaskDate(task: Task): Date | null {
  if (task.due_date) return startOfDay(parseISO(task.due_date));
  return null;
}

export function TodayTasksSection({ tasks }: { tasks: Task[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-tasks', user?.id] });

  const today = startOfDay(new Date());
  const todayWeekday = getWeekdayIndex();

  // Separate active tasks (not done)
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Tasks for today: due_date is today OR weekday matches today (and no specific due_date)
  const todayTasks = activeTasks.filter(t => {
    const d = getTaskDate(t);
    if (d && isToday(d)) return true;
    if (!d && t.weekday === todayWeekday) return true;
    return false;
  });

  // Overdue tasks (due_date before today)
  const overdueTasks = activeTasks.filter(t => {
    const d = getTaskDate(t);
    return d && isBefore(d, today) && !isToday(d);
  });

  // If no today tasks, find the nearest upcoming day
  let nearestDay: { date: Date; tasks: Task[] } | null = null;
  if (todayTasks.length === 0 && overdueTasks.length === 0) {
    const futureTasks = activeTasks
      .filter(t => {
        const d = getTaskDate(t);
        return d && d > today;
      })
      .sort((a, b) => getTaskDate(a)!.getTime() - getTaskDate(b)!.getTime());

    if (futureTasks.length > 0) {
      const nearestDate = getTaskDate(futureTasks[0])!;
      nearestDay = {
        date: nearestDate,
        tasks: futureTasks.filter(t => getTaskDate(t)!.getTime() === nearestDate.getTime()),
      };
    }
  }

  const toggleDone = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) toast.error('Erro ao atualizar');
    else invalidate();
  };

  const TaskRow = ({ task, muted = false }: { task: Task; muted?: boolean }) => {
    const isDone = task.status === 'done';
    const isOverdue = !isDone && task.due_date && isBefore(parseISO(task.due_date), today) && !isToday(parseISO(task.due_date));

    return (
      <div
        onClick={() => setSelectedTask(task)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group
          ${isDone ? 'border-white/5 bg-white/[0.01] opacity-50' : isOverdue ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'}
          ${muted ? 'opacity-60' : ''}
        `}
      >
        <button onClick={(e) => toggleDone(e, task)} className="shrink-0">
          {isDone
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <Circle className="w-5 h-5 text-white/20 group-hover:text-white/40" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isDone ? 'text-white/30 line-through' : 'text-white'}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.client_name && (
              <span className="text-[10px] font-mono text-white/30 truncate">{task.client_name}</span>
            )}
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10'
                : task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                : 'border-white/10 text-white/30'
            }`}>
              {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
            </span>
          </div>
        </div>
        {task.due_date && (
          <span className={`text-[10px] font-mono shrink-0 ${isOverdue ? 'text-red-400' : 'text-white/25'}`}>
            {format(parseISO(task.due_date), 'dd/MM', { locale: ptBR })}
          </span>
        )}
      </div>
    );
  };

  const hasTasks = todayTasks.length > 0 || overdueTasks.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-brand-orange" />
        <h2 className="text-lg font-serif text-white">Tarefas de Hoje</h2>
        <span className="text-[10px] font-mono text-white/30 ml-1">
          {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>

      <div className="space-y-2">
        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Atrasadas</span>
            </div>
            {overdueTasks.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}

        {/* Today's tasks */}
        {todayTasks.map(t => <TaskRow key={t.id} task={t} />)}

        {/* No tasks today — show nearest day */}
        {!hasTasks && nearestDay && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <p className="text-sm text-white/60">Nenhuma tarefa para hoje!</p>
            </div>
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
                <span className="text-xs font-mono text-white/40">
                  Próximo dia com tarefas: <span className="text-white/70">{format(nearestDay.date, "EEEE, dd/MM", { locale: ptBR })}</span>
                </span>
              </div>
              {nearestDay.tasks.map(t => <TaskRow key={t.id} task={t} muted />)}
            </div>
          </div>
        )}

        {/* No tasks at all */}
        {!hasTasks && !nearestDay && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-white/50">Tudo em dia! Nenhuma tarefa pendente.</p>
          </div>
        )}

        {/* Done today count */}
        {doneTasks.length > 0 && (
          <p className="text-[10px] font-mono text-white/20 px-1 pt-1">
            {doneTasks.length} {doneTasks.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
          </p>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => { setSelectedTask(null); invalidate(); }}
        />
      )}
    </div>
  );
}
