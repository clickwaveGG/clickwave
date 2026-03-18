import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { NotificationBell } from './NotificationBell';
import { UserAvatar } from './UserAvatar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-brand-black">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between border-b border-white/5 px-4 bg-brand-black/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white/40 hover:text-white/80 hover:bg-white/5" />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="w-px h-5 bg-white/5" />
              <UserAvatar />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
