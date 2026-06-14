import * as React from 'react';
import { cn } from '@/shared/utils';

const Avatar = React.forwardRef(function Avatar({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  );
});
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(function AvatarImage({ className, src, alt, ...props }, ref) {
  if (!src) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt || ''}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(function AvatarFallback({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
