import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { Loaded } from 'jazz-tools';
import * as React from 'react';
import { cn } from 'src/lib/utils';

import { useDefaultAvatar } from '#/lib/hook/useDefaultAvatar';
import { OnboardingProfile } from '#/lib/schema';

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
        'bg-muted flex size-full items-center justify-center rounded-full',
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
  profile: Loaded<typeof OnboardingProfile>;
  className?: string;
  size?: number;
} & React.ComponentProps<typeof AvatarPrimitive.Root>) {
  const avatarSrc = useDefaultAvatar(profile);

  return (
    <Avatar
      className={cn(size === 96 ? 'size-24' : 'size-8', className)}
      {...props}
    >
      {avatarSrc && (
        <AvatarImage
          src={avatarSrc}
          alt={`${profile.name || profile.nickname}'s avatar`}
        />
      )}
      <AvatarFallback>
        {profile.nickname?.substring(0, 2).toUpperCase() || 'NA'}
      </AvatarFallback>
    </Avatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback, ProfileAvatar };
