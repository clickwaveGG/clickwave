import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Plus, Trash2, X, Check, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Objective {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  owner_id: string;
  is_team_objective: boolean;
  created_at: string;
  updated_at: string;
}

export function ObjectivesSection({ objectives }: { objectives: Objective[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editProgress, setEditProgress] = useState(0);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-objectives', user?.id] });

  const addObjective = async () => {
    const title = newTitle.trim();
    if (!title || !user) return;
    const { error } = await supabase.from('objectives').insert({
      title,
      owner_id: user.id,
      is_team_objective: false,
    });
    if (error) { toast.error('Erro ao criar objetivo'); return; }
    setNewTitle('');
    setAdding(false);
    invalidate();
  };

  const deleteObjective = async (id: string) => {
    await supabase.from('objectives').delete().eq('id', id);
    invalidate();
  };

  const startEdit = (obj: Objective) => {
    setEditingId(obj.id);
    setEditTitle(obj.title);
    setEditProgress(obj.progress);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    const status = editProgress >= 100 ? 'completed' : 'active';
    await supabase.from('objectives').update({ title: editTitle.trim(), progress: editProgress, status }).eq('id', editingId);
    setEditingId(null);
    invalidate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-white">Meus Objetivos</h2>
        <button onClick={() => setAdding(true)} className="text-white/30 hover:text-brand-orange transition-colors" title="Novo objetivo">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 mb-3">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addObjective()}
            placeholder="Novo objetivo..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/40"
          />
          <button onClick={addObjective} className="text-brand-orange"><Check className="w-4 h-4" /></button>
          <button onClick={() => { setAdding(false); setNewTitle(''); }} className="text-white/20"><X className="w-4 h-4" /></button>
        </div>
      )}

      {objectives.length === 0 && !adding ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-sm font-mono">Nenhum objetivo definido ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map(obj => (
            <div key={obj.id} className="group rounded-xl border border-white/10 bg-white/[0.03] p-4">
              {editingId === obj.id ? (
                <div className="space-y-3">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    className="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-white outline-none focus:border-brand-orange/40"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/30">Progresso:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editProgress}
                      onChange={e => setEditProgress(Number(e.target.value))}
                      className="flex-1 accent-brand-orange h-1"
                    />
                    <span className="text-[10px] font-mono text-white/50 w-8 text-right">{editProgress}%</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="text-brand-orange"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-white/20"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white">{obj.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        obj.status === 'completed'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-brand-orange/30 text-brand-orange bg-brand-orange/10'
                      }`}>
                        {obj.status === 'completed' ? 'CONCLUÍDO' : 'ATIVO'}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(obj)} className="text-white/20 hover:text-brand-orange transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteObjective(obj.id)} className="text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
                    <div className="bg-brand-orange h-1.5 rounded-full transition-all duration-500" style={{ width: `${obj.progress}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-white/30">{obj.progress}%</span>
                    {obj.due_date && (
                      <span className="text-[10px] font-mono text-white/20">{new Date(obj.due_date).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
