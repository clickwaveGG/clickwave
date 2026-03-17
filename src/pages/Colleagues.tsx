import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, ListTodo, Target } from 'lucide-react';
import { useState } from 'react';

export default function Colleagues() {
  const { role } = useAuth();
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const { data: members = [] } = useQuery({
    queryKey: ['colleagues'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (!profiles) return [];

      const result = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', p.user_id)
            .neq('status', 'done');

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', p.user_id)
            .single();

          const { data: objectives } = await supabase
            .from('objectives')
            .select('*')
            .eq('owner_id', p.user_id)
            .eq('is_team_objective', false);

          return {
            ...p,
            open_tasks: count || 0,
            role: roleData?.role || 'member',
            objectives: objectives || [],
          };
        })
      );
      return result;
    },
  });

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white">
          Meus <span className="italic">Colegas.</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">Conheça os membros da equipe Clickwave</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members list */}
        <div className="md:col-span-1 space-y-3">
          {members.map((m: any) => {
            const initials = m.full_name ? m.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??';
            const isSelected = selectedMember?.user_id === m.user_id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-brand-orange/30 bg-brand-orange/5'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-xs font-mono font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{m.full_name || 'Sem nome'}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                      {m.role === 'admin' ? 'Admin' : 'Membro'}
                    </p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <span className="text-[10px] font-mono text-white/20">{m.open_tasks} aberta{m.open_tasks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Member detail */}
        <div className="md:col-span-2">
          {selectedMember ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-xl font-mono font-bold">
                  {selectedMember.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                </div>
                <div>
                  <h2 className="text-xl font-serif text-white">{selectedMember.full_name}</h2>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    selectedMember.role === 'admin'
                      ? 'border-brand-orange/30 text-brand-orange bg-brand-orange/10'
                      : 'border-white/10 text-white/40'
                  }`}>
                    {selectedMember.role === 'admin' ? 'ADMIN' : 'MEMBRO'}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Bio</p>
                <p className="text-sm text-white/60">{selectedMember.bio || 'Nenhuma bio adicionada.'}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
                  <ListTodo className="w-5 h-5 text-brand-orange" />
                  <div>
                    <p className="text-lg font-serif text-white">{selectedMember.open_tasks}</p>
                    <p className="text-[10px] font-mono text-white/30 uppercase">Tarefas Abertas</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
                  <Target className="w-5 h-5 text-brand-orange" />
                  <div>
                    <p className="text-lg font-serif text-white">{selectedMember.objectives?.length || 0}</p>
                    <p className="text-[10px] font-mono text-white/30 uppercase">Objetivos</p>
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {selectedMember.objectives && selectedMember.objectives.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Objetivos</p>
                  <div className="space-y-2">
                    {selectedMember.objectives.map((obj: any) => (
                      <div key={obj.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/70">{obj.title}</span>
                          <span className="text-[9px] font-mono text-white/20">{obj.progress}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1">
                          <div className="bg-brand-orange h-1 rounded-full" style={{ width: `${obj.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin: assign task button */}
              {role === 'admin' && (
                <button className="w-full py-2.5 rounded-xl border border-brand-orange/30 text-brand-orange text-sm font-mono hover:bg-brand-orange/10 transition-colors">
                  + Atribuir Tarefa
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <Users className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/20 text-sm font-mono">Selecione um colega para ver o perfil</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
