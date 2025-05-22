import { Button } from '../ui/button';

type SectionsHeaderProps = {
  title: string;
  description?: string;
  onActionClick: () => void;
  actionText?: string;
  onCancelClick?: () => void;
  cancelText?: string;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  onActionClick,
  actionText = 'Close',
  onCancelClick,
  cancelText = 'Cancel',
  className,
}: SectionsHeaderProps) {
  return (
    <div
      className={`flex justify-between items-start mb-6 border-b border-border pb-4 ${className}`}
    >
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
        <Button
          variant="outline"
          onClick={onActionClick}
          aria-label={actionText}
          title={actionText}
          className="text-foreground hover:text-foreground rounded-sm hover:bg-accent border-none cursor-pointer"
        >
          {actionText}
        </Button>
        {onCancelClick && (
          <Button
            variant="ghost"
            onClick={onCancelClick}
            aria-label={cancelText}
            title={cancelText}
            className="text-foreground hover:text-foreground rounded-sm hover:bg-transparent hover:underline cursor-pointer"
          >
            {cancelText}
          </Button>
        )}
      </div>
    </div>
  );
}
