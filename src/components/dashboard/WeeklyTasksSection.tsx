import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function getDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function getWeekStart(): string {
  const now = new Date();
  const dayIdx = getDayIndex();
  const start = new Date(now);
  start.setDate(now.getDate() - dayIdx);
  return start.toISOString().slice(0, 10);
}

export function WeeklyTasksSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = getDayIndex();
  const [selectedDay, setSelectedDay] = useState(today);
  const [expanded, setExpanded] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const weekStart = getWeekStart();

  const { data: templates = [] } = useQuery({
    queryKey: ['weekly-templates', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_task_templates')
        .select('*')
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: checks = [] } = useQuery({
    queryKey: ['weekly-checks', user?.id, weekStart, selectedDay],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_task_checks')
        .select('*')
        .eq('user_id', user!.id)
        .eq('week_start', weekStart)
        .eq('day_index', selectedDay);
      return data || [];
    },
    enabled: !!user,
  });

  const checkedIds = new Set(checks.map((c: any) => c.template_id));

  const toggleMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (checkedIds.has(templateId)) {
        await supabase
          .from('weekly_task_checks')
          .delete()
          .eq('template_id', templateId)
          .eq('week_start', weekStart)
          .eq('day_index', selectedDay);
      } else {
        await supabase.from('weekly_task_checks').insert({
          user_id: user!.id,
          template_id: templateId,
          week_start: weekStart,
          day_index: selectedDay,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekly-checks'] }),
  });

  const addMutation = useMutation({
    mutationFn: async (label: string) => {
      const maxOrder = templates.length > 0 ? Math.max(...templates.map((t: any) => t.sort_order)) + 1 : 0;
      await supabase.from('weekly_task_templates').insert({
        user_id: user!.id,
        label,
        sort_order: maxOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-templates'] });
      setNewTaskLabel('');
      setAddingTask(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      await supabase.from('weekly_task_templates').update({ label }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-templates'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('weekly_task_templates').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekly-templates'] }),
  });

  const doneCount = checkedIds.size;
  const totalCount = templates.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-4 group"
      >
        <CalendarCheck className="w-4 h-4 text-brand-orange" />
        <h2 className="text-lg font-serif text-white">Tarefas Semanais</h2>
        <span className="text-[10px] font-mono text-white/30 ml-1">
          {doneCount}/{totalCount}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
          : <ChevronDown className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
        }
      </button>

      {expanded && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          {/* Day selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                  idx === selectedDay
                    ? 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange'
                    : idx === today
                    ? 'border-white/15 text-white/50 bg-white/[0.03]'
                    : 'border-white/5 text-white/25 hover:border-white/15 hover:text-white/40'
                }`}
              >
                {day}
                {idx === today && idx !== selectedDay && (
                  <span className="ml-1 text-brand-orange/60">•</span>
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/60 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/30">{progress}%</span>
          </div>

          {/* Task list */}
          <div className="space-y-1">
            {templates.map((task: any) => {
              const isDone = checkedIds.has(task.id);
              const isEditing = editingId === task.id;

              if (isEditing) {
                return (
                  <div key={task.id} className="flex items-center gap-2 px-3 py-2.5">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editLabel.trim()) updateMutation.mutate({ id: task.id, label: editLabel.trim() });
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 outline-none focus:border-brand-orange/40"
                      autoFocus
                    />
                    <button onClick={() => editLabel.trim() && updateMutation.mutate({ id: task.id, label: editLabel.trim() })} className="text-emerald-400 hover:text-emerald-300">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/[0.03] group ${
                    isDone ? 'opacity-50' : ''
                  }`}
                >
                  <button onClick={() => toggleMutation.mutate(task.id)} className="mt-0.5 shrink-0">
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <Circle className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                    }
                  </button>
                  <span className={`text-sm flex-1 ${isDone ? 'text-white/30 line-through' : 'text-white/70'}`}>
                    {task.label}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(task.id); setEditLabel(task.label); }}
                      className="text-white/20 hover:text-white/50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="text-white/20 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add task */}
          {addingTask ? (
            <div className="flex items-center gap-2 px-3">
              <input
                type="text"
                value={newTaskLabel}
                onChange={e => setNewTaskLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTaskLabel.trim()) addMutation.mutate(newTaskLabel.trim());
                  if (e.key === 'Escape') { setAddingTask(false); setNewTaskLabel(''); }
                }}
                placeholder="Nova tarefa semanal..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-brand-orange/40"
                autoFocus
              />
              <button
                onClick={() => newTaskLabel.trim() && addMutation.mutate(newTaskLabel.trim())}
                className="text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setAddingTask(false); setNewTaskLabel(''); }} className="text-white/30 hover:text-white/50">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTask(true)}
              className="flex items-center gap-2 text-white/25 hover:text-white/50 text-xs font-mono px-3 py-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar tarefa
            </button>
          )}
        </div>
      )}
    </div>
  );
}
