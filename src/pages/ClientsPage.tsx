import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, Plus, ChevronDown, ChevronRight, CheckCircle2, Clock, X,
  ListTodo, Trash2, DollarSign, Video, CalendarDays, RefreshCw, Package, AlertTriangle, Layers
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FloatingSelect } from '@/components/ui/floating-select';
import { toast } from 'sonner';

const SIZE_CONFIG = {
  small: { label: 'Pequeno Porte', color: 'border-sky-500/30 text-sky-400 bg-sky-500/10' },
  medium: { label: 'Médio Porte', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' },
  large: { label: 'Grande Porte', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
};

const SERVICE_PRESETS = [
  'Vídeos', 'Posts / Design', 'Tráfego Pago', 'Site / Landing Page',
  'Automações / Chatbot', 'Gestão de Redes Sociais', 'Branding', 'Outro',
];

// Mapeamento de serviço → responsável padrão por user_id
const SERVICE_DEFAULT_RESPONSIBLE: Record<string, string> = {
  'Vídeos': '46edee23-fcc6-47c6-88a7-9ea7d9ca60aa',                // João Victor
  'Site / Landing Page': '064b66b1-ea4b-4441-b63b-75d3bf749c72',   // Leonardo
  'Tráfego Pago': '6aa5383c-cb63-46e4-bd03-478d0c1456a3',          // Pedro Antônio
  'Posts / Design': 'db42a91a-2e8c-4931-9ded-dcb99114447c',         // Willer
  'Branding': 'db42a91a-2e8c-4931-9ded-dcb99114447c',              // Willer
  'Automações / Chatbot': '8f6ebe49-fd36-414c-bb50-7b51dcaf684b',  // Kauan Cabral
  'Gestão de Redes Sociais': '064b66b1-ea4b-4441-b63b-75d3bf749c72', // Leonardo
};

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
  title: '', description: '', priority: 'medium',
  due_date: '', capture_date: '', assigned_to: '', price: '',
});

interface ServiceRow {
  service_name: string;
  responsible_id: string;
  price: string;
  quantity_per_month: string;
}

const emptyService = (): ServiceRow => ({
  service_name: '', responsible_id: '', price: '', quantity_per_month: '',
});

// Groups tasks like "Vídeos 1/10 — Client" into a single collapsible row
function getServiceBaseKey(title: string): string {
  // Match pattern like "ServiceName N/M — ClientName" and extract "ServiceName — ClientName"
  const match = title.match(/^(.+?)\s+\d+\/\d+\s*(—.*)$/);
  return match ? `${match[1].trim()} ${match[2].trim()}` : title;
}

interface SingleTaskRowProps {
  task: any;
  profiles: any[];
  inputClass: string;
  isAdmin: boolean;
  onUpdateDate: (taskId: string, field: 'due_date' | 'capture_date', value: string) => void;
  onDeleteTask: (taskId: string) => void;
}

function SingleTaskRow({ task, profiles, inputClass, isAdmin, onUpdateDate, onDeleteTask }: SingleTaskRowProps) {
  const assignee = profiles.find((p: any) => p.user_id === task.assigned_to);
  const isVideoTask = task.title?.toLowerCase().includes('vídeo') || task.title?.toLowerCase().includes('video');

  const [localDueDate, setLocalDueDate] = useState(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
  const [localCaptureDate, setLocalCaptureDate] = useState(task.capture_date ? new Date(task.capture_date).toISOString().split('T')[0] : '');

  const origDueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '';
  const origCaptureDate = task.capture_date ? new Date(task.capture_date).toISOString().split('T')[0] : '';
  const hasChanges = localDueDate !== origDueDate || localCaptureDate !== origCaptureDate;

  useEffect(() => {
    setLocalDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
    setLocalCaptureDate(task.capture_date ? new Date(task.capture_date).toISOString().split('T')[0] : '');
  }, [task.due_date, task.capture_date]);

  const handleSave = () => {
    if (localDueDate !== origDueDate) onUpdateDate(task.id, 'due_date', localDueDate);
    if (localCaptureDate !== origCaptureDate) onUpdateDate(task.id, 'capture_date', localCaptureDate);
  };

  return (
    <div className={`group/task rounded-xl border border-white/10 bg-white/[0.02] p-4 ${task.status === 'done' ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Clock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-white ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${task.priority === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10' : task.priority === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' : 'border-white/10 text-white/30'}`}>
              {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
            </span>
            {assignee && <span className="text-[10px] font-mono text-white/25">👤 {assignee.full_name}</span>}
            {isAdmin && task.price != null && Number(task.price) > 0 && <span className="text-[10px] font-mono text-emerald-400/60">R$ {Number(task.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
          </div>
        </div>
        <button
          onClick={() => onDeleteTask(task.id)}
          className="text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover/task:opacity-100 shrink-0 mt-0.5"
          title="Remover tarefa"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={`flex items-end gap-2 mt-3 ml-7`}>
        <div className={`grid gap-2 flex-1 ${isVideoTask ? 'grid-cols-2' : 'grid-cols-1 max-w-[200px]'}`}>
          <div>
            <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Data de Entrega
            </label>
            <input
              type="date"
              value={localDueDate}
              onChange={e => setLocalDueDate(e.target.value)}
              className={`w-full ${inputClass}`}
            />
          </div>
          {isVideoTask && (
            <div>
              <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1">
                <Video className="w-3 h-3" /> Data de Gravação
              </label>
              <input
                type="date"
                value={localCaptureDate}
                onChange={e => setLocalCaptureDate(e.target.value)}
                className={`w-full ${inputClass}`}
              />
            </div>
          )}
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-brand-orange text-brand-black font-medium hover:bg-brand-orange/90 transition-colors shrink-0"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
}

interface GroupedTaskListProps {
  tasks: any[];
  profiles: any[];
  inputClass: string;
  isAdmin: boolean;
  onUpdateDate: (taskId: string, field: 'due_date' | 'capture_date', value: string) => void;
  onDeleteTask: (taskId: string) => void;
}

function GroupedTaskList({ tasks, profiles, inputClass, isAdmin, onUpdateDate, onDeleteTask }: GroupedTaskListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group tasks by service base key
  const groups: { key: string; tasks: any[] }[] = [];
  const groupMap = new Map<string, any[]>();

  tasks.forEach((task: any) => {
    const key = getServiceBaseKey(task.title);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      groups.push({ key, tasks: groupMap.get(key)! });
    }
    groupMap.get(key)!.push(task);
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const renderSingleTask = (task: any) => {
    return <SingleTaskRow key={task.id} task={task} profiles={profiles} inputClass={inputClass} isAdmin={isAdmin} onUpdateDate={onUpdateDate} onDeleteTask={onDeleteTask} />;
  };

  return (
    <div className="space-y-2">
      {groups.map(group => {
        if (group.tasks.length === 1) {
          return renderSingleTask(group.tasks[0]);
        }

        const isExpanded = expandedGroups.has(group.key);
        const doneCount = group.tasks.filter((t: any) => t.status === 'done').length;
        const totalCount = group.tasks.length;
        const totalPrice = group.tasks.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);
        const assignee = profiles.find((p: any) => p.user_id === group.tasks[0].assigned_to);

        return (
          <div key={group.key} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />}
              <Layers className="w-4 h-4 text-brand-orange shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{group.key}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-white/30">{totalCount} tarefa{totalCount !== 1 ? 's' : ''}</span>
                  <span className="text-[10px] font-mono text-emerald-400/50">{doneCount} concluída{doneCount !== 1 ? 's' : ''}</span>
                  {assignee && <span className="text-[10px] font-mono text-white/25">👤 {assignee.full_name}</span>}
                  {isAdmin && totalPrice > 0 && <span className="text-[10px] font-mono text-emerald-400/60">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-orange rounded-full transition-all" style={{ width: `${(doneCount / totalCount) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-white/30">{doneCount}/{totalCount}</span>
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-white/5 p-3 space-y-2">
                {group.tasks.map((task: any) => renderSingleTask(task))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ClientsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewTask, setShowNewTask] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState<string | null>(null);
  const [addServiceRows, setAddServiceRows] = useState<ServiceRow[]>([emptyService()]);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [taskRows, setTaskRows] = useState<NewTaskRow[]>([emptyTask()]);

  // New client form
  const [newClient, setNewClient] = useState({
    name: '', size: 'small', is_recurring: false, notes: '',
  });
  const [newServices, setNewServices] = useState<ServiceRow[]>([emptyService()]);
  

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      return data || [];
    },
  });

  const { data: clientServices = [] } = useQuery({
    queryKey: ['client-services'],
    queryFn: async () => {
      const { data } = await supabase.from('client_services').select('*');
      return data || [];
    },
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-client-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
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

  const { data: isAdmin = false } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['client-services'] });
    queryClient.invalidateQueries({ queryKey: ['all-client-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
  };

  const createClientMutation = useMutation({
    mutationFn: async () => {
      if (!newClient.name.trim()) throw new Error('Nome obrigatório');

      // Create client
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: newClient.name.trim(),
          size: newClient.size,
          is_recurring: newClient.is_recurring,
          notes: newClient.notes,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert services
      const validServices = newServices.filter(s => s.service_name.trim());
      if (validServices.length > 0) {
        const { error: sErr } = await supabase.from('client_services').insert(
          validServices.map(s => ({
            client_id: client.id,
            service_name: s.service_name.trim(),
            responsible_id: s.responsible_id || SERVICE_DEFAULT_RESPONSIBLE[s.service_name.trim()] || null,
            price: s.price ? parseFloat(s.price) : 0,
            quantity_per_month: s.quantity_per_month ? parseInt(s.quantity_per_month) : null,
          }))
        );
        if (sErr) throw sErr;
      }

      // Automatically create tasks from services (N tasks if quantity_per_month is set)
      if (validServices.length > 0) {
        const taskInserts: any[] = [];
        validServices.forEach(s => {
          const qty = s.quantity_per_month ? parseInt(s.quantity_per_month) : 1;
          const count = qty > 0 ? qty : 1;
          for (let i = 0; i < count; i++) {
            taskInserts.push({
              title: count > 1
                ? `${s.service_name} ${i + 1}/${count} — ${newClient.name.trim()}`
                : `${s.service_name} — ${newClient.name.trim()}`,
              client_name: newClient.name.trim(),
              assigned_to: s.responsible_id || SERVICE_DEFAULT_RESPONSIBLE[s.service_name.trim()] || user!.id,
              created_by: user!.id,
              price: s.price ? parseFloat(s.price) / count : null,
              status: 'todo' as const,
              priority: 'medium' as const,
            });
          }
        });
        await supabase.from('tasks').insert(taskInserts);
      }
    },
    onSuccess: () => {
      invalidateAll();
      setNewClient({ name: '', size: 'small', is_recurring: false, notes: '' });
      setNewServices([emptyService()]);
      
      setShowNewClient(false);
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao cadastrar cliente'),
  });

  const createTasksMutation = useMutation({
    mutationFn: async ({ clientName, tasks }: { clientName: string; tasks: NewTaskRow[] }) => {
      const inserts = tasks.filter(t => t.title.trim()).map(t => ({
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
      invalidateAll();
      setTaskRows([emptyTask()]);
      setShowNewTask(null);
      toast.success('Tarefas criadas!');
    },
    onError: () => toast.error('Erro ao criar tarefas'),
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteClientId(null);
      toast.success('Cliente removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover cliente'),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase.from('client_services').delete().eq('id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Serviço removido!');
    },
    onError: () => toast.error('Erro ao remover serviço'),
  });

  const addServicesMutation = useMutation({
    mutationFn: async ({ clientId, clientName, services }: { clientId: string; clientName: string; services: ServiceRow[] }) => {
      const valid = services.filter(s => s.service_name.trim());
      if (valid.length === 0) throw new Error('Adicione ao menos um serviço');
      const { error } = await supabase.from('client_services').insert(
        valid.map(s => ({
          client_id: clientId,
          service_name: s.service_name.trim(),
          responsible_id: s.responsible_id || SERVICE_DEFAULT_RESPONSIBLE[s.service_name.trim()] || null,
          price: s.price ? parseFloat(s.price) : 0,
          quantity_per_month: s.quantity_per_month ? parseInt(s.quantity_per_month) : null,
        }))
      );
      if (error) throw error;

      // Automatically create tasks for responsible users (N tasks if quantity_per_month is set)
      const taskInserts: any[] = [];
      valid.forEach(s => {
        const qty = s.quantity_per_month ? parseInt(s.quantity_per_month) : 1;
        const count = qty > 0 ? qty : 1;
        for (let i = 0; i < count; i++) {
          taskInserts.push({
            title: count > 1
              ? `${s.service_name.trim()} ${i + 1}/${count} — ${clientName}`
              : `${s.service_name.trim()} — ${clientName}`,
            client_name: clientName,
            assigned_to: s.responsible_id || SERVICE_DEFAULT_RESPONSIBLE[s.service_name.trim()] || user!.id,
            created_by: user!.id,
            price: s.price ? parseFloat(s.price) / count : null,
            status: 'todo' as const,
            priority: 'medium' as const,
          });
        }
      });
      await supabase.from('tasks').insert(taskInserts);
    },
    onSuccess: () => {
      invalidateAll();
      setAddServiceRows([emptyService()]);
      setShowAddService(null);
      toast.success('Serviços adicionados!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao adicionar serviços'),
  });

  const updateTaskDateMutation = useMutation({
    mutationFn: async ({ taskId, field, value }: { taskId: string; field: 'due_date' | 'capture_date'; value: string }) => {
      const { error } = await supabase.from('tasks').update({ [field]: value || null }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast.success('Data atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar data'),
  });

  const updateTaskRow = (i: number, field: keyof NewTaskRow, value: string) => {
    setTaskRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const updateService = (i: number, field: keyof ServiceRow, value: string) => {
    setNewServices(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, [field]: value };
      if (field === 'service_name' && SERVICE_DEFAULT_RESPONSIBLE[value] && !r.responsible_id) {
        updated.responsible_id = SERVICE_DEFAULT_RESPONSIBLE[value];
      }
      return updated;
    }));
  };

  const updateAddServiceRow = (i: number, field: keyof ServiceRow, value: string) => {
    setAddServiceRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, [field]: value };
      if (field === 'service_name' && SERVICE_DEFAULT_RESPONSIBLE[value] && !r.responsible_id) {
        updated.responsible_id = SERVICE_DEFAULT_RESPONSIBLE[value];
      }
      return updated;
    }));
  };

  const getTasksForClient = (clientName: string) =>
    allTasks.filter((t: any) => t.client_name?.toLowerCase() === clientName.toLowerCase());

  const getServicesForClient = (clientId: string) =>
    clientServices.filter((s: any) => s.client_id === clientId);

  const groupedClients = {
    large: clients.filter((c: any) => c.size === 'large'),
    medium: clients.filter((c: any) => c.size === 'medium'),
    small: clients.filter((c: any) => c.size === 'small'),
  };

  const inputClass = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40';

  const renderClientCard = (client: any) => {
    const clientTasks = getTasksForClient(client.name);
    const services = getServicesForClient(client.id);
    const isExpanded = expandedClient === client.id;
    const doneTasks = clientTasks.filter((t: any) => t.status === 'done').length;
    const totalTasks = clientTasks.length;
    const totalServiceValue = services.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
    const sizeConf = SIZE_CONFIG[client.size as keyof typeof SIZE_CONFIG] || SIZE_CONFIG.small;

    return (
      <div key={client.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <button
          onClick={() => setExpandedClient(isExpanded ? null : client.id)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />}
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-brand-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium truncate">{client.name}</p>
              {client.is_recurring && (
                <span className="flex items-center gap-1 text-[9px] font-mono border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <RefreshCw className="w-2.5 h-2.5" /> RECORRENTE
                </span>
              )}
            </div>
            <p className="text-white/30 text-xs font-mono mt-0.5">
              {services.length} serviço{services.length !== 1 ? 's' : ''} · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
              {isAdmin && totalServiceValue > 0 && ` · R$ ${totalServiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          </div>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border shrink-0 ${sizeConf.color}`}>
            {sizeConf.label.toUpperCase()}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteClientId(client.id); }}
            className="text-white/15 hover:text-red-400 transition-colors shrink-0"
            title="Remover cliente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {totalTasks > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange rounded-full transition-all" style={{ width: `${(doneTasks / totalTasks) * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono text-white/30">{Math.round((doneTasks / totalTasks) * 100)}%</span>
            </div>
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-white/5 p-5 space-y-5">
            {/* Notes */}
            {client.notes && (
              <p className="text-xs text-white/40 italic">{client.notes}</p>
            )}

            {/* Contracted Services */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-orange" />
                  <span className="text-sm font-mono text-white/50 uppercase tracking-wider">Serviços Contratados</span>
                </div>
                <button
                  onClick={() => { setShowAddService(showAddService === client.id ? null : client.id); setAddServiceRows([emptyService()]); }}
                  className="flex items-center gap-1.5 text-xs text-brand-orange hover:text-brand-orange/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar serviços
                </button>
              </div>

              {/* Add services form for existing client */}
              {showAddService === client.id && (
                <div className="rounded-xl border border-brand-orange/20 bg-white/[0.02] p-4 space-y-3 mb-3">
                  {addServiceRows.map((s, idx) => (
                    <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-brand-orange/60 w-5 text-center shrink-0">{idx + 1}</span>
                        <FloatingSelect
                          value={s.service_name}
                          onChange={val => updateAddServiceRow(idx, 'service_name', val)}
                          options={SERVICE_PRESETS.map(sp => ({ value: sp, label: sp }))}
                          placeholder="Selecionar serviço..."
                          className="flex-1"
                        />
                        <button onClick={() => setAddServiceRows(prev => prev.length === 1 ? [emptyService()] : prev.filter((_, i) => i !== idx))} className="text-white/15 hover:text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Responsável</label>
                          <FloatingSelect
                            value={s.responsible_id}
                            onChange={val => updateAddServiceRow(idx, 'responsible_id', val)}
                            options={profiles.map((p: any) => ({ value: p.user_id, label: p.full_name }))}
                            placeholder="Selecionar..."
                          />
                        </div>
                        {isAdmin && (
                          <div>
                            <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor</label>
                            <input type="number" step="0.01" min="0" value={s.price} onChange={e => updateAddServiceRow(idx, 'price', e.target.value)} placeholder="0,00" className={`w-full ${inputClass}`} />
                          </div>
                        )}
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Qtd/mês</label>
                          <input type="number" min="0" value={s.quantity_per_month} onChange={e => updateAddServiceRow(idx, 'quantity_per_month', e.target.value)} placeholder="—" className={`w-full ${inputClass}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <button onClick={() => setAddServiceRows(prev => [...prev, emptyService()])} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60"><Plus className="w-3.5 h-3.5" /> Mais um serviço</button>
                    <button
                      onClick={() => addServicesMutation.mutate({ clientId: client.id, clientName: client.name, services: addServiceRows })}
                      className="px-4 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-medium hover:bg-brand-orange/90 transition-colors"
                    >
                      Salvar {addServiceRows.filter(r => r.service_name.trim()).length} serviço{addServiceRows.filter(r => r.service_name.trim()).length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}

              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {services.map((s: any) => {
                    const resp = profiles.find((p: any) => p.user_id === s.responsible_id);
                    return (
                      <div key={s.id} className="group/svc rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{s.service_name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {resp && <span className="text-[10px] font-mono text-white/30">👤 {resp.full_name}</span>}
                              {s.quantity_per_month && (
                                <span className="text-[10px] font-mono text-white/25">{s.quantity_per_month}/mês</span>
                              )}
                              {s.due_date && <span className="text-[10px] font-mono text-white/20">📅 {new Date(s.due_date).toLocaleDateString('pt-BR')}</span>}
                              {s.capture_date && <span className="text-[10px] font-mono text-purple-400/60">🎬 {new Date(s.capture_date).toLocaleDateString('pt-BR')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isAdmin && Number(s.price) > 0 && (
                              <span className="text-xs font-mono text-emerald-400/70">
                                R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <button
                              onClick={() => deleteServiceMutation.mutate(s.id)}
                              className="text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover/svc:opacity-100"
                              title="Remover serviço"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/15 text-xs font-mono text-center py-2">Nenhum serviço cadastrado</p>
              )}
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-brand-orange" />
                  <span className="text-sm font-mono text-white/50 uppercase tracking-wider">Demandas</span>
                </div>
                <button
                  onClick={() => { setShowNewTask(showNewTask === client.id ? null : client.id); setTaskRows([emptyTask()]); }}
                  className="flex items-center gap-1.5 text-xs text-brand-orange hover:text-brand-orange/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar tarefas
                </button>
              </div>

              {/* Multi-task form */}
              {showNewTask === client.id && (
                <div className="rounded-xl border border-brand-orange/20 bg-white/[0.02] p-4 space-y-3 mb-3">
                  {taskRows.map((row, idx) => (
                    <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-brand-orange/60 w-5 text-center shrink-0">{idx + 1}</span>
                        <input value={row.title} onChange={e => updateTaskRow(idx, 'title', e.target.value)} placeholder="Título..." className={`flex-1 ${inputClass}`} />
                        <button onClick={() => setTaskRows(prev => prev.length === 1 ? [emptyTask()] : prev.filter((_, i) => i !== idx))} className="text-white/15 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Responsável</label>
                          <FloatingSelect
                            value={row.assigned_to}
                            onChange={val => updateTaskRow(idx, 'assigned_to', val)}
                            options={profiles.map((p: any) => ({ value: p.user_id, label: p.full_name }))}
                            placeholder="Selecionar..."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Prioridade</label>
                          <FloatingSelect
                            value={row.priority}
                            onChange={val => updateTaskRow(idx, 'priority', val)}
                            options={[
                              { value: 'low', label: 'Baixa' },
                              { value: 'medium', label: 'Média' },
                              { value: 'high', label: 'Alta' },
                            ]}
                            placeholder="Prioridade..."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Entrega</label>
                          <input type="date" value={row.due_date} onChange={e => updateTaskRow(idx, 'due_date', e.target.value)} className={`w-full ${inputClass}`} />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1"><Video className="w-3 h-3" /> Captação</label>
                          <input type="date" value={row.capture_date} onChange={e => updateTaskRow(idx, 'capture_date', e.target.value)} className={`w-full ${inputClass}`} />
                        </div>
                        {isAdmin && (
                        <div>
                          <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$</label>
                          <input type="number" step="0.01" min="0" value={row.price} onChange={e => updateTaskRow(idx, 'price', e.target.value)} placeholder="0,00" className={`w-full ${inputClass}`} />
                        </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <button onClick={() => setTaskRows(prev => [...prev, emptyTask()])} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60"><Plus className="w-3.5 h-3.5" /> Mais uma</button>
                    <button
                      onClick={() => { if (!taskRows.some(r => r.title.trim())) return toast.error('Adicione um título'); createTasksMutation.mutate({ clientName: client.name, tasks: taskRows }); }}
                      className="px-4 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-medium hover:bg-brand-orange/90 transition-colors"
                    >
                      Criar {taskRows.filter(r => r.title.trim()).length} tarefa{taskRows.filter(r => r.title.trim()).length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}

              {clientTasks.length === 0 ? (
                <p className="text-white/15 text-xs font-mono text-center py-4">Nenhuma demanda</p>
              ) : (
                <GroupedTaskList
                  tasks={clientTasks}
                  profiles={profiles}
                  inputClass={inputClass}
                  isAdmin={isAdmin}
                  onUpdateDate={(taskId, field, value) => updateTaskDateMutation.mutate({ taskId, field, value })}
                  onDeleteTask={async (taskId) => {
                    await supabase.from('tasks').delete().eq('id', taskId);
                    invalidateAll();
                    toast.success('Tarefa removida!');
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white"><span className="italic">Clientes.</span></h1>
          <p className="text-white/40 text-sm font-mono mt-2">Gerencie demandas e serviços por cliente</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowNewClient(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-sm hover:bg-brand-orange/20 transition-colors">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        )}
      </div>

      {/* New Client Form */}
      {showNewClient && (
        <div className="rounded-2xl border border-brand-orange/20 bg-white/[0.03] p-6 space-y-5">
          <h3 className="text-base font-serif text-white">Cadastrar Novo Cliente</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/30 uppercase mb-1.5 block">Nome do Cliente</label>
              <input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Restaurante XYZ" className={`w-full ${inputClass}`} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/30 uppercase mb-1.5 block">Porte</label>
              <FloatingSelect
                value={newClient.size}
                onChange={val => setNewClient(p => ({ ...p, size: val }))}
                options={[
                  { value: 'small', label: 'Pequeno Porte' },
                  { value: 'medium', label: 'Médio Porte' },
                  { value: 'large', label: 'Grande Porte' },
                ]}
                placeholder="Selecionar porte..."
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newClient.is_recurring} onChange={e => setNewClient(p => ({ ...p, is_recurring: e.target.checked }))} className="rounded border-white/20 bg-white/5 text-brand-orange focus:ring-brand-orange/30" />
                <span className="text-sm text-white/50">Cliente recorrente</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-white/30 uppercase mb-1.5 block">Observações</label>
            <textarea value={newClient.notes} onChange={e => setNewClient(p => ({ ...p, notes: e.target.value }))} placeholder="Informações adicionais sobre o cliente..." rows={2} className={`w-full ${inputClass} resize-none`} />
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-mono text-white/30 uppercase flex items-center gap-1.5"><Package className="w-3 h-3" /> Serviços Contratados</label>
            </div>
            <div className="space-y-3">
              {newServices.map((s, idx) => (
                <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono text-brand-orange/60 w-5 text-center shrink-0">{idx + 1}</span>
                    <FloatingSelect
                      value={s.service_name}
                      onChange={val => updateService(idx, 'service_name', val)}
                      options={SERVICE_PRESETS.map(sp => ({ value: sp, label: sp }))}
                      placeholder="Selecionar serviço..."
                      className="flex-1"
                    />
                    <button onClick={() => setNewServices(prev => prev.length === 1 ? [emptyService()] : prev.filter((_, i) => i !== idx))} className="text-white/15 hover:text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Responsável</label>
                      <FloatingSelect
                        value={s.responsible_id}
                        onChange={val => updateService(idx, 'responsible_id', val)}
                        options={profiles.map((p: any) => ({ value: p.user_id, label: p.full_name }))}
                        placeholder="Selecionar..."
                      />
                    </div>
                    {isAdmin && (
                      <div>
                        <label className="text-[9px] font-mono text-white/25 uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor</label>
                        <input type="number" step="0.01" min="0" value={s.price} onChange={e => updateService(idx, 'price', e.target.value)} placeholder="0,00" className={`w-full ${inputClass}`} />
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] font-mono text-white/25 uppercase mb-1 block">Qtd/mês</label>
                      <input type="number" min="0" value={s.quantity_per_month} onChange={e => updateService(idx, 'quantity_per_month', e.target.value)} placeholder="—" className={`w-full ${inputClass}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setNewServices(prev => [...prev, emptyService()])} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 mt-2"><Plus className="w-3.5 h-3.5" /> Mais um serviço</button>
          </div>


          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => { setShowNewClient(false); setNewClient({ name: '', size: 'small', is_recurring: false, notes: '' }); setNewServices([emptyService()]); }} className="px-4 py-2 rounded-xl text-sm text-white/30 hover:text-white/60">
              Cancelar
            </button>
            <button onClick={() => createClientMutation.mutate()} className="px-5 py-2 rounded-xl bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors">
              Cadastrar Cliente
            </button>
          </div>
        </div>
      )}

      {/* Client list by size */}
      {clients.length === 0 && !showNewClient ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Building2 className="w-10 h-10 text-white/10 mx-auto mb-4" />
          <p className="text-white/20 text-sm font-mono">Nenhum cliente cadastrado ainda</p>
        </div>
      ) : (
        (['large', 'medium', 'small'] as const).map(size => {
          const group = groupedClients[size];
          if (group.length === 0) return null;
          const conf = SIZE_CONFIG[size];
          return (
            <div key={size}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded border ${conf.color}`}>{conf.label.toUpperCase()}</span>
                <span className="text-white/15 text-xs font-mono">{group.length} cliente{group.length !== 1 ? 's' : ''}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="space-y-3">
                {group.map(renderClientCard)}
              </div>
            </div>
          );
        })
      )}
      <AlertDialog open={!!deleteClientId} onOpenChange={(open) => !open && setDeleteClientId(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Remover cliente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Tem certeza que deseja remover este cliente? Todos os serviços vinculados serão excluídos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClientId && deleteClientMutation.mutate(deleteClientId)}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
