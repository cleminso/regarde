import { cn } from "#/lib/utils/utils.ts";

import { Button } from "../../ui/button.tsx";

type EditorFooterProps = {
  primaryAction?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
};

export function EditorFooter({ primaryAction, secondaryAction, className }: EditorFooterProps) {
  if (!primaryAction && !secondaryAction) {
    return null;
  }

  return (
    <div
      className={cn(
        "lg:border-border p-4 lg:flex lg:items-center lg:justify-end lg:gap-2 lg:border-t lg:p-0 lg:pt-4",
        "fixed right-0 bottom-16 left-0 z-30 lg:static lg:z-auto",
        "bg-card border-border flex items-center justify-between gap-2 border-t",
        "shrink-0",
        className,
      )}
    >
      {secondaryAction && (
        <Button
          variant="ghost"
          onClick={secondaryAction.onClick}
          className={cn("lg:w-auto", primaryAction ? "lg:w-[30%]" : "lg:w-full")}
        >
          {secondaryAction.text}
        </Button>
      )}

      {primaryAction && (
        <Button
          variant="default"
          onClick={primaryAction.onClick}
          className={cn("lg:w-auto", secondaryAction ? "lg:w-[70%]" : "lg:w-full")}
        >
          {primaryAction.text}
        </Button>
      )}
    </div>
  );
}
