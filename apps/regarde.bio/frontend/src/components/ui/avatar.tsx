import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Loaded } from "jazz-tools";
import * as React from "react";

import { useDefaultAvatar } from "#/lib/hook/useDefaultAvatar";
import { type RegardeProfile } from "#/lib/schema";
import { cn } from "#/lib/utils/utils";

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
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
        "bg-muted flex size-full items-center justify-center rounded-[inherit]",
        className,
      )}
      {...props}
    />
  );
}

function ProfileAvatar({
  profile,
  nickname,
  className,
  size = 96,
  ...props
}: {
  profile: Loaded<typeof RegardeProfile>;
  nickname?: string;
  className?: string;
  size?: number;
} & React.ComponentProps<typeof AvatarPrimitive.Root>) {
  const avatarSrc = useDefaultAvatar(profile, nickname, size);

  const avatarClasses = cn(
    // ALWAYS apply rounded-xl for ProfileAvatar, regardless of size
    "relative flex shrink-0 overflow-hidden rounded-xl",
    // Size-specific classes
    size === 92
      ? "size-[92px]"
      : size === 96
        ? "size-24"
        : size === 72
          ? "size-[72px]"
          : size === 64
            ? "size-16"
            : size === 48
              ? "size-12"
              : "size-8",
    className,
  );

  // Use nickname for display if provided, otherwise fall back to profile name
  const displayName = nickname || profile.name;

  return (
    <AvatarPrimitive.Root className={avatarClasses} {...props}>
      {avatarSrc && (
        <AvatarImage
          src={avatarSrc}
          alt={`${displayName}'s avatar`}
          className="aspect-square size-full rounded-xl"
        />
      )}
      <AvatarFallback className="bg-muted flex size-full items-center justify-center rounded-xl">
        {displayName?.substring(0, 2).toUpperCase() || "NA"}
      </AvatarFallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar, AvatarImage, AvatarFallback, ProfileAvatar };
