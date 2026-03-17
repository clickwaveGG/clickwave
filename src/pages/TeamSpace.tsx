import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UsersRound, Target, Megaphone, ListTodo, Pin } from 'lucide-react';

export default function TeamSpace() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  // Team objectives
  const { data: teamObjectives = [] } = useQuery({
    queryKey: ['team-objectives'],
    queryFn: async () => {
      const { data } = await supabase
        .from('objectives')
        .select('*, profiles!objectives_owner_id_fkey(full_name)')
        .eq('is_team_objective', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*, profiles!announcements_created_by_fkey(full_name)')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Team tasks
  const { data: teamTasks = [] } = useQuery({
    queryKey: ['team-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, profiles!tasks_assigned_to_fkey(full_name)')
        .eq('is_team_task', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // All members
  const { data: members = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (!profiles) return [];
      
      // Get task counts per user
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
          
          return { ...p, open_tasks: count || 0, role: roleData?.role || 'member' };
        })
      );
      return result;
    },
  });

  const statusColumns = [
    { key: 'todo', label: 'A Fazer', dotColor: 'bg-white/30' },
    { key: 'in_progress', label: 'Em Progresso', dotColor: 'bg-blue-400' },
    { key: 'review', label: 'Em Revisão', dotColor: 'bg-yellow-400' },
    { key: 'done', label: 'Concluído', dotColor: 'bg-emerald-400' },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white">
          Espaço da <span className="italic">Equipe.</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">Objetivos, tarefas e comunicados compartilhados</p>
      </div>

      {/* Announcements */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-brand-orange" />
          <h2 className="text-lg font-serif text-white">Comunicados</h2>
        </div>
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <Megaphone className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/20 text-sm font-mono">Nenhum comunicado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`rounded-xl border p-4 ${a.pinned ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="flex items-start gap-3">
                  {a.pinned && <Pin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm text-white/80">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-white/30">
                        {(a as any).profiles?.full_name || 'Admin'}
                      </span>
                      <span className="text-white/10">·</span>
                      <span className="text-[10px] font-mono text-white/20">
                        {new Date(a.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Objectives */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-brand-orange" />
          <h2 className="text-lg font-serif text-white">Objetivos da Equipe</h2>
        </div>
        {teamObjectives.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <Target className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/20 text-sm font-mono">Nenhum objetivo de equipe definido</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamObjectives.map((obj: any) => (
              <div key={obj.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-medium">{obj.title}</p>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    obj.status === 'completed'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-brand-orange/30 text-brand-orange bg-brand-orange/10'
                  }`}>
                    {obj.status === 'completed' ? 'CONCLUÍDO' : 'ATIVO'}
                  </span>
                </div>
                {obj.description && <p className="text-xs text-white/40 mb-3">{obj.description}</p>}
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 mb-2">
                  <span>Responsável: {obj.profiles?.full_name || '—'}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-brand-orange h-1.5 rounded-full transition-all duration-500" style={{ width: `${obj.progress}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] font-mono text-white/30">{obj.progress}%</span>
                  {obj.due_date && (
                    <span className="text-[10px] font-mono text-white/20">
                      {new Date(obj.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Task Board */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ListTodo className="w-5 h-5 text-brand-orange" />
          <h2 className="text-lg font-serif text-white">Tarefas da Equipe</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map(col => {
            const colTasks = teamTasks.filter((t: any) => t.status === col.key);
            return (
              <div key={col.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 min-h-[200px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-mono uppercase tracking-wider text-white/40">{col.label}</span>
                  <span className="text-white/20 text-xs ml-auto">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.length === 0 ? (
                    <p className="text-white/15 text-xs font-mono text-center py-8">Nenhuma tarefa</p>
                  ) : (
                    colTasks.map((task: any) => (
                      <div key={task.id} className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 ${task.status === 'done' ? 'opacity-50' : ''}`}>
                        <p className={`text-sm text-white ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                            task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                            'border-white/10 text-white/30'
                          }`}>
                            {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                          </span>
                          <span className="text-[9px] font-mono text-white/20">{(task as any).profiles?.full_name || '—'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members Overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UsersRound className="w-5 h-5 text-brand-orange" />
          <h2 className="text-lg font-serif text-white">Membros da Equipe</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {members.map((m: any) => {
            const initials = m.full_name ? m.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??';
            return (
              <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-sm font-mono font-bold mx-auto mb-3">
                  {initials}
                </div>
                <p className="text-sm text-white truncate">{m.full_name || 'Sem nome'}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mt-1">
                  {m.role === 'admin' ? 'Admin' : 'Membro'}
                </p>
                <div className="mt-2 text-[10px] font-mono text-white/20">
                  {m.open_tasks} tarefa{m.open_tasks !== 1 ? 's' : ''} aberta{m.open_tasks !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
