import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, ListTodo, Megaphone, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function AdminPanel() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'tasks' | 'announcements'>('users');

  // Filters
  const [taskFilter, setTaskFilter] = useState({ member: '', status: '', priority: '' });

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);

  // New task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', is_team_task: false });

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

  // Announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Create announcement
  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('announcements').insert({
        content: newAnnouncement,
        created_by: user!.id,
        pinned: announcementPinned,
      });
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

  // Delete announcement
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

  // Create task
  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tasks').insert({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assigned_to: newTask.assigned_to || null,
        created_by: user!.id,
        is_team_task: newTask.is_team_task,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', is_team_task: false });
      setShowTaskForm(false);
      toast({ title: 'Tarefa criada!' });
    },
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tasks'] }),
  });

  // Filter tasks
  const filteredTasks = allTasks.filter((t: any) => {
    if (taskFilter.member && t.assigned_to !== taskFilter.member) return false;
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    if (taskFilter.priority && t.priority !== taskFilter.priority) return false;
    return true;
  });

  const tabs = [
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'tasks', label: 'Tarefas', icon: ListTodo },
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
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-white">
          Painel <span className="italic">Admin.</span>
        </h1>
        <p className="text-white/40 text-sm font-mono mt-2">Gerencie usuários, tarefas e comunicados</p>
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
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
                          <div className="w-8 h-8 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-[10px] font-mono font-bold">
                            {initials}
                          </div>
                          <span className="text-sm text-white">{p.full_name || 'Sem nome'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          p.role === 'admin' ? 'border-brand-orange/30 text-brand-orange bg-brand-orange/10' : 'border-white/10 text-white/40'
                        }`}>
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
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={taskFilter.member}
              onChange={(e) => setTaskFilter(f => ({ ...f, member: e.target.value }))}
              className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-orange/40"
            >
              <option value="">Todos os membros</option>
              {allProfiles.map((p: any) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
              ))}
            </select>
            <select
              value={taskFilter.status}
              onChange={(e) => setTaskFilter(f => ({ ...f, status: e.target.value }))}
              className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-orange/40"
            >
              <option value="">Todos os status</option>
              <option value="todo">A Fazer</option>
              <option value="in_progress">Em Progresso</option>
              <option value="review">Em Revisão</option>
              <option value="done">Concluído</option>
            </select>
            <select
              value={taskFilter.priority}
              onChange={(e) => setTaskFilter(f => ({ ...f, priority: e.target.value }))}
              className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand-orange/40"
            >
              <option value="">Todas as prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-mono hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          </div>

          {/* New Task Form */}
          {showTaskForm && (
            <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-4 space-y-3">
              <input
                value={newTask.title}
                onChange={(e) => setNewTask(t => ({ ...t, title: e.target.value }))}
                placeholder="Título da tarefa"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40"
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(t => ({ ...t, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40 resize-none h-20"
              />
              <div className="flex flex-wrap gap-3">
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask(t => ({ ...t, assigned_to: e.target.value }))}
                  className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                >
                  <option value="">Sem atribuição</option>
                  {allProfiles.map((p: any) => (
                    <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
                  ))}
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(t => ({ ...t, priority: e.target.value }))}
                  className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-white/50">
                  <input
                    type="checkbox"
                    checked={newTask.is_team_task}
                    onChange={(e) => setNewTask(t => ({ ...t, is_team_task: e.target.checked }))}
                    className="rounded border-white/20"
                  />
                  Tarefa de equipe
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => newTask.title && createTask.mutate()}
                  disabled={!newTask.title}
                  className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-mono hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Criar Tarefa
                </button>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/40 text-sm font-mono hover:bg-white/5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tasks list */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Tarefa</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Atribuído</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Status</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Prioridade</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-white/30 p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-white/20 text-sm font-mono">Nenhuma tarefa encontrada</td></tr>
                ) : (
                  filteredTasks.map((t: any) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-4">
                        <p className="text-sm text-white">{t.title}</p>
                        {t.is_team_task && <span className="text-[9px] font-mono text-blue-400">EQUIPE</span>}
                      </td>
                      <td className="p-4 text-sm text-white/40">{t.assigned_profile?.full_name || '—'}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          t.status === 'done' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                          t.status === 'in_progress' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                          t.status === 'review' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                          'border-white/10 text-white/30'
                        }`}>
                          {t.status === 'done' ? 'CONCLUÍDO' : t.status === 'in_progress' ? 'EM PROGRESSO' : t.status === 'review' ? 'EM REVISÃO' : 'A FAZER'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          t.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                          t.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                          'border-white/10 text-white/30'
                        }`}>
                          {t.priority === 'high' ? 'ALTA' : t.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => deleteTask.mutate(t.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {/* New announcement form */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <textarea
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              placeholder="Escreva um novo comunicado..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40 resize-none h-24"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/50">
                <input
                  type="checkbox"
                  checked={announcementPinned}
                  onChange={(e) => setAnnouncementPinned(e.target.checked)}
                  className="rounded border-white/20"
                />
                Fixar no topo
              </label>
              <button
                onClick={() => newAnnouncement && createAnnouncement.mutate()}
                disabled={!newAnnouncement}
                className="ml-auto px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-mono hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                Publicar
              </button>
            </div>
          </div>

          {/* Existing announcements */}
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`rounded-xl border p-4 ${a.pinned ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="flex items-start justify-between">
                  <p className="text-sm text-white/80 flex-1">{a.content}</p>
                  <button
                    onClick={() => deleteAnnouncement.mutate(a.id)}
                    className="text-white/20 hover:text-red-400 transition-colors ml-3 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] font-mono text-white/20 mt-2">
                  {new Date(a.created_at).toLocaleDateString('pt-BR')} {a.pinned && '· 📌 Fixado'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
