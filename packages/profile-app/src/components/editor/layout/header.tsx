import { cn } from '#/lib/utils.ts';
import { Button } from '../../ui/button.tsx';

type SectionHeaderProps = {
  title: string;
  description?: string | React.ReactNode;
  onActionClick?: () => void;
  actionText?: string;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  onActionClick,
  actionText,
  className,
}: SectionHeaderProps) {
  const hasAction = onActionClick && actionText;

  return (
    <div
      className={cn(
        'mb-6 border-b border-border pb-2',
        hasAction && 'flex justify-between items-start',
        className,
      )}
    >
      <div className="flex-grow">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-secondary-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {hasAction && (
        <div className="ml-4 flex-shrink-0">
          <Button variant="view" size="sm" onClick={onActionClick}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
