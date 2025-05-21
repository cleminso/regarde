import { Button } from '../ui/button';

type SectionsHeaderProps = {
  title: string;
  description?: string;
  onActionClick: () => void;
  actionText?: string;
};

export function SectionHeader({
  title,
  description,
  onActionClick,
  actionText = 'Close',
}: SectionsHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onActionClick}
          aria-label={actionText}
          title={actionText}
          className="text-foreground hover:text-foreground rounded-sm hover:bg-accent"
        >
          {actionText}
        </Button>
      </div>
    </div>
  );
}
