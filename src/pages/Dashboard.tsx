import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { WeeklyTasksSection } from '@/components/dashboard/WeeklyTasksSection';
import { ObjectivesSection } from '@/components/dashboard/ObjectivesSection';
import { PendingItemsSection } from '@/components/dashboard/PendingItemsSection';

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

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white">
          Olá, <span className="italic">{firstName}.</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">
          {profile?.position
            ? `${profile.position} — campanhas, métricas e clientes em um só lugar`
            : 'Seus projetos web & CRM em um só lugar'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ListTodo} label="Total de tarefas" value={totalTasks} color="bg-brand-orange/10 text-brand-orange border border-brand-orange/20" />
        <StatCard icon={Clock} label="Pendentes" value={pendingTasks} color="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" />
        <StatCard icon={CheckCircle2} label="Concluídas" value={completedTasks} color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
      </div>

      <KanbanBoard tasks={tasks} />
      {profile?.position === 'Gestor de Tráfego' && <WeeklyTasksSection />}
      <ObjectivesSection objectives={objectives} />
      <PendingItemsSection items={pendingItems} />
    </div>
  );
}
