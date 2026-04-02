import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./useAuth";
import { getStepsForRole, OnboardingStep } from "@/components/onboarding/onboardingSteps";

interface OnboardingContextType {
  isOnboardingActive: boolean;
  showCelebration: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  totalSteps: number;
  direction: 'next' | 'prev';
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  closeCelebration: () => void;
  goToStep: (step: number) => void;
  currentStepData: OnboardingStep | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, profile, role } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  const steps = getStepsForRole(role);
  const totalSteps = steps.length;

  // Process step to replace {{first_name}} placeholder with actual name
  const processStep = (step: OnboardingStep): OnboardingStep => {
    const firstName = profile?.name?.split(' ')[0] || 'Usuário';
    return {
      ...step,
      title: step.title.replace('{{first_name}}', firstName),
      description: step.description.replace('{{first_name}}', firstName),
    };
  };

  const currentStepData = steps[currentStep] ? processStep(steps[currentStep]) : null;

  // Check if user needs onboarding on first load
  useEffect(() => {
    if (profile && !hasCheckedOnboarding) {
      setHasCheckedOnboarding(true);

      // Check onboarding status from profile (already available from auth)
      if (profile.onboarding_completed === false) {
        // Small delay to let the page render first
        setTimeout(() => {
          setIsOnboardingActive(true);
        }, 500);
      }
    }
  }, [profile, user, hasCheckedOnboarding]);

  // Listen for manual trigger from sidebar button
  useEffect(() => {
    const handleStartOnboarding = () => {
      setCurrentStep(0);
      setIsOnboardingActive(true);
    };

    window.addEventListener('start-onboarding', handleStartOnboarding);
    return () => {
      window.removeEventListener('start-onboarding', handleStartOnboarding);
    };
  }, []);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setDirection('next');
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    setDirection('prev');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setDirection(step > currentStep ? 'next' : 'prev');
      setCurrentStep(step);
    }
  }, [totalSteps, currentStep]);

  const skipOnboarding = useCallback(async () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);

    // Persist skip so tutorial doesn't reappear
    if (user?.id) {
      try {
        await api.put('/users/onboarding', { onboarding_completed: true });
      } catch (error) {
        console.error('Error skipping onboarding:', error);
      }
    }
  }, [user?.id]);

  const completeOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      await api.put('/users/onboarding', { onboarding_completed: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }

    setIsOnboardingActive(false);
    setCurrentStep(0);
    // Show celebration after completing
    setShowCelebration(true);
  }, [user?.id]);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        showCelebration,
        currentStep,
        steps,
        totalSteps,
        direction,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        closeCelebration,
        goToStep,
        currentStepData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
