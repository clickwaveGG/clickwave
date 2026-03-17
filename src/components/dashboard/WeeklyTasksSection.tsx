import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const WEEKLY_TASKS = [
  { id: 1, label: 'Verificar desempenho das campanhas ativas (CPA, CTR, ROAS)' },
  { id: 2, label: 'Analisar criativos — pausar os de baixa performance' },
  { id: 3, label: 'Revisar orçamentos e redistribuir budget entre conjuntos' },
  { id: 4, label: 'Checar públicos e audiências — ajustar segmentação se necessário' },
  { id: 5, label: 'Responder leads e verificar qualidade dos formulários' },
  { id: 6, label: 'Atualizar relatório de métricas do cliente' },
  { id: 7, label: 'Testar novos criativos / copies para A/B testing' },
];

function getDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // Monday=0 ... Sunday=6
}

function getStorageKey(dayIdx: number) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - getDayIndex());
  const weekKey = startOfWeek.toISOString().slice(0, 10);
  return `weekly-tasks-${weekKey}-${dayIdx}`;
}

function loadChecked(dayIdx: number): Set<number> {
  try {
    const raw = localStorage.getItem(getStorageKey(dayIdx));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveChecked(dayIdx: number, checked: Set<number>) {
  localStorage.setItem(getStorageKey(dayIdx), JSON.stringify([...checked]));
}

export function WeeklyTasksSection() {
  const today = getDayIndex();
  const [selectedDay, setSelectedDay] = useState(today);
  const [checked, setChecked] = useState<Set<number>>(() => loadChecked(today));
  const [expanded, setExpanded] = useState(true);

  const handleDayChange = (idx: number) => {
    setSelectedDay(idx);
    setChecked(loadChecked(idx));
  };

  const toggle = (taskId: number) => {
    const next = new Set(checked);
    if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
    setChecked(next);
    saveChecked(selectedDay, next);
  };

  const doneCount = checked.size;
  const totalCount = WEEKLY_TASKS.length;
  const progress = Math.round((doneCount / totalCount) * 100);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-4 group"
      >
        <CalendarCheck className="w-4 h-4 text-brand-orange" />
        <h2 className="text-lg font-serif text-white">Tarefas Semanais</h2>
        <span className="text-[10px] font-mono text-white/30 ml-1">
          {doneCount}/{totalCount}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
          : <ChevronDown className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
        }
      </button>

      {expanded && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          {/* Day selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => handleDayChange(idx)}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                  idx === selectedDay
                    ? 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange'
                    : idx === today
                    ? 'border-white/15 text-white/50 bg-white/[0.03]'
                    : 'border-white/5 text-white/25 hover:border-white/15 hover:text-white/40'
                }`}
              >
                {day}
                {idx === today && idx !== selectedDay && (
                  <span className="ml-1 text-brand-orange/60">•</span>
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/60 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/30">{progress}%</span>
          </div>

          {/* Task list */}
          <div className="space-y-1">
            {WEEKLY_TASKS.map(task => {
              const isDone = checked.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggle(task.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/[0.03] group ${
                    isDone ? 'opacity-50' : ''
                  }`}
                >
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                    : <Circle className="w-4 h-4 mt-0.5 text-white/20 group-hover:text-white/40 shrink-0" />
                  }
                  <span className={`text-sm ${isDone ? 'text-white/30 line-through' : 'text-white/70'}`}>
                    {task.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
