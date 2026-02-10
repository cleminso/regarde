interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div
            key={stepNumber}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              isActive ? "w-6 bg-primary" : isCompleted ? "bg-primary/60" : "bg-muted"
            }`}
            aria-label={`Step ${stepNumber} ${isActive ? "(current)" : ""}`}
          />
        );
      })}
    </div>
  );
}
