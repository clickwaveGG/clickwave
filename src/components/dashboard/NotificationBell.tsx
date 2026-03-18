import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Megaphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements-notif'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: reads = [] } = useQuery({
    queryKey: ['notification-reads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notification_reads')
        .select('announcement_id')
        .eq('user_id', user.id);
      return (data || []).map((r: any) => r.announcement_id);
    },
    enabled: !!user,
  });

  const unreadCount = announcements.filter((a: any) => !reads.includes(a.id)).length;

  const markAsRead = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) return;
      await supabase.from('notification_reads').upsert({
        user_id: user.id,
        announcement_id: announcementId,
      }, { onConflict: 'user_id,announcement_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-reads', user?.id] });
    },
  });

  const markAllRead = async () => {
    if (!user) return;
    const unread = announcements.filter((a: any) => !reads.includes(a.id));
    if (unread.length === 0) return;
    await supabase.from('notification_reads').upsert(
      unread.map((a: any) => ({
        user_id: user.id,
        announcement_id: a.id,
      })),
      { onConflict: 'user_id,announcement_id' }
    );
    queryClient.invalidateQueries({ queryKey: ['notification-reads', user?.id] });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-orange text-brand-black text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] rounded-2xl border border-white/10 bg-brand-black/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand-orange" />
              <span className="text-sm font-medium text-white">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-mono text-white/30 hover:text-brand-orange transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  Marcar tudo
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/50 transition-colors p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[350px] divide-y divide-white/5">
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-mono">Nenhuma notificação</p>
              </div>
            ) : (
              announcements.map((a: any) => {
                const isRead = reads.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isRead ? 'opacity-50' : 'bg-brand-orange/[0.03]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isRead ? 'bg-white/10' : 'bg-brand-orange'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono text-white/20">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {a.pinned && (
                          <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400/60 border border-yellow-500/20">
                            FIXO
                          </span>
                        )}
                      </div>
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => markAsRead.mutate(a.id)}
                        className="text-white/15 hover:text-emerald-400 transition-colors shrink-0 mt-0.5 p-1 rounded-lg hover:bg-white/5"
                        title="Marcar como lida"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
