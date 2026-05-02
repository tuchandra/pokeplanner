import { cn } from '@/lib/cn';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import type * as React from 'react';

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border-soft bg-card-soft p-0.5',
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        'inline-flex h-7 items-center justify-center gap-1.5 rounded px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-card-hover',
        'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[inset_0_0_0_1px_var(--color-border)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'cursor-pointer disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
