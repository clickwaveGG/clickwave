import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Plus, ChevronDown, ChevronRight, CheckCircle2, Clock, X, ListTodo, Trash2, DollarSign, Video, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface NewTaskRow {
  title: string;
  description: string;
  priority: string;
  due_date: string;
  capture_date: string;
  assigned_to: string;
  price: string;
}

const emptyTask = (): NewTaskRow => ({
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  capture_date: '',
  assigned_to: '',
  price: '',
});

export default function ClientsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [showNewTask, setShowNewTask] = useState<string | null>(null);
  const [taskRows, setTaskRows] = useState<NewTaskRow[]>([emptyTask()]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      return data || [];
    },
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-client-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, profiles!tasks_assigned_to_fkey(full_name)')
        .not('client_name', 'is', null)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name, position');
      return data || [];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('clients').insert({ name, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setNewClientName('');
      setShowNewClient(false);
      toast.success('Cliente adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar cliente'),
  });

  const createTasksMutation = useMutation({
    mutationFn: async ({ clientName, tasks }: { clientName: string; tasks: NewTaskRow[] }) => {
      const inserts = tasks
        .filter(t => t.title.trim())
        .map(t => ({
          title: t.title.trim(),
          description: t.description || null,
          priority: t.priority,
          due_date: t.due_date || null,
          capture_date: t.capture_date || null,
          price: t.price ? parseFloat(t.price) : null,
          client_name: clientName,
          assigned_to: t.assigned_to || user!.id,
          created_by: user!.id,
          status: 'todo' as const,
        }));
      if (inserts.length === 0) return;
      const { error } = await supabase.from('tasks').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-client-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setTaskRows([emptyTask()]);
      setShowNewTask(null);
      toast.success('Tarefas criadas com sucesso!');
    },
    onError: () => toast.error('Erro ao criar tarefas'),
  });

  const updateTaskRow = (index: number, field: keyof NewTaskRow, value: string) => {
    setTaskRows(prev => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeTaskRow = (index: number) => {
    setTaskRows(prev => (prev.length === 1 ? [emptyTask()] : prev.filter((_, i) => i !== index)));
  };

  const getTasksForClient = (clientName: string) =>
    allTasks.filter((t: any) => t.client_name?.toLowerCase() === clientName.toLowerCase());

  const openNewTaskForm = (clientId: string) => {
    if (showNewTask === clientId) {
      setShowNewTask(null);
    } else {
      setShowNewTask(clientId);
      setTaskRows([emptyTask()]);
    }
  };

  const inputClass = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40';

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white">
            <span className="italic">Clientes.</span>
          </h1>
          <p className="text-white/40 text-sm font-mono mt-2">Gerencie demandas por cliente</p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-sm hover:bg-brand-orange/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* New client form */}
      {showNewClient && (
        <div className="rounded-2xl border border-brand-orange/20 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Nome do cliente..."
              className={`flex-1 ${inputClass} rounded-xl px-4 py-2.5`}
              onKeyDown={(e) => e.key === 'Enter' && newClientName.trim() && createClientMutation.mutate(newClientName.trim())}
            />
            <button
              onClick={() => newClientName.trim() && createClientMutation.mutate(newClientName.trim())}
              className="px-4 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors"
            >
              Adicionar
            </button>
            <button onClick={() => { setShowNewClient(false); setNewClientName(''); }} className="text-white/30 hover:text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Building2 className="w-10 h-10 text-white/10 mx-auto mb-4" />
          <p className="text-white/20 text-sm font-mono">Nenhum cliente cadastrado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client: any) => {
            const clientTasks = getTasksForClient(client.name);
            const isExpanded = expandedClient === client.id;
            const doneTasks = clientTasks.filter((t: any) => t.status === 'done').length;
            const totalTasks = clientTasks.length;
            const totalPrice = clientTasks.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);

            return (
              <div key={client.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {/* Client header */}
                <button
                  onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{client.name}</p>
                    <p className="text-white/30 text-xs font-mono mt-0.5">
                      {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''} · {doneTasks} concluída{doneTasks !== 1 ? 's' : ''}
                      {totalPrice > 0 && ` · R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                  {totalTasks > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full transition-all"
                          style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white/30">
                        {Math.round((doneTasks / totalTasks) * 100)}%
                      </span>
                    </div>
                  )}
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-brand-orange" />
                        <span className="text-sm font-mono text-white/50 uppercase tracking-wider">Demandas</span>
                      </div>
                      <button
                        onClick={() => openNewTaskForm(client.id)}
                        className="flex items-center gap-1.5 text-xs text-brand-orange hover:text-brand-orange/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar tarefas
                      </button>
                    </div>

                    {/* Multi-task form */}
                    {showNewTask === client.id && (
                      <div className="rounded-xl border border-brand-orange/20 bg-white/[0.02] p-4 space-y-4">
                        <p className="text-xs font-mono text-white/40 uppercase tracking-wider">Novas tarefas para {client.name}</p>

                        <div className="space-y-3">
                          {taskRows.map((row, idx) => (
                            <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-brand-orange/60 w-5 text-center shrink-0">
                                  {idx + 1}
                                </span>
                                <input
                                  value={row.title}
                                  onChange={(e) => updateTaskRow(idx, 'title', e.target.value)}
                                  placeholder="Título da tarefa..."
                                  className={`flex-1 ${inputClass}`}
                                />
                                <button
                                  onClick={() => removeTaskRow(idx)}
                                  className="text-white/15 hover:text-red-400 transition-colors shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <textarea
                                value={row.description}
                                onChange={(e) => updateTaskRow(idx, 'description', e.target.value)}
                                placeholder="Descrição (opcional)..."
                                rows={1}
                                className={`w-full ${inputClass} resize-none`}
                              />

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {/* Responsável */}
                                <div>
                                  <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Responsável</label>
                                  <select
                                    value={row.assigned_to}
                                    onChange={(e) => updateTaskRow(idx, 'assigned_to', e.target.value)}
                                    className={`w-full ${inputClass}`}
                                  >
                                    <option value="">Selecionar...</option>
                                    {profiles.map((p: any) => (
                                      <option key={p.user_id} value={p.user_id}>
                                        {p.full_name} {p.position ? `(${p.position})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Prioridade */}
                                <div>
                                  <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Prioridade</label>
                                  <select
                                    value={row.priority}
                                    onChange={(e) => updateTaskRow(idx, 'priority', e.target.value)}
                                    className={`w-full ${inputClass}`}
                                  >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                  </select>
                                </div>

                                {/* Data entrega */}
                                <div>
                                  <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" /> Entrega
                                  </label>
                                  <input
                                    type="date"
                                    value={row.due_date}
                                    onChange={(e) => updateTaskRow(idx, 'due_date', e.target.value)}
                                    className={`w-full ${inputClass}`}
                                  />
                                </div>

                                {/* Data captação */}
                                <div>
                                  <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1">
                                    <Video className="w-3 h-3" /> Captação
                                  </label>
                                  <input
                                    type="date"
                                    value={row.capture_date}
                                    onChange={(e) => updateTaskRow(idx, 'capture_date', e.target.value)}
                                    className={`w-full ${inputClass}`}
                                  />
                                </div>

                                {/* Preço */}
                                <div>
                                  <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Preço (R$)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.price}
                                    onChange={(e) => updateTaskRow(idx, 'price', e.target.value)}
                                    placeholder="0,00"
                                    className={`w-full ${inputClass}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setTaskRows(prev => [...prev, emptyTask()])}
                            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Mais uma tarefa
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setShowNewTask(null); setTaskRows([emptyTask()]); }}
                              className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                const valid = taskRows.some(r => r.title.trim());
                                if (!valid) return toast.error('Adicione pelo menos um título');
                                createTasksMutation.mutate({ clientName: client.name, tasks: taskRows });
                              }}
                              className="px-4 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-medium hover:bg-brand-orange/90 transition-colors"
                            >
                              Criar {taskRows.filter(r => r.title.trim()).length} tarefa{taskRows.filter(r => r.title.trim()).length !== 1 ? 's' : ''}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Task list */}
                    {clientTasks.length === 0 ? (
                      <p className="text-white/15 text-xs font-mono text-center py-6">Nenhuma demanda para este cliente</p>
                    ) : (
                      <div className="space-y-2">
                        {clientTasks.map((task: any) => {
                          const assignee = profiles.find((p: any) => p.user_id === task.assigned_to);
                          return (
                            <div
                              key={task.id}
                              className={`rounded-xl border border-white/10 bg-white/[0.02] p-3.5 flex items-start gap-3 ${task.status === 'done' ? 'opacity-50' : ''}`}
                            >
                              {task.status === 'done' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm text-white ${task.status === 'done' ? 'line-through' : ''}`}>
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-white/30 mt-1 line-clamp-1">{task.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                    task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                    task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                                    'border-white/10 text-white/30'
                                  }`}>
                                    {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                                  </span>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                    task.status === 'done' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                    task.status === 'in_progress' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                    task.status === 'review' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                    'border-white/10 text-white/30'
                                  }`}>
                                    {task.status === 'done' ? 'CONCLUÍDO' : task.status === 'in_progress' ? 'EM ANDAMENTO' : task.status === 'review' ? 'REVISÃO' : 'A FAZER'}
                                  </span>
                                  {assignee && (
                                    <span className="text-[10px] font-mono text-white/25">
                                      👤 {assignee.full_name}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <span className="text-[10px] font-mono text-white/20">
                                      📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                  {task.capture_date && (
                                    <span className="text-[10px] font-mono text-purple-400/60">
                                      🎬 Captação: {new Date(task.capture_date).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                  {task.price != null && Number(task.price) > 0 && (
                                    <span className="text-[10px] font-mono text-emerald-400/60">
                                      R$ {Number(task.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
