import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingHighlight } from "./OnboardingHighlight";
import { OnboardingStepContent } from "./OnboardingStep";
import { OnboardingCelebration } from "./OnboardingCelebration";

export function OnboardingModal() {
  const {
    isOnboardingActive,
    showCelebration,
    currentStep,
    totalSteps,
    direction,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    closeCelebration,
    currentStepData,
  } = useOnboarding();

  // Show celebration modal after completing onboarding
  if (showCelebration) {
    return <OnboardingCelebration onClose={closeCelebration} />;
  }

  if (!isOnboardingActive || !currentStepData) {
    return null;
  }

  return (
    <OnboardingHighlight
      targetSelector={currentStepData.targetElement}
      isActive={isOnboardingActive}
      position={currentStepData.position}
    >
      <OnboardingStepContent
        step={currentStepData}
        currentStep={currentStep}
        totalSteps={totalSteps}
        direction={direction}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipOnboarding}
        onComplete={completeOnboarding}
      />
    </OnboardingHighlight>
  );
}
