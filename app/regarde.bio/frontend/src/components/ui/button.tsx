import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9 py-2 group bg-primary text-primary-foreground ring-primary before:from-primary-foreground/20 after:from-primary-foreground/10 relative isolate inline-flex w-full items-center justify-center overflow-hidden cursor-pointer rounded-md px-3 text-left text-sm font-medium ring-1 transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-b before:opacity-80 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-md after:bg-gradient-to-b after:to-transparent after:mix-blend-overlay',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground cursor-pointer',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground cursor-pointer',
        success:
          'bg-green-300 text-green-700 hover:bg-green-300/90 hover:text-green-700 cursor-pointer',
        view: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground cursor-pointer',
        outline:
          'border border-input bg-transparent text-foreground hover:bg-secondary hover:text-foreground cursor-pointer',
        ghost: 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
        link: 'text-muted-foreground rounded-md h-auto px-1 py-0 hover:bg-accent-link hover:text-accent-link-foreground hover:no-underline cursor-pointer',
        'link-title':
          'text-base font-medium justify-start text-foreground rounded-md no-underline hover:bg-accent-link hover:text-accent-link-foreground hover:no-underline disabled:text-foreground disabled:opacity-100 disabled:cursor-default cursor-pointer',
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
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
