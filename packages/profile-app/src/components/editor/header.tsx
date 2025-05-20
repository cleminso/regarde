import { Button } from '../ui/button';

type SectionsHeaderProps = {
  title: string;
  description?: string;
  onCloseEditor: () => void;
};

export function SectionHeader({
  title,
  description,
  onCloseEditor,
}: SectionsHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0">
        <Button
          variant="ghost"
          onClick={onCloseEditor}
          aria-label="Close editor and go to profile"
          title="Close editor"
          className="text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
