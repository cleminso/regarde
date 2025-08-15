import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';
import { cn } from 'src/lib/utils';

import { useDefaultAvatar } from '#/lib/hook/useDefaultAvatar';
import { type CleanLoadedJazzAppProfile } from '#/lib/schema';

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-[inherit]',
        className,
      )}
      {...props}
    />
  );
}

function ProfileAvatar({
  profile,
  className,
  size = 96,
  ...props
}: {
  profile: CleanLoadedJazzAppProfile;
  className?: string;
  size?: number;
} & React.ComponentProps<typeof AvatarPrimitive.Root>) {
  const avatarSrc = useDefaultAvatar(profile, size);

  const avatarClasses = cn(
    size === 92
      ? 'size-[92px] rounded-xl'
      : size === 96
        ? 'size-24 rounded-xl'
        : 'size-8 rounded-xl',
    className,
  );

  return (
    <Avatar className={avatarClasses} {...props}>
      {avatarSrc && (
        <AvatarImage
          src={avatarSrc}
          alt={`${profile.name || profile.userHandle}'s avatar`}
          className="rounded-[inherit]"
        />
      )}
      <AvatarFallback>
        {profile?.userHandle?.nickname.substring(0, 2).toUpperCase() || 'NA'}
      </AvatarFallback>
    </Avatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback, ProfileAvatar };
