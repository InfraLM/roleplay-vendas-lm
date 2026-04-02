import { OnboardingStep as StepType } from "./onboardingSteps";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SECONDS_PER_STEP = 30;

interface OnboardingStepProps {
  step: StepType;
  currentStep: number;
  totalSteps: number;
  direction: 'next' | 'prev';
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingStepContent({
  step,
  currentStep,
  totalSteps,
  direction,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingStepProps) {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const Icon = step.icon;
  
  // Calculate estimated time remaining
  const stepsRemaining = totalSteps - currentStep;
  const minutesRemaining = Math.ceil((stepsRemaining * SECONDS_PER_STEP) / 60);
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div 
      key={step.id}
      className={cn(
        "bg-card border border-border rounded-xl shadow-2xl overflow-hidden",
        direction === 'next' 
          ? "animate-slide-in-from-right" 
          : "animate-slide-in-from-left"
      )}
    >
      {/* Progress Bar at Top */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 relative">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Pular tutorial"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {totalSteps} • ~{minutesRemaining} min restante{minutesRemaining > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6"
      >
        <div 
          className="text-muted-foreground leading-relaxed [&>strong]:text-foreground [&>strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: step.description }}
        />
      </div>

      {/* Progress Steps with Checkmarks */}
      <div className="flex justify-center items-center gap-3 pb-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-300 font-medium",
              index === currentStep 
                ? "w-8 h-8 bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-card" 
                : index < currentStep 
                  ? "w-7 h-7 bg-primary/20 text-primary"
                  : "w-7 h-7 bg-muted text-muted-foreground"
            )}
          >
            {index < currentStep ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirstStep}
          className={cn(isFirstStep && "invisible")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Pular tutorial
        </Button>

        {isLastStep ? (
          <Button onClick={onComplete} className="bg-primary hover:bg-primary/90">
            Concluir
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onNext}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
