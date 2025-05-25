import { Button } from '#/components/ui';

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
    <div className="flex flex-row">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(item)}
        className="text-xs font-sans hover:bg-transparent hover:underline underline-offset-4 cursor-pointer "
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(item)}
        className="text-xs font-sans hover:bg-transparent hover:underline underline-offset-4 cursor-pointer"
      >
        Delete
      </Button>
    </div>
  );
}
