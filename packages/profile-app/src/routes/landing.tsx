import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Button } from '#/components/ui';
import { useClerkOnboarding } from '#/lib/onboarding/useClerkOnboarding';
import { createNicknameUrl } from '#/lib/utils/utils';
import { BaseLayout } from '../components/layouts/baseLayout';
import { LandingNicknameForm } from '../components/onboarding/landingNicknameForm';

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = useClerkOnboarding();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!onboarding.isAuthenticated) return;

    if (onboarding.hasExistingNickname) {
      setIsTransitioning(true);
      const isFromRegistration = sessionStorage.getItem('isNewRegistration');

      if (isFromRegistration) {
        sessionStorage.removeItem('isNewRegistration');
        navigate(createNicknameUrl(onboarding.currentNickname, '/edit'));
      } else {
        navigate(createNicknameUrl(onboarding.currentNickname));
      }
    } else if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [
    onboarding.isAuthenticated,
    onboarding.hasExistingNickname,
    onboarding.currentNickname,
    navigate,
    location.pathname,
  ]);

  if (
    onboarding.isAuthenticated &&
    onboarding.hasExistingNickname &&
    isTransitioning
  ) {
    return (
      <BaseLayout isLandingPage={true}>
        <div className="flex flex-col items-center text-center gap-6 py-12">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p>Loading your profile...</p>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout isLandingPage={true}>
      <div className="flex flex-col items-center text-center gap-3 py-12">
        <h1 className="text-2xl font-medium text-foreground mb-8">
          The only online profile you will ever need. Build one, use it
          everywhere.
        </h1>
        <LandingNicknameForm />
        <Button variant="ghost" asChild className="mt-4">
          <a
            href="https://profile.jazz.dev/cleminso"
            target="_blank"
            rel="noopener noreferrer"
          >
            See example
            <ArrowRight className="ml-1" size={16} />
          </a>
        </Button>
      </div>
    </BaseLayout>
  );
}
