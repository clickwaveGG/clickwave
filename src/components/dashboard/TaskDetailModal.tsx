import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Check, Pencil, Calendar, User, Clock, FileText, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { key: 'todo', label: 'A Fazer', dot: 'bg-white/30' },
  { key: 'in_progress', label: 'Em Progresso', dot: 'bg-blue-400' },
  { key: 'review', label: 'Em Revisão', dot: 'bg-yellow-400' },
  { key: 'done', label: 'Concluído', dot: 'bg-emerald-400' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa', style: 'border-white/10 text-white/30' },
  { value: 'medium', label: 'Média', style: 'border-orange-500/30 text-orange-400 bg-orange-500/10' },
  { value: 'high', label: 'Alta', style: 'border-red-500/30 text-red-400 bg-red-500/10' },
];

interface Props {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [clientName, setClientName] = useState(task.client_name || '');
  const [description, setDescription] = useState(task.description || '');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-tasks', user?.id] });

  const save = async () => {
    const { error } = await supabase.from('tasks').update({
      title: title.trim(),
      status,
      priority,
      due_date: dueDate || null,
      client_name: clientName.trim() || null,
      description: description.trim() || null,
    }).eq('id', task.id);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Tarefa atualizada');
    setEditing(false);
    invalidate();
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.key === (editing ? status : task.status));
  const currentPriority = PRIORITIES.find(p => p.value === (editing ? priority : task.priority));

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const formatDateTime = (d: string) => new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-brand-black/95 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${currentStatus?.dot}`} />
            <span className="text-xs font-mono uppercase tracking-wider text-white/40">
              {currentStatus?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-white/30 hover:text-brand-orange transition-colors p-1">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Title */}
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-transparent text-lg font-serif text-white outline-none border-b border-white/10 pb-2 focus:border-brand-orange/40"
            />
          ) : (
            <h2 className={`text-lg font-serif text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </h2>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Cliente */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3 h-3 text-white/20" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">Cliente</span>
              </div>
              {editing ? (
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Nome do cliente..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/15 border-b border-white/10 pb-1 focus:border-brand-orange/30"
                />
              ) : (
                <p className="text-sm text-white/60">{task.client_name || <span className="italic text-white/15">Não definido</span>}</p>
              )}
            </div>

            {/* Prioridade */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3 h-3 text-white/20" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">Prioridade</span>
              </div>
              {editing ? (
                <div className="flex gap-1.5">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                        priority === p.value ? p.style : 'border-white/5 text-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${currentPriority?.style}`}>
                  {currentPriority?.label}
                </span>
              )}
            </div>

            {/* Data de entrega */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3 h-3 text-white/20" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">Entrega</span>
              </div>
              {editing ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none border-b border-white/10 pb-1 focus:border-brand-orange/30 [color-scheme:dark]"
                />
              ) : (
                <p className={`text-sm ${
                  task.due_date && new Date(task.due_date).getTime() - Date.now() < 48 * 60 * 60 * 1000
                    ? 'text-red-400' : 'text-white/60'
                }`}>
                  {task.due_date ? formatDate(task.due_date) : <span className="italic text-white/15">Sem prazo</span>}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3 h-3 text-white/20" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">Status</span>
              </div>
              {editing ? (
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded text-xs text-white/60 px-2 py-1 outline-none"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.key} value={s.key} className="bg-brand-black">{s.label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${currentStatus?.dot}`} />
                  <span className="text-sm text-white/60">{currentStatus?.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contexto Interno */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3 h-3 text-white/20" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">Contexto Interno</span>
            </div>
            {editing ? (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Notas, links, briefing do cliente..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded text-xs text-white/70 px-2 py-1.5 outline-none focus:border-brand-orange/30 placeholder:text-white/15 resize-none"
              />
            ) : (
              <p className="text-xs text-white/40 whitespace-pre-wrap leading-relaxed min-h-[40px]">
                {task.description || <span className="italic text-white/15">Sem contexto adicionado</span>}
              </p>
            )}
          </div>

          {/* Datas do sistema */}
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/15 pt-1 border-t border-white/5">
            <span>Criado em {formatDateTime(task.created_at)}</span>
            <span>Atualizado em {formatDateTime(task.updated_at)}</span>
          </div>
        </div>

        {/* Footer - edit actions */}
        {editing && (
          <div className="flex justify-end gap-3 px-5 pb-5">
            <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/50 transition-colors px-3 py-1.5 rounded-lg border border-white/10">
              Cancelar
            </button>
            <button onClick={save} className="text-xs text-brand-black bg-brand-orange hover:bg-brand-orange/90 transition-colors px-4 py-1.5 rounded-lg font-medium">
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
