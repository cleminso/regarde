import { cn } from "#/lib/utils/utils.ts";

import { Button } from "../../ui/button.tsx";

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
        "border-border mb-6 border-b pb-4",
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="grow">
        <h3 className="text-foreground hidden text-lg font-medium lg:block">{title}</h3>

        {description && <p className="text-muted-foreground text-sm lg:mt-1">{description}</p>}
      </div>

      {hasAction && (
        <div className="lg:ml-4 lg:shrink-0">
          <Button variant="view" size="sm" onClick={onActionClick} className="w-full lg:w-auto">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
