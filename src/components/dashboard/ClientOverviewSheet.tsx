import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, Palette, Globe, Megaphone, Bot, Package, Camera, Send, CalendarDays, TrendingUp } from 'lucide-react';
import { format, isFuture, isToday, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getServiceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('vídeo') || n.includes('video')) return Video;
  if (n.includes('design') || n.includes('post') || n.includes('branding')) return Palette;
  if (n.includes('site') || n.includes('landing')) return Globe;
  if (n.includes('tráfego') || n.includes('trafego')) return Megaphone;
  if (n.includes('automação') || n.includes('automacao') || n.includes('chatbot')) return Bot;
  return Package;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientOverviewSheet({ open, onOpenChange }: Props) {
  const { user } = useAuth();

  const { data: services = [] } = useQuery({
    queryKey: ['overview-services', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_services')
        .select('*, clients(name)')
        .eq('responsible_id', user!.id);
      return data || [];
    },
    enabled: !!user && open,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['overview-tasks', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user!.id);
      return data || [];
    },
    enabled: !!user && open,
  });

  const currentMonth = format(new Date(), 'yyyy-MM-01');
  const { data: completions = [] } = useQuery({
    queryKey: ['overview-completions', user?.id, currentMonth],
    queryFn: async () => {
      const serviceIds = services.map((s: any) => s.id);
      if (serviceIds.length === 0) return [];
      const { data } = await supabase
        .from('service_completions')
        .select('*')
        .in('service_id', serviceIds)
        .eq('month', currentMonth);
      return data || [];
    },
    enabled: services.length > 0 && open,
  });

  // Group by client
  const clientMap = new Map<string, { name: string; services: any[] }>();
  services.forEach((s: any) => {
    const clientName = s.clients?.name || 'Sem cliente';
    const clientId = s.client_id;
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: clientName, services: [] });
    }
    clientMap.get(clientId)!.services.push(s);
  });

  const completedServiceIds = new Set(completions.map((c: any) => c.service_id));

  // Helper: find next date for a task type for a client
  function getNextDate(clientName: string, type: 'gravacao' | 'entrega'): Date | null {
    const now = new Date();
    const matching = tasks.filter((t: any) => {
      if (t.client_name?.toLowerCase() !== clientName.toLowerCase()) return false;
      const title = (t.title || '').toLowerCase();
      if (t.status === 'done') return false;
      if (type === 'gravacao') {
        return t.capture_date && (isFuture(new Date(t.capture_date)) || isToday(new Date(t.capture_date)));
      } else {
        return t.due_date && (isFuture(new Date(t.due_date)) || isToday(new Date(t.due_date)));
      }
    });

    if (matching.length === 0) return null;

    const dates = matching.map((t: any) =>
      type === 'gravacao' ? new Date(t.capture_date) : new Date(t.due_date)
    ).sort(compareAsc);

    return dates[0];
  }

  // Get task stats per client
  function getClientTaskStats(clientName: string) {
    const clientTasks = tasks.filter((t: any) => t.client_name?.toLowerCase() === clientName.toLowerCase());
    const total = clientTasks.length;
    const done = clientTasks.filter((t: any) => t.status === 'done').length;
    return { total, done, pending: total - done };
  }

  // Get service-level task stats
  function getServiceTaskStats(serviceId: string, serviceName: string, clientName: string) {
    const matching = tasks.filter((t: any) => {
      const title = (t.title || '').toLowerCase();
      return title.includes(serviceName.toLowerCase()) && t.client_name?.toLowerCase() === clientName.toLowerCase();
    });
    const total = matching.length;
    const done = matching.filter((t: any) => t.status === 'done').length;
    return { total, done };
  }

  const clients = Array.from(clientMap.entries()).map(([clientId, { name, services: svc }]) => {
    const stats = getClientTaskStats(name);
    const nextGravacao = getNextDate(name, 'gravacao');
    const nextEntrega = getNextDate(name, 'entrega');

    const serviceDetails = svc.map((s: any) => {
      const qty = s.quantity_per_month;
      const taskStats = getServiceTaskStats(s.id, s.service_name, name);
      const effectiveTotal = qty || taskStats.total;
      const effectiveDone = taskStats.done;
      const isDone = s.is_recurring ? completedServiceIds.has(s.id) : s.completed;
      const progress = effectiveTotal > 0 ? Math.round((effectiveDone / effectiveTotal) * 100) : 0;

      return { ...s, effectiveTotal, effectiveDone, isDone, progress };
    });

    const overallTotal = serviceDetails.reduce((sum, s) => sum + (s.effectiveTotal || 0), 0);
    const overallDone = serviceDetails.reduce((sum, s) => sum + (s.effectiveDone || 0), 0);
    const overallProgress = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;

    return { clientId, name, stats, nextGravacao, nextEntrega, serviceDetails, overallProgress, overallTotal, overallDone };
  });

  // Sort by progress ascending (most work remaining first)
  clients.sort((a, b) => a.overallProgress - b.overallProgress);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0a0a0a] border-white/10 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <SheetTitle className="text-white font-serif text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-orange" />
            Visão Geral dos Clientes
          </SheetTitle>
          <p className="text-white/30 text-xs font-mono">
            {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-4 space-y-3">
            {clients.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">Nenhum cliente atribuído</p>
            )}

            {clients.map((client) => (
              <div
                key={client.clientId}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                {/* Client header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">{client.name}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      client.overallProgress === 100
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : client.overallProgress >= 50
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {client.overallProgress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        client.overallProgress === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-brand-orange to-brand-orange/60'
                      }`}
                      style={{ width: `${client.overallProgress}%` }}
                    />
                  </div>

                  {/* Next dates */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Camera className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-mono text-blue-400/70 uppercase">Próx. Gravação</span>
                      </div>
                      <p className="text-xs text-white/70 font-medium">
                        {client.nextGravacao
                          ? isToday(client.nextGravacao)
                            ? 'Hoje'
                            : format(client.nextGravacao, "dd MMM", { locale: ptBR })
                          : <span className="text-white/20">—</span>
                        }
                      </p>
                    </div>
                    <div className="flex-1 rounded-xl border border-orange-500/15 bg-orange-500/[0.04] p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Send className="w-3 h-3 text-orange-400" />
                        <span className="text-[10px] font-mono text-orange-400/70 uppercase">Próx. Entrega</span>
                      </div>
                      <p className="text-xs text-white/70 font-medium">
                        {client.nextEntrega
                          ? isToday(client.nextEntrega)
                            ? 'Hoje'
                            : format(client.nextEntrega, "dd MMM", { locale: ptBR })
                          : <span className="text-white/20">—</span>
                        }
                      </p>
                    </div>
                  </div>

                  {/* Services list */}
                  <div className="space-y-1.5">
                    {client.serviceDetails.map((s: any) => {
                      const Icon = getServiceIcon(s.service_name);
                      return (
                        <div key={s.id} className="flex items-center gap-2 py-1">
                          <Icon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                          <span className={`text-xs flex-1 truncate ${s.isDone ? 'text-white/30 line-through' : 'text-white/60'}`}>
                            {s.service_name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  s.isDone ? 'bg-emerald-400' : 'bg-brand-orange/70'
                                }`}
                                style={{ width: `${s.isDone ? 100 : s.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-white/30 w-8 text-right">
                              {s.effectiveDone}/{s.effectiveTotal}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer stats */}
                <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/5 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-mono text-white/30">
                      {client.stats.total} tarefas
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/60">
                    {client.stats.done} concluídas
                  </span>
                  <span className="text-[10px] font-mono text-orange-400/50 ml-auto">
                    {client.stats.pending} pendentes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}