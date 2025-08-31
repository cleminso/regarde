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
import { JazzAppProfile } from '#/lib/schema';
import { createNicknameUrl } from '#/lib/utils/utils';

type ProfileHeaderProps = {
  profile: Loaded<typeof JazzAppProfile>;
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  const handleEditClick = () => {
    if (profile.userHandle?.nickname) {
      navigate(createNicknameUrl(profile.userHandle.nickname, '/edit'));
    }
  };

  return (
    <div className="@container">
      <section
        className="mx-auto flex flex-row items-start gap-4 mb-10 sm:px-0"
        style={{ maxWidth: '580px' }}
      >
        <div className="flex-shrink-0">
          <div className="block sm:hidden">
            <ProfileAvatar profile={profile} size={72} />
          </div>
          <div className="hidden sm:block">
            <ProfileAvatar profile={profile} size={92} />
          </div>
        </div>

        <div className="flex flex-row w-full gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font">{profile.name}</h2>
            <p className="text-sm text-foreground">
              @{profile.userHandle?.nickname || 'nickname-not-set'}
            </p>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex justify-end my-2">
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 p-0">
                    <MoreHorizontalIcon className="w-4 h-4" />
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
