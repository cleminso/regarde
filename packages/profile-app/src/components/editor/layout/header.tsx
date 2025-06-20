import { Button } from '../../ui/button';

type SectionHeaderProps = {
  title: string;
  description?: string;
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
      className={`${hasAction ? 'flex justify-between items-start' : ''} mb-6 border-b border-border pb-4 ${className}`}
    >
      <div className="flex-grow">
        <h3 className="text-lg font-sans text-foreground">{title}</h3>
        {description && (
          <p className="text-sm font-sans text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {hasAction && (
        <div className="ml-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onActionClick}
            className="text-sm font-sans text-foreground hover:text-foreground rounded-sm hover:bg-accent border-none cursor-pointer"
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
