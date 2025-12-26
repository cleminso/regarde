import { Loaded } from 'jazz-tools';
import { useIsAuthenticated } from 'jazz-tools/react';
import { MoreHorizontalIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

import { ProfileAvatar } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { RegardeProfile } from '#/lib/schema';
import { createNicknameUrl } from '#/lib/utils/utils';

type ProfileHeaderProps = {
  profile: Loaded<typeof RegardeProfile>;
  nickname?: string;
};

export function ProfileHeader({ profile, nickname }: ProfileHeaderProps) {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  const handleEditClick = () => {
    if (nickname) {
      navigate(createNicknameUrl(nickname, '/edit'));
    }
  };

  return (
    <div className="@container">
      <section
        className="mx-auto mb-10 flex flex-row items-start gap-4 sm:px-0"
        style={{ maxWidth: '580px' }}
      >
        <div className="shrink-0">
          <div className="block sm:hidden">
            <ProfileAvatar profile={profile} nickname={nickname} size={72} />
          </div>
          <div className="hidden sm:block">
            <ProfileAvatar profile={profile} nickname={nickname} size={92} />
          </div>
        </div>

        <div className="flex w-full flex-row gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font text-lg">{profile.name}</h2>
            <p className="text-foreground text-sm">
              @{nickname || 'nickname-not-set'}
            </p>
          </div>
        </div>

        <div className="flex h-full flex-col">
          <div className="my-2 flex justify-end">
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border shadow-none"
                >
                  <DropdownMenuItem
                    className="w-full"
                    onClick={handleEditClick}
                  >
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
