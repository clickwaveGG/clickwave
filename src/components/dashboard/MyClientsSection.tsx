import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function MyClientsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Group services by client
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

  if (clientMap.size === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-brand-orange" />
        <h2 className="text-lg font-serif text-white">Meus Clientes</h2>
        <span className="text-[10px] font-mono text-white/30 ml-1">
          {format(new Date(), 'MMMM')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from(clientMap.entries()).map(([clientId, { name, services: clientServices }]) => {
          const total = clientServices.length;
          const done = clientServices.filter((s: any) => {
            if (s.is_recurring) return completedServiceIds.has(s.id);
            return s.completed;
          }).length;
          const pending = total - done;
          const progress = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div
              key={clientId}
              onClick={() => navigate('/dashboard/clients')}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white truncate">{name}</h3>
                <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/30">{progress}%</span>
              </div>

              {/* Services list */}
              <div className="space-y-1.5">
                {clientServices.map((s: any) => {
                  const isDone = s.is_recurring ? completedServiceIds.has(s.id) : s.completed;
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      {isDone
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      }
                      <span className={`text-xs truncate ${isDone ? 'text-white/30 line-through' : 'text-white/60'}`}>
                        {s.service_name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-emerald-400/70">{done} feitos</span>
                <span className="text-[10px] font-mono text-white/20">•</span>
                <span className="text-[10px] font-mono text-white/30">{pending} pendentes</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
