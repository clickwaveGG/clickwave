import { LayoutDashboard, Users, UsersRound, Shield, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import clickwaveLogo from '@/assets/clickwave-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Meu Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Espaço da Equipe', url: '/dashboard/team', icon: UsersRound },
  { title: 'Meus Colegas', url: '/dashboard/colleagues', icon: Users },
];

const adminItems = [
  { title: 'Painel Admin', url: '/dashboard/admin', icon: Shield },
];

export function DashboardSidebar() {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const allItems = role === 'admin' ? [...menuItems, ...adminItems] : menuItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-brand-black">
      <SidebarHeader className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={clickwaveLogo} alt="Clickwave" className="h-8 w-auto" />
          {!collapsed && (
            <span className="font-serif italic text-white text-sm tracking-wide">Clickwave</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-xs font-mono font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{profile?.full_name || 'Colaborador'}</p>
              <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider">
                {role === 'admin' ? 'Admin' : 'Membro'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="text-white/20 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
