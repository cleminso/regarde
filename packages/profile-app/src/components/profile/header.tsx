import { Loaded } from 'jazz-tools';
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
import { OnboardingProfile } from '#/lib/schema';
import {
  createNicknameUrl,
  getValidUrl,
  getWebsiteDisplayName,
} from '#/lib/utils';

type ProfileHeaderProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const navigate = useNavigate();

  const websiteHref = getValidUrl(profile.socialLinks?.website);
  const websiteDisplayName = getWebsiteDisplayName(
    profile.socialLinks?.website,
  );

  const handleEditClick = () => {
    if (profile.nickname) {
      navigate(createNicknameUrl(profile.nickname, '/edit'));
    }
  };

  return (
    <section
      className="mx-auto flex flex-row items-start gap-4 mb-10"
      style={{ width: '540px' }}
    >
      <ProfileAvatar profile={profile} size={96} className="flex-shrink-0" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font">{profile.name}</h2>
          <p className="text-sm text-foreground">
            @{profile.nickname || 'nickname-not-set'}
          </p>
        </div>
        {websiteHref && websiteDisplayName && (
          <div className="flex">
            <Button
              asChild
              variant="link"
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground w-auto"
              title={`Visit ${profile.name}'s website: ${websiteHref}`}
            >
              <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                {websiteDisplayName}
              </a>
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col w-full h-full">
        <div className="flex justify-end my-2">
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
              <DropdownMenuItem className="w-full" onClick={handleEditClick}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}
