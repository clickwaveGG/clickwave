import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PendingItem {
  id: string;
  label: string;
  is_done: boolean;
  user_id: string;
  created_at: string;
}

export function PendingItemsSection({ items }: { items: PendingItem[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-pending', user?.id] });

  const addItem = async () => {
    const label = newLabel.trim();
    if (!label || !user) return;
    const { error } = await supabase.from('pending_items').insert({ label, user_id: user.id });
    if (error) { toast.error('Erro ao adicionar'); return; }
    setNewLabel('');
    setAdding(false);
    invalidate();
  };

  const toggleItem = async (id: string, current: boolean) => {
    await supabase.from('pending_items').update({ is_done: !current }).eq('id', id);
    invalidate();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('pending_items').delete().eq('id', id);
    invalidate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-white">Itens Pendentes</h2>
        <button
          onClick={() => setAdding(true)}
          className="text-white/30 hover:text-brand-orange transition-colors"
          title="Adicionar item"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 mb-3">
          <input
            autoFocus
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Novo item pendente..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/40"
          />
          <button onClick={addItem} className="text-brand-orange hover:text-brand-orange/80 transition-colors">
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setAdding(false); setNewLabel(''); }} className="text-white/20 hover:text-white/40 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-sm font-mono">Nenhum item pendente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <button
                onClick={() => toggleItem(item.id, item.is_done)}
                className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                  item.is_done
                    ? 'bg-emerald-500/20 border-emerald-500/40'
                    : 'border-white/20 hover:border-brand-orange/40'
                }`}
              >
                {item.is_done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
              <span className={`text-sm flex-1 ${item.is_done ? 'text-white/30 line-through' : 'text-white/70'}`}>
                {item.label}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
