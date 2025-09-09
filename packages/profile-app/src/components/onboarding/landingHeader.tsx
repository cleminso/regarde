import { Link } from 'react-router';

import { AuthButton } from '../auth/AuthButton';
import { ThemeToggle } from '../layouts/themeToggle';
import { Badge } from '../ui';

export function LandingHeader() {
  return (
    <div className="mt-3 mx-3 sm:mt-5 sm:mx-8 lg:mx-32">
      <div className="bg-landing-header-bg-back text-landing-foreground border border-landing-border rounded-sm shadow-sm">
        <div className="bg-landing-header-bg-front text-landing-foreground mt-2 mb-1 mx-1 sm:mt-4 sm:mb-1 sm:mx-2 rounded-sm">
          <div className="flex justify-between items-center py-3 px-4 sm:py-4 sm:px-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-landing-foreground"
              aria-label="Home"
            >
              <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center"></div>

              <span className="hidden lg:inline font-mono text-base font-semibold">
                regarde.dev
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
