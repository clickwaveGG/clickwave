import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, ListTodo, Megaphone, Plus, Trash2, DollarSign, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import AdminFinancialOverview from '@/components/admin/AdminFinancialOverview';
import AdminTasksDeadlineList from '@/components/admin/AdminTasksDeadlineList';
import AdminServiceProfitTable from '@/components/admin/AdminServiceProfitTable';

export default function AdminPanel() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'users' | 'announcements'>('overview');
  const [taskFilter, setTaskFilter] = useState({ member: '', status: '', priority: '' });
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);

  // All profiles
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (!profiles) return [];
      const result = await Promise.all(
        profiles.map(async (p) => {
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', p.user_id).single();
          return { ...p, role: roleData?.role || 'member' };
        })
      );
      return result;
    },
  });

  // All tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(full_name), creator_profile:profiles!tasks_created_by_fkey(full_name)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // All services with client names and responsible names
  const { data: allServices = [] } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data: services } = await supabase.from('client_services').select('*');
      if (!services) return [];
      const { data: clients } = await supabase.from('clients').select('id, name');
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name');
      const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.name]));
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));
      return services.map(s => ({
        ...s,
        client_name: clientMap[s.client_id] || '—',
        responsible_name: s.responsible_id ? (profileMap[s.responsible_id] || '—') : '—',
      }));
    },
  });

  // Announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Services for financial overview (component handles filtering internally)


  // Mutations
  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('announcements').insert({ content: newAnnouncement, created_by: user!.id, pinned: announcementPinned });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setNewAnnouncement('');
      setAnnouncementPinned(false);
      toast({ title: 'Comunicado criado!' });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  // Filter tasks
  const filteredTasks = allTasks.filter((t: any) => {
    if (taskFilter.member && t.assigned_to !== taskFilter.member) return false;
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    if (taskFilter.priority && t.priority !== taskFilter.priority) return false;
    return true;
  });

  const tabs = [
    { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { key: 'tasks', label: 'Tarefas', icon: ListTodo },
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'announcements', label: 'Comunicados', icon: Megaphone },
  ] as const;

  if (role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-white mb-2">Acesso Restrito</h2>
          <p className="text-white/30 text-sm font-mono">Somente administradores podem acessar este painel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white">
          Painel <span className="italic">Admin.</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">Gerencie finanças, tarefas, usuários e comunicados</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-mono rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <AdminFinancialOverview services={allServices as any} />
          <AdminServiceProfitTable services={allServices.filter((s: any) => !s.completed) as any} />
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={taskFilter.member} onChange={(e) => setTaskFilter(f => ({ ...f, member: e.target.value }))} className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-orange/40">
              <option value="">Todos os membros</option>
              {allProfiles.map((p: any) => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
            </select>
            <select value={taskFilter.status} onChange={(e) => setTaskFilter(f => ({ ...f, status: e.target.value }))} className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-orange/40">
              <option value="">Todos os status</option>
              <option value="todo">A Fazer</option>
              <option value="in_progress">Em Progresso</option>
              <option value="review">Em Revisão</option>
              <option value="done">Concluído</option>
            </select>
            <select value={taskFilter.priority} onChange={(e) => setTaskFilter(f => ({ ...f, priority: e.target.value }))} className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-orange/40">
              <option value="">Todas as prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <AdminTasksDeadlineList tasks={filteredTasks as any} />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Nome</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Role</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Bio</th>
                <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {allProfiles.map((p: any) => {
                const initials = p.full_name ? p.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??';
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-[10px] font-mono font-bold">{initials}</div>
                        <span className="text-sm text-white">{p.full_name || 'Sem nome'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${p.role === 'admin' ? 'border-brand-orange/30 text-brand-orange bg-brand-orange/10' : 'border-white/10 text-white/40'}`}>
                        {p.role === 'admin' ? 'ADMIN' : 'MEMBRO'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/40 max-w-[200px] truncate">{p.bio || '—'}</td>
                    <td className="p-4 text-xs font-mono text-white/20">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <textarea value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} placeholder="Escreva um novo comunicado..." className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40 resize-none h-24" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/50">
                <input type="checkbox" checked={announcementPinned} onChange={(e) => setAnnouncementPinned(e.target.checked)} className="rounded border-white/20" />
                Fixar no topo
              </label>
              <button onClick={() => newAnnouncement && createAnnouncement.mutate()} disabled={!newAnnouncement} className="ml-auto px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-mono hover:bg-orange-600 transition-colors disabled:opacity-50">Publicar</button>
            </div>
          </div>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`rounded-xl border p-4 ${a.pinned ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="flex items-start justify-between">
                  <p className="text-sm text-white/80 flex-1">{a.content}</p>
                  <button onClick={() => deleteAnnouncement.mutate(a.id)} className="text-white/20 hover:text-red-400 transition-colors ml-3 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-[10px] font-mono text-white/20 mt-2">{new Date(a.created_at).toLocaleDateString('pt-BR')} {a.pinned && '· 📌 Fixado'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
