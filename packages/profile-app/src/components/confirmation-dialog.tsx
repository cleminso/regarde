import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { buttonVariants } from './ui/button';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: VariantProps<typeof buttonVariants>['variant'];
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonVariant = 'default',
}: ConfirmationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-sans text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-sans text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="text-sm font-sans text-foreground shadow-none"
          >
            {cancelButtonText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: confirmButtonVariant })}
          >
            {confirmButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
