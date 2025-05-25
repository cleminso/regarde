import { Loaded } from 'jazz-tools';
import { MoreHorizontalIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { OnboardingProfile } from '#/lib/schema.ts';
import { Button } from '../ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';

type ProfileHeaderProps = {
  profile: Loaded<typeof OnboardingProfile>;
  websiteHref?: string;
  websiteDisplayName?: string;
};

export function ProfileHeader({
  profile,
  websiteHref,
  websiteDisplayName,
}: ProfileHeaderProps) {
  const navigate = useNavigate();

  return (
    <section
      className="mx-auto flex flex-row items-start gap-4"
      style={{ width: '540px' }}
    >
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt={`${profile.name}'s avatar`}
          className="w-24 h-24 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground text-center flex-shrink-0">
          <span className="text-md">No Avatar</span>
        </div>
      )}
      <div className="flex flex-col gap-2 pt-2">
        <h2 className="text-lg font">{profile.name}</h2>
        {websiteHref && websiteDisplayName && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
            title={`Visit ${profile.name}'s website: ${websiteHref}`}
          >
            <span>{websiteDisplayName}</span>
          </a>
        )}
      </div>
      <div className="flex flex-col w-full h-full">
        <div className="flex justify-end my-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 p-0">
                <MoreHorizontalIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="py-1 px-0 border border-border shadow-none"
            >
              <DropdownMenuItem
                className="w-full"
                onClick={() => navigate('/edit')}
              >
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}
