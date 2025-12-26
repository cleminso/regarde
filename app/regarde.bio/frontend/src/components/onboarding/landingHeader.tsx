import { Link } from 'react-router';

import { AuthButton } from '../auth/AuthButton';
import { ThemeToggle } from '../layouts/themeToggle';
import { Badge } from '../ui';

export function LandingHeader() {
  return (
    <div className="mx-3 mt-3 sm:mx-8 sm:mt-5 lg:mx-32">
      <div className="bg-landing-header-bg-back text-landing-foreground border-landing-border rounded-sm border shadow-sm">
        <div className="bg-landing-header-bg-front text-landing-foreground mx-1 mt-2 mb-1 rounded-sm sm:mx-2 sm:mt-4 sm:mb-1">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link
              to="/"
              className="text-landing-foreground flex items-center gap-2"
              aria-label="Home"
            >
              <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-sm"></div>

              <span className="hidden font-mono text-base font-semibold lg:inline">
                regarde.bio
              </span>

              <Badge variant="default" className="h-4 text-xs">
                Beta
              </Badge>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
