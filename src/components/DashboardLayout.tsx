import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import LiberdadeMedicaLogo from "./LiberdadeMedicaLogo";
import ThemeToggle from "./ThemeToggle";
import { OnboardingProvider } from "@/hooks/useOnboarding";
import { OnboardingModal } from "./onboarding/OnboardingModal";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <OnboardingProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 flex flex-col">
            {/* Mobile header with trigger */}
            <header className="flex items-center justify-between h-14 px-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center">
                <SidebarTrigger className="mr-4 md:hidden" />
                <LiberdadeMedicaLogo size="sm" className="md:hidden" />
              </div>
              <ThemeToggle />
            </header>
            
            {/* Main content */}
            <div className="flex-1 p-6 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <OnboardingModal />
    </OnboardingProvider>
  );
}
