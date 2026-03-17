import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Clock, ListTodo, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-serif text-white">{value}</p>
        <p className="text-white/40 text-xs font-mono uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: objectives = [] } = useQuery({
    queryKey: ['my-objectives', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('objectives')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('is_team_objective', false)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pendingItems = [] } = useQuery({
    queryKey: ['my-pending', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const firstName = profile?.full_name?.split(' ')[0] || 'Colaborador';

  const statusColumns = [
    { key: 'todo', label: 'A Fazer', color: 'text-white/40' },
    { key: 'in_progress', label: 'Em Progresso', color: 'text-blue-400' },
    { key: 'review', label: 'Em Revisão', color: 'text-yellow-400' },
    { key: 'done', label: 'Concluído', color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white">
          Olá, <span className="italic">{firstName}.</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">Seu painel de produtividade</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ListTodo} label="Total de tarefas" value={totalTasks} color="bg-brand-orange/10 text-brand-orange border border-brand-orange/20" />
        <StatCard icon={Clock} label="Pendentes" value={pendingTasks} color="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" />
        <StatCard icon={CheckCircle2} label="Concluídas" value={completedTasks} color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-lg font-serif text-white mb-4">Minhas Tarefas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 min-h-[200px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${
                    col.key === 'todo' ? 'bg-white/30' :
                    col.key === 'in_progress' ? 'bg-blue-400' :
                    col.key === 'review' ? 'bg-yellow-400' : 'bg-emerald-400'
                  }`} />
                  <span className={`text-xs font-mono uppercase tracking-wider ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-white/20 text-xs ml-auto">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.length === 0 ? (
                    <p className="text-white/15 text-xs font-mono text-center py-8">Nenhuma tarefa</p>
                  ) : (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 ${
                          task.status === 'done' ? 'opacity-50' : ''
                        }`}
                      >
                        <p className={`text-sm text-white ${task.status === 'done' ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                            task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                            'border-white/10 text-white/30'
                          }`}>
                            {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                          </span>
                          {task.due_date && (
                            <span className={`text-[9px] font-mono ${
                              new Date(task.due_date).getTime() - Date.now() < 48 * 60 * 60 * 1000
                                ? 'text-red-400'
                                : 'text-white/20'
                            }`}>
                              {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
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

      {/* Objectives */}
      <div>
        <h2 className="text-lg font-serif text-white mb-4">Meus Objetivos</h2>
        {objectives.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/20 text-sm font-mono">Nenhum objetivo definido ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objectives.map(obj => (
              <div key={obj.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white">{obj.title}</p>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    obj.status === 'completed'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-brand-orange/30 text-brand-orange bg-brand-orange/10'
                  }`}>
                    {obj.status === 'completed' ? 'CONCLUÍDO' : 'ATIVO'}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
                  <div
                    className="bg-brand-orange h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${obj.progress}%` }}
                  />
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

      {/* Pending Items */}
      <div>
        <h2 className="text-lg font-serif text-white mb-4">Itens Pendentes</h2>
        {pendingItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/20 text-sm font-mono">Nenhum item pendente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className={`w-4 h-4 rounded border ${
                  item.is_done
                    ? 'bg-emerald-500/20 border-emerald-500/40'
                    : 'border-white/20'
                } flex items-center justify-center`}>
                  {item.is_done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className={`text-sm ${item.is_done ? 'text-white/30 line-through' : 'text-white/70'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
