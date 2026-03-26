import { twMerge } from "tailwind-merge";
import React from "react";

/**
 * ListGroup - A container for list items with consistent styling.
 *
 * Provides a bordered container with item dividers.
 * Used for webhook lists and similar data tables.
 *
 * @example
 * ```tsx
 * <ListGroup>
 *   <ListGroup.Item>Item 1</ListGroup.Item>
 *   <ListGroup.Item>Item 2</ListGroup.Item>
 * </ListGroup>
 * ```
 */

interface ListGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface ListGroupItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ListGroupRoot = ({
  ref,
  className,
  children,
  ...props
}: ListGroupProps & {
  ref?: React.RefObject<HTMLDivElement>;
}): React.ReactElement => {
  return (
    <div
      ref={ref}
      data-slot="list-group"
      className={twMerge(
        "w-full overflow-hidden bg-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
ListGroupRoot.displayName = "ListGroup";

const ListGroupItem = ({
  ref,
  className,
  children,
  onClick,
  ...props
}: ListGroupItemProps & {
  ref?: React.RefObject<HTMLDivElement>;
}): React.ReactElement => {
  return (
    <div
      ref={ref}
      data-slot="list-group-item"
      onClick={onClick}
      className={twMerge(
        "border-b border-border px-4 py-3 last:border-b-0",
        onClick !== undefined && "cursor-pointer hover:bg-accent/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
ListGroupItem.displayName = "ListGroupItem";

const ListGroupHeader = ({
  ref,
  className,
  children,
  ...props
}: ListGroupProps & {
  ref?: React.RefObject<HTMLDivElement>;
}): React.ReactElement => {
  return (
    <div
      ref={ref}
      data-slot="list-group-header"
      className={twMerge(
        "border-b border-border bg-sidebar-accent px-4 py-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
ListGroupHeader.displayName = "ListGroupHeader";

const ListGroupFooter = ({
  ref,
  className,
  children,
  ...props
}: ListGroupProps & {
  ref?: React.RefObject<HTMLDivElement>;
}): React.ReactElement => {
  return (
    <div
      ref={ref}
      data-slot="list-group-footer"
      className={twMerge(
        "border-t border-border px-4 py-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
ListGroupFooter.displayName = "ListGroupFooter";

const ListGroup = {
  Root: ListGroupRoot,
  Item: ListGroupItem,
  Header: ListGroupHeader,
  Footer: ListGroupFooter,
};

export default ListGroupRoot;
export {
  ListGroup,
  ListGroupRoot,
  ListGroupItem,
  ListGroupHeader,
  ListGroupFooter,
};
