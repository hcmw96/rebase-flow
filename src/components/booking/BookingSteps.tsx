import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface BookingStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

const BookingSteps = ({ steps, currentStep, className }: BookingStepsProps) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-secondary text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "w-12 sm:w-24 h-0.5 mx-2",
                  isCompleted ? "bg-primary" : "bg-secondary"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookingSteps;
