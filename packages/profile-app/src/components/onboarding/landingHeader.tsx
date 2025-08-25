import { Link } from 'react-router';

import { AuthButton } from '../auth/AuthButton.tsx';
import { ThemeToggle } from '../layouts/themeToggle.tsx';
import { Badge } from '../ui';

export function LandingHeader() {
  return (
    <div className="mt-5 mx-32">
      <div className="bg-landing-header-bg-back text-landing-foreground border border-landing-border rounded-sm shadow-sm">
        <div className="bg-landing-header-bg-front text-landing-foreground mt-4 mb-1 mx-2 rounded-sm">
          <div className="flex justify-between items-center py-4 px-6">
            <Link
              to="/"
              className="font-mono text-lg text-landing-foreground font-semibold "
            >
              <span className="relative">
                profile.jazz.dev
                <Badge variant="default" className="absolute ml-2 h-5">
                  Beta
                </Badge>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
