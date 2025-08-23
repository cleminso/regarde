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
        'flex justify-end items-center gap-2 pt-4 border-t border-border',
        className,
      )}
    >
      {secondaryAction && (
        <Button variant="ghost" onClick={secondaryAction.onClick}>
          {secondaryAction.text}
        </Button>
      )}
      {primaryAction && (
        <Button variant="default" onClick={primaryAction.onClick}>
          {primaryAction.text}
        </Button>
      )}
    </div>
  );
}
