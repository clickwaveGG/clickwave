import { useState, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Check, FileText, Video } from 'lucide-react';
import { toast } from 'sonner';
import { TaskDetailModal } from './TaskDetailModal';

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
}

const STATUS_COLUMNS = [
  { key: 'pending', label: 'Pendente', dot: 'bg-orange-400', color: 'text-orange-400' },
  { key: 'todo', label: 'A Fazer', dot: 'bg-white/30', color: 'text-white/40' },
  { key: 'in_progress', label: 'Em Progresso', dot: 'bg-blue-400', color: 'text-blue-400' },
  { key: 'review', label: 'Em Revisão', dot: 'bg-yellow-400', color: 'text-yellow-400' },
  { key: 'done', label: 'Concluído', dot: 'bg-emerald-400', color: 'text-emerald-400' },
];

const MAX_VISIBLE_TASKS = 5;

const PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-tasks', user?.id] });

  const addTask = async (status: string) => {
    const title = newTitle.trim();
    if (!title || !user) return;
    const { error } = await supabase.from('tasks').insert({
      title,
      status,
      priority: newPriority,
      assigned_to: user.id,
      created_by: user.id,
    });
    if (error) { toast.error('Erro ao criar tarefa'); return; }
    setNewTitle('');
    setNewPriority('medium');
    setAddingTo(null);
    invalidate();
  };

  const deleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from('tasks').delete().eq('id', id);
    invalidate();
  };

  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingTaskId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update via invalidation
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      toast.error('Erro ao mover tarefa');
    } else {
      const colLabel = STATUS_COLUMNS.find(c => c.key === newStatus)?.label;
      toast.success(`Movido para ${colLabel}`);
    }
    invalidate();
  };

  const pendingVideoTasks = tasks.filter(t => !t.capture_date && !t.due_date && t.status === 'todo');
  const regularTasks = tasks.filter(t => !(pendingVideoTasks.includes(t)));

  return (
    <div>
      <h2 className="text-lg font-serif text-white mb-4">Minhas Tarefas</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map(col => {
          const isPendingCol = col.key === 'pending';
          const colTasks = isPendingCol ? [] : regularTasks.filter(t => t.status === col.key);
          const visibleTasks = colTasks.slice(0, MAX_VISIBLE_TASKS);
          const hiddenCount = colTasks.length - visibleTasks.length;
          const isDropTarget = dragOverCol === col.key && !isPendingCol;

          return (
            <div
              key={col.key}
              className={`rounded-2xl border p-4 min-h-[200px] transition-all duration-200 ${
                isDropTarget
                  ? 'border-brand-orange/50 bg-brand-orange/[0.05] scale-[1.02]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
              onDragOver={!isPendingCol ? (e) => handleDragOver(e, col.key) : undefined}
              onDragLeave={!isPendingCol ? handleDragLeave : undefined}
              onDrop={!isPendingCol ? (e) => handleDrop(e, col.key) : undefined}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <button
                  onClick={() => navigate(`/dashboard/tasks?status=${col.key}`)}
                  className={`text-xs font-mono uppercase tracking-wider ${col.color} hover:underline transition-colors`}
                >
                  {col.label}
                </button>
                <span className="text-white/20 text-xs ml-auto">
                  {isPendingCol ? pendingVideoTasks.length : colTasks.length}
                </span>
                {!isPendingCol && (
                  <button
                    onClick={() => { setAddingTo(col.key); setNewTitle(''); setNewPriority('medium'); }}
                    className="text-white/20 hover:text-brand-orange transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {addingTo === col.key && (
                <div className="mb-3 rounded-xl border border-brand-orange/20 bg-white/[0.03] p-3 space-y-2">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask(col.key)}
                    placeholder="Título da tarefa..."
                    className="w-full bg-transparent border-b border-white/10 pb-1.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/40"
                  />
                  <div className="flex items-center gap-2">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setNewPriority(p.value)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                          newPriority === p.value
                            ? p.value === 'high' ? 'border-red-500/50 text-red-400 bg-red-500/20'
                              : p.value === 'medium' ? 'border-orange-500/50 text-orange-400 bg-orange-500/20'
                              : 'border-white/30 text-white/50 bg-white/10'
                            : 'border-white/5 text-white/20'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => addTask(col.key)} className="text-brand-orange hover:text-brand-orange/80 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setAddingTo(null)} className="text-white/20 hover:text-white/40 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {isPendingCol ? (
                  pendingVideoTasks.length === 0 ? (
                    <p className="text-white/15 text-xs font-mono text-center py-8">Nenhuma pendência</p>
                  ) : (
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-orange-400" />
                        <p className="text-sm text-white">
                          <span className="font-semibold text-orange-400">{pendingVideoTasks.length}</span>{' '}
                          {pendingVideoTasks.length === 1 ? 'vídeo sem data' : 'vídeos sem data'}
                        </p>
                      </div>
                      <p className="text-[10px] font-mono text-white/30 mt-1.5">
                        Captação e entrega não programadas
                      </p>
                      <div className="mt-2 space-y-1">
                        {pendingVideoTasks.slice(0, 3).map(t => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTask(t)}
                            className="text-[11px] text-white/40 truncate cursor-pointer hover:text-white/60 transition-colors"
                          >
                            • {t.title}
                          </div>
                        ))}
                        {pendingVideoTasks.length > 3 && (
                          <p className="text-[10px] text-white/20 font-mono">
                            +{pendingVideoTasks.length - 3} mais
                          </p>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {visibleTasks.length === 0 && addingTo !== col.key && (
                      <p className="text-white/15 text-xs font-mono text-center py-8">Nenhuma tarefa</p>
                    )}
                    {visibleTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={() => { setDraggingTaskId(null); setDragOverCol(null); }}
                        onClick={() => setSelectedTask(task)}
                        className={`group rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-grab active:cursor-grabbing hover:border-white/20 hover:bg-white/[0.05] transition-all ${
                          task.status === 'done' ? 'opacity-50' : ''
                        } ${draggingTaskId === task.id ? 'opacity-40 scale-95' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm text-white ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                          <button
                            onClick={(e) => deleteTask(e, task.id)}
                            className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10'
                              : task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                              : 'border-white/10 text-white/30'
                          }`}>
                            {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                          </span>
                          {task.client_name && (
                            <span className="text-[9px] font-mono text-white/25 truncate max-w-[80px]">{task.client_name}</span>
                          )}
                          {task.description && <FileText className="w-2.5 h-2.5 text-white/20" />}
                          {task.due_date && (
                            <span className={`text-[9px] font-mono ml-auto ${
                              new Date(task.due_date).getTime() - Date.now() < 48 * 60 * 60 * 1000 ? 'text-red-400' : 'text-white/20'
                            }`}>
                              {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => navigate(`/dashboard/tasks?status=${col.key}`)}
                        className="text-[10px] font-mono text-white/20 text-center pt-1 w-full hover:text-brand-orange transition-colors"
                      >
                        +{hiddenCount} {hiddenCount === 1 ? 'tarefa' : 'tarefas'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
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
