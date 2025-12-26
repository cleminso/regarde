import { LandingHeader } from '../onboarding/landingHeader';

interface BaseLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  isLandingPage?: boolean;
}

export function BaseLayout({
  children,
  showHeader = true,
  isLandingPage = false,
}: BaseLayoutProps) {
  return (
    <div className="bg-background min-h-screen">
      {showHeader && <LandingHeader />}
      <main
        className={`${isLandingPage ? 'container mt-12' : 'container-full'} ${showHeader ? 'py-6' : ''}`}
      >
        {children}
      </main>
    </div>
  );
}
