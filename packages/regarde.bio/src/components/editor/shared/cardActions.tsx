import { cn } from '#/lib/utils/utils.ts';
import { Button } from '../../ui/button.tsx';

type EditorCardActionsProps<T> = {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
};

export function EditorCardActions<T>({
  item,
  onEdit,
  onDelete,
}: EditorCardActionsProps<T>) {
  return (
    <div className="flex flex-row -mx-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(item)}
        className={cn(
          'hover:text-foreground hover:bg-transparent hover:underline underline-offset-4 pl-1',
        )}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(item)}
        className={cn(
          'hover:text-destructive hover:bg-transparent hover:underline underline-offset-4',
        )}
      >
        Delete
      </Button>
    </div>
  );
}
