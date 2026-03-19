import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, Wallet, CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface Service {
  id: string;
  price: number | null;
  profit: number | null;
  member_payment: number | null;
  completed: boolean;
  created_at: string;
  responsible_id: string | null;
  responsible_name?: string;
  client_name?: string;
  service_name: string;
}

interface FinancialOverviewProps {
  services: Service[];
}

export default function AdminFinancialOverview({ services }: FinancialOverviewProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [mode, setMode] = useState<'month' | 'custom'>('month');

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rangeStart = mode === 'month' ? startOfMonth(currentMonth) : customRange?.from;
  const rangeEnd = mode === 'month' ? endOfMonth(currentMonth) : customRange?.to;

  // Filter services active during the selected period
  const filteredServices = useMemo(() => {
    if (!rangeStart || !rangeEnd) return services.filter(s => !s.completed);

    return services.filter(s => {
      const createdAt = new Date(s.created_at);
      // Service must have been created before or during the range end
      if (isBefore(rangeEnd, createdAt)) return false;

      if (s.completed) {
        // Completed (one-off) services only count in the month they were created
        const createdMonth = startOfMonth(createdAt);
        const createdMonthEnd = endOfMonth(createdAt);
        // Check if the selected range overlaps with the creation month
        const overlaps = !isBefore(rangeEnd, createdMonth) && !isBefore(createdMonthEnd, rangeStart);
        return overlaps;
      }

      return true;
    });
  }, [services, rangeStart, rangeEnd]);

  const estimatedRevenue = filteredServices.filter(s => !s.completed).reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const realRevenue = filteredServices.filter(s => s.completed).reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalProfit = filteredServices.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
  const totalPayments = filteredServices.reduce((sum, s) => sum + (Number(s.member_payment) || 0), 0);

  const memberPaymentsMap: Record<string, { name: string; total: number }> = {};
  filteredServices.forEach(s => {
    if (s.responsible_id && (Number(s.member_payment) || 0) > 0) {
      if (!memberPaymentsMap[s.responsible_id]) {
        memberPaymentsMap[s.responsible_id] = { name: s.responsible_name || '—', total: 0 };
      }
      memberPaymentsMap[s.responsible_id].total += Number(s.member_payment) || 0;
    }
  });
  const memberPayments = Object.values(memberPaymentsMap).sort((a, b) => b.total - a.total);

  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
  const isCurrentMonth = currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();

  const cards = [
    { label: 'Fat. Estimado', value: `R$ ${fmt(estimatedRevenue)}`, icon: DollarSign, accent: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Fat. Real', value: `R$ ${fmt(realRevenue)}`, icon: CheckCircle2, accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Lucro', value: `R$ ${fmt(totalProfit)}`, icon: TrendingUp, accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Pagar (Equipe)', value: `R$ ${fmt(totalPayments)}`, icon: Wallet, accent: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setMode('month')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              mode === 'month' ? 'bg-brand-orange/10 text-brand-orange border-r border-white/10' : 'text-white/30 hover:text-white/50 border-r border-white/10'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              mode === 'custom' ? 'bg-brand-orange/10 text-brand-orange' : 'text-white/30 hover:text-white/50'
            }`}
          >
            Período
          </button>
        </div>

        {mode === 'month' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-mono text-white/60 min-w-[160px] text-center capitalize">
              {monthLabel}
              {isCurrentMonth && <span className="ml-1.5 text-[9px] text-brand-orange">(atual)</span>}
            </span>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono transition-colors",
                customRange?.from
                  ? "border-brand-orange/30 text-white/70"
                  : "border-white/10 text-white/30"
              )}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {customRange?.from ? (
                  customRange.to ? (
                    `${format(customRange.from, 'dd/MM/yy')} — ${format(customRange.to, 'dd/MM/yy')}`
                  ) : (
                    format(customRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  'Selecionar período'
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-white/10" align="start">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={setCustomRange}
                numberOfMonths={2}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${c.accent}`}>
                <c.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{c.label}</span>
            </div>
            <p className="text-2xl font-serif text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Member payments */}
      {memberPayments.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-orange" />
            <span className="text-sm font-mono text-white/50 uppercase tracking-wider">Pagamento por Membro</span>
          </div>
          <div className="divide-y divide-white/5">
            {memberPayments.map((m) => (
              <div key={m.name} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-white">{m.name}</span>
                <span className="text-sm font-mono text-brand-orange">R$ {fmt(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
