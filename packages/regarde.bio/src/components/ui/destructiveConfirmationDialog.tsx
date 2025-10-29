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
} from './alert-dialog';
import { buttonVariants } from './button';

export interface DestructiveConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: VariantProps<typeof buttonVariants>['variant'];
}

export function DestructiveConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  confirmButtonVariant = 'destructive',
}: DestructiveConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelButtonText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={buttonVariants({ variant: confirmButtonVariant })}
          >
            {confirmButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
