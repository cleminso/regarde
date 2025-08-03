import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground cursor-pointer',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground cursor-pointer',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer',
        success:
          'bg-green-300 text-green-700 hover:bg-green-300/90 hover:text-green-700 cursor-pointer',
        view: 'bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground cursor-pointer',
        outline:
          'border border-input bg-transparent text-foreground hover:bg-background hover:text-foreground cursor-pointer',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-secondary-foreground underline underline-offset-4 rounded-md h-auto px-1 py-0 hover:bg-accent hover:text-accent-foreground hover:no-underline',
        'link-title':
          'text-base font-medium justify-start text-foreground rounded-md no-underline hover:bg-accent hover:text-accent-foreground hover:no-underline disabled:text-foreground disabled:opacity-100 disabled:cursor-default',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-2 text-xs',
        md: 'h-9 rounded-md px-4 text-sm',
        lg: 'h-10 rounded-md px-4',
        icon: 'h-9 w-9 rounded-md',
        title: `h-auto px-1 py-0`,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
