import { CheckCircle2 } from 'lucide-react';

interface Step {
  label: string;
}

interface ImportStepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function ImportStepIndicator({ steps, currentStep }: ImportStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <div className={`h-px w-6 ${isDone || isActive ? 'bg-primary' : 'bg-border'}`} />}
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isDone ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary/20 text-primary border border-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-xs ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
