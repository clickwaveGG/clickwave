import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-brand-black">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b border-white/5 px-4 bg-brand-black/50 backdrop-blur-sm sticky top-0 z-20">
            <SidebarTrigger className="text-white/40 hover:text-white/80 hover:bg-white/5" />
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
