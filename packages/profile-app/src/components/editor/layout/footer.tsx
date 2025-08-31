import { cn } from '#/lib/utils/utils.ts';
import { Button } from '../../ui/button.tsx';

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

export function EditorFooter({
  primaryAction,
  secondaryAction,
  className,
}: EditorFooterProps) {
  if (!primaryAction && !secondaryAction) {
    return null;
  }

  return (
    <div
      className={cn(
        'lg:flex lg:justify-end lg:items-center lg:gap-2 lg:pt-4 lg:border-t lg:border-border',
        'fixed lg:static bottom-16 left-0 right-0 z-30 lg:z-auto',
        'flex lg:hidden justify-between items-center gap-2 p-4 bg-card border-t border-border',
        className,
      )}
    >
      {secondaryAction && (
        <Button
          variant="ghost"
          onClick={secondaryAction.onClick}
          className="lg:w-auto"
        >
          {secondaryAction.text}
        </Button>
      )}

      {primaryAction && (
        <Button
          variant="default"
          onClick={primaryAction.onClick}
          className="lg:w-auto"
        >
          {primaryAction.text}
        </Button>
      )}
    </div>
  );
}
