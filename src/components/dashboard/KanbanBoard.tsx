import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  is_team_task: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_COLUMNS = [
  { key: 'todo', label: 'A Fazer', dot: 'bg-white/30', color: 'text-white/40' },
  { key: 'in_progress', label: 'Em Progresso', dot: 'bg-blue-400', color: 'text-blue-400' },
  { key: 'review', label: 'Em Revisão', dot: 'bg-yellow-400', color: 'text-yellow-400' },
  { key: 'done', label: 'Concluído', dot: 'bg-emerald-400', color: 'text-emerald-400' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');

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

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    invalidate();
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditStatus(task.status);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    await supabase.from('tasks').update({ title: editTitle.trim(), status: editStatus }).eq('id', editingId);
    setEditingId(null);
    invalidate();
  };

  return (
    <div>
      <h2 className="text-lg font-serif text-white mb-4">Minhas Tarefas</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 min-h-[200px]">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-mono uppercase tracking-wider ${col.color}`}>{col.label}</span>
                <span className="text-white/20 text-xs ml-auto">{colTasks.length}</span>
                <button
                  onClick={() => { setAddingTo(col.key); setNewTitle(''); setNewPriority('medium'); }}
                  className="text-white/20 hover:text-brand-orange transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
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
                {colTasks.length === 0 && addingTo !== col.key && (
                  <p className="text-white/15 text-xs font-mono text-center py-8">Nenhuma tarefa</p>
                )}
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className={`group rounded-xl border border-white/10 bg-white/[0.03] p-3 ${task.status === 'done' ? 'opacity-50' : ''}`}
                  >
                    {editingId === task.id ? (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          className="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-white outline-none focus:border-brand-orange/40"
                        />
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded text-xs text-white/60 px-2 py-1 outline-none"
                        >
                          {STATUS_COLUMNS.map(s => (
                            <option key={s.key} value={s.key} className="bg-brand-black">{s.label}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="text-brand-orange"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="text-white/20"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm text-white ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => startEdit(task)} className="text-white/20 hover:text-brand-orange transition-colors">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteTask(task.id)} className="text-white/20 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10'
                              : task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                              : 'border-white/10 text-white/30'
                          }`}>
                            {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                          </span>
                          {task.due_date && (
                            <span className={`text-[9px] font-mono ${
                              new Date(task.due_date).getTime() - Date.now() < 48 * 60 * 60 * 1000 ? 'text-red-400' : 'text-white/20'
                            }`}>
                              {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
