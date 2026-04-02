import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Play, 
  Users, 
  Layers, 
  UserCircle, 
  FileText, 
  LogOut,
  ChevronDown,
  BarChart3,
  Ticket,
  Gift,
  HelpCircle,
  Swords
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNinjaRank } from "@/hooks/useNinjaRank";
import { NinjaRankBadge } from "./ninja/NinjaRankBadge";
import LiberdadeMedicaLogo from "./LiberdadeMedicaLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Novo Roleplay", url: "/roleplay", icon: Play },
  { title: "Meu Ninja", url: "/ninja", icon: Swords },
  { title: "Meus Vouchers", url: "/vouchers", icon: Ticket },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const adminMenuItems = [
  { title: "Gerenciar Equipe", url: "/admin/equipe", icon: Users },
  { title: "Gerenciar Produtos", url: "/admin/cenarios", icon: Layers },
  { title: "Gerenciar Perfis", url: "/admin/cenarios", icon: UserCircle },
  { title: "Gerenciar Prompts", url: "/admin/configuracoes", icon: FileText },
  { title: "Gerenciar Prêmios", url: "/admin/premios", icon: Gift },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role, signOut } = useAuth();
  const { currentRank, progress } = useNinjaRank();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = role === "admin" || role === "coach";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const userName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <Sidebar className="border-r border-border/50 bg-background">
      <SidebarContent className="px-3 py-4">
        {/* Logo */}
        <div className="mb-6 px-2">
          <LiberdadeMedicaLogo size="md" />
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const onboardingKey = item.title === "Novo Roleplay" 
                  ? "menu-novo-roleplay" 
                  : item.title === "Meus Vouchers"
                    ? "menu-vouchers"
                    : item.title === "Analytics"
                      ? "menu-analytics"
                      : undefined;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      data-onboarding={onboardingKey}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                        isActive(item.url)
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administração - só para admin/coach */}
        {isAdmin && (
          <SidebarGroup className="mt-4">
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between cursor-pointer hover:text-foreground transition-colors">
                  Administração
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMenuItems.map((item) => {
                      const onboardingKey = item.title === "Gerenciar Equipe"
                        ? "menu-equipe"
                        : item.title === "Gerenciar Produtos" || item.title === "Gerenciar Perfis"
                          ? "menu-cenarios"
                          : item.title === "Gerenciar Prompts"
                            ? "menu-prompts"
                            : item.title === "Gerenciar Prêmios"
                              ? "menu-premios"
                              : undefined;
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            onClick={() => navigate(item.url)}
                            data-onboarding={onboardingKey}
                            className={cn(
                              "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                              isActive(item.url)
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer com usuário */}
      <SidebarFooter className="border-t border-border/50 p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
          onClick={() => navigate("/ninja")}
        >
          {currentRank ? (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${currentRank.color}20`, borderColor: currentRank.color }}
            >
              {currentRank.emoji}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
              {userInitial}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              {currentRank && (
                <NinjaRankBadge
                  level={currentRank.level}
                  name={currentRank.name}
                  emoji={currentRank.emoji}
                  color={currentRank.color}
                  variant="compact"
                  className="mt-0.5"
                />
              )}
            </div>
          )}
        </div>
        <SidebarMenuButton
          onClick={() => {
            // Dispatch custom event to trigger onboarding
            window.dispatchEvent(new CustomEvent('start-onboarding'));
          }}
          className="w-full justify-start gap-3 px-3 py-2.5 mt-3 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
        >
          <HelpCircle className="h-4 w-4" />
          {!isCollapsed && <span>Ver Tutorial</span>}
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-3 py-2.5 mt-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sair</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
