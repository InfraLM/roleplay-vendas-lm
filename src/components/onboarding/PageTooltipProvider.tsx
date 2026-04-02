import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useContextualTooltips, ContextualTooltip as TooltipType } from "@/hooks/useContextualTooltips";
import { ContextualTooltip } from "./ContextualTooltip";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface PageTooltipProviderProps {
  children: ReactNode;
}

export function PageTooltipProvider({ children }: PageTooltipProviderProps) {
  const location = useLocation();
  const { getTooltipForPage, markPageAsVisited, getProgress, isLoading } = useContextualTooltips();
  const { user } = useAuth();
  const [currentTooltip, setCurrentTooltip] = useState<TooltipType | null>(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  // Check if onboarding is active by querying the profile
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setIsOnboardingActive(false);
        return;
      }
      
      const data = await api.get<{ onboardingCompleted: boolean }>('/users/profile');

      // If onboarding is NOT completed, it might be active
      setIsOnboardingActive(data?.onboardingCompleted === false);
    };
    
    checkOnboardingStatus();
  }, [user?.id]);

  useEffect(() => {
    // Don't show tooltips during onboarding or while loading
    if (isOnboardingActive || isLoading) {
      setCurrentTooltip(null);
      return;
    }

    // Check for tooltip on current page
    const tooltip = getTooltipForPage(location.pathname);
    setCurrentTooltip(tooltip);
  }, [location.pathname, getTooltipForPage, isOnboardingActive, isLoading]);

  const handleDismiss = (pageId: string) => {
    markPageAsVisited(pageId);
    setCurrentTooltip(null);
  };

  return (
    <>
      {children}
      {currentTooltip && (
        <ContextualTooltip 
          tooltip={currentTooltip} 
          onDismiss={handleDismiss}
          progress={getProgress()}
        />
      )}
    </>
  );
}
