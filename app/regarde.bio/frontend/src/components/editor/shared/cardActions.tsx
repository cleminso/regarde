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
    <div className="-mx-1 flex flex-row">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(item)}
        className={cn(
          'hover:text-foreground pl-1 underline-offset-4 hover:bg-transparent hover:underline',
        )}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(item)}
        className={cn(
          'hover:text-destructive underline-offset-4 hover:bg-transparent hover:underline',
        )}
      >
        Delete
      </Button>
    </div>
  );
}
