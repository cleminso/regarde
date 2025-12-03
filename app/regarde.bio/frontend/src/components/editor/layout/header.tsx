import { cn } from '#/lib/utils/utils.ts';
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
        'mb-6 border-b border-border pb-4',
        'flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4',
        className,
      )}
    >
      <div className="flex-grow">
        <h3 className="hidden lg:block text-lg font-medium text-foreground">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-muted-foreground lg:mt-1">{description}</p>
        )}
      </div>

      {hasAction && (
        <div className="lg:ml-4 lg:flex-shrink-0">
          <Button
            variant="view"
            size="sm"
            onClick={onActionClick}
            className="w-full lg:w-auto"
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
