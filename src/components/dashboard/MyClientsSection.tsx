import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle2, Circle, ChevronDown, ChevronUp, Package, Video, Palette, Globe, Megaphone, Bot, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function getServiceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('vídeo') || n.includes('video')) return Video;
  if (n.includes('design') || n.includes('post') || n.includes('branding')) return Palette;
  if (n.includes('site') || n.includes('landing')) return Globe;
  if (n.includes('tráfego') || n.includes('trafego')) return Megaphone;
  if (n.includes('automação') || n.includes('automacao') || n.includes('chatbot')) return Bot;
  return Package;
}

export function MyClientsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const currentMonth = format(new Date(), 'yyyy-MM-01');

  const { data: services = [] } = useQuery({
    queryKey: ['my-client-services', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_services')
        .select('*, clients(name)')
        .eq('responsible_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['my-service-completions', user?.id, currentMonth],
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
    enabled: services.length > 0,
  });

  // Count tasks per client and service
  const { data: taskCounts = [] } = useQuery({
    queryKey: ['my-tasks-counts', user?.id, currentMonth],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, client_name, status, title, due_date')
        .eq('assigned_to', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

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

  const isServiceDone = (s: any) => {
    if (s.is_recurring) return completedServiceIds.has(s.id);
    return s.completed;
  };

  // Count done tasks per client name + per service
  const doneTasksByClient = new Map<string, number>();
  const totalTasksByClient = new Map<string, number>();
  const tasksByServiceId = new Map<string, { total: number; done: number }>();
  taskCounts.forEach((t: any) => {
    if (!t.client_name) return;
    totalTasksByClient.set(t.client_name, (totalTasksByClient.get(t.client_name) || 0) + 1);
    if (t.status === 'done') {
      doneTasksByClient.set(t.client_name, (doneTasksByClient.get(t.client_name) || 0) + 1);
    }
    // Match tasks to services by title containing service name + matching client
    const title = (t.title || '').toLowerCase();
    services.forEach((s: any) => {
      const sName = s.service_name.toLowerCase();
      const cName = (s.clients?.name || '').toLowerCase();
      if (title.includes(sName) && t.client_name?.toLowerCase() === cName) {
        if (!tasksByServiceId.has(s.id)) tasksByServiceId.set(s.id, { total: 0, done: 0 });
        const entry = tasksByServiceId.get(s.id)!;
        entry.total++;
        if (t.status === 'done') entry.done++;
      }
    });
  });

  if (clientMap.size === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-brand-orange" />
        <h2 className="text-lg font-serif text-white">Meus Clientes</h2>
        <span className="text-[10px] font-mono text-white/30 ml-1">
          {format(new Date(), 'MMMM', { locale: ptBR })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from(clientMap.entries()).map(([clientId, { name, services: clientServices }]) => {
          const total = clientServices.length;
          const done = clientServices.filter(isServiceDone).length;
          const pending = total - done;
          const progress = total > 0 ? Math.round((done / total) * 100) : 0;
          const isExpanded = expandedClient === clientId;

          // Task counts for this client
          const clientDoneTasks = doneTasksByClient.get(name) || 0;
          const clientTotalTasks = totalTasksByClient.get(name) || 0;

          return (
            <div
              key={clientId}
              className={`rounded-2xl border transition-all ${
                isExpanded
                  ? 'border-brand-orange/20 bg-white/[0.03] col-span-1 sm:col-span-2 lg:col-span-3'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] cursor-pointer'
              }`}
            >
              {/* Card header */}
              <div
                onClick={() => setExpandedClient(isExpanded ? null : clientId)}
                className="p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white truncate">{name}</h3>
                  {isExpanded
                    ? <ChevronUp className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-white/15 shrink-0" />
                  }
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/30">{progress}%</span>
                </div>

                {!isExpanded && (
                  <>
                    <div className="space-y-1.5">
                      {clientServices.map((s: any) => {
                        const isDone = isServiceDone(s);
                        const Icon = getServiceIcon(s.service_name);
                        const qty = s.quantity_per_month;
                        const serviceTasks = tasksByServiceId.get(s.id);
                        const effectiveQty = qty || (serviceTasks?.total || 0);
                        const effectiveDone = serviceTasks?.done || 0;
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            {isDone
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              : <Circle className="w-3.5 h-3.5 text-white/20 shrink-0" />
                            }
                            <Icon className="w-3 h-3 text-white/15 shrink-0" />
                            <span className={`text-xs truncate ${isDone ? 'text-white/30 line-through' : 'text-white/60'}`}>
                              {s.service_name}
                            </span>
                            {effectiveQty > 0 && !isDone && (
                              <span className="text-[9px] font-mono text-orange-400/60 ml-auto shrink-0">
                                {effectiveDone}/{effectiveQty}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-emerald-400/70">{done} feitos</span>
                      <span className="text-[10px] font-mono text-white/20">•</span>
                      <span className="text-[10px] font-mono text-white/30">{pending} pendentes</span>
                    </div>
                  </>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                      <p className="text-xl font-serif text-white">{total}</p>
                      <p className="text-[10px] font-mono text-white/30 uppercase">Serviços</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3 text-center">
                      <p className="text-xl font-serif text-emerald-400">{done}</p>
                      <p className="text-[10px] font-mono text-emerald-400/50 uppercase">Entregues</p>
                    </div>
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-3 text-center">
                      <p className="text-xl font-serif text-orange-400">{pending}</p>
                      <p className="text-[10px] font-mono text-orange-400/50 uppercase">Pendentes</p>
                    </div>
                  </div>

                  {/* Services detail */}
                  <div className="space-y-2">
                    {clientServices.map((s: any) => {
                      const isDone = isServiceDone(s);
                      const Icon = getServiceIcon(s.service_name);
                      const qty = s.quantity_per_month;
                      const serviceTasks = tasksByServiceId.get(s.id);
                      const effectiveQty = qty || (serviceTasks?.total || 0);
                      const effectiveDone = serviceTasks?.done || 0;

                      return (
                        <div key={s.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-brand-orange/70 shrink-0" />
                            <span className={`text-sm font-medium flex-1 ${isDone ? 'text-white/30 line-through' : 'text-white/80'}`}>
                              {s.service_name}
                            </span>
                            {isDone ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Concluído
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                Pendente
                              </span>
                            )}
                          </div>

                          {/* Quantity breakdown — uses task count as goal when qty_per_month is not set */}
                          {effectiveQty > 0 && (
                            <div className="mt-2 pl-6">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/60 transition-all duration-500"
                                    style={{ width: `${isDone ? 100 : effectiveQty > 0 ? Math.round((effectiveDone / effectiveQty) * 100) : 0}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-white/30">
                                  {isDone ? effectiveQty : effectiveDone}/{effectiveQty}
                                </span>
                              </div>
                              {!isDone && !qty && (
                                <p className="text-[10px] text-white/25 italic">
                                  Meta definida pelas entregas agendadas
                                </p>
                              )}
                              {!isDone && qty && (
                                <p className="text-[10px] text-white/25">
                                  {effectiveQty - effectiveDone > 0
                                    ? `Faltam ${effectiveQty - effectiveDone} para completar`
                                    : 'Todas as entregas feitas — marcar como concluído'
                                  }
                                </p>
                              )}
                            </div>
                          )}

                          {effectiveQty === 0 && !isDone && (
                            <p className="text-[10px] text-white/20 mt-1 pl-6">Nenhuma entrega agendada ainda</p>
                          )}

                          {s.notes && (
                            <p className="text-[10px] text-white/20 mt-1 pl-6 italic">{s.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tasks summary */}
                  {clientTotalTasks > 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50">Tarefas no Kanban</span>
                        <span className="text-[10px] font-mono text-white/30">{clientDoneTasks}/{clientTotalTasks} concluídas</span>
                      </div>
                    </div>
                  )}

                  {/* Organize button */}
                  {pending > 0 && (
                    <button
                      onClick={() => navigate('/dashboard/calendar')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-xs font-mono hover:bg-brand-orange/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Organizar entregas
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
