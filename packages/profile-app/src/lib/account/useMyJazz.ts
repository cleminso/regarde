import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';

export function useMyJazz() {
  const isAuthenticated = useIsAuthenticated();

  const { me: account, logOut } = useAccount(
    OnboardingAccount,
    isAuthenticated ? {
      resolve: {
        root: {
          'regarde.dev': {
            socialLinks: true,
            projects: { $each: true },
            workExp: { $each: true },
            writing: { $each: true },
            education: { $each: true },
            certification: { $each: true },
            speaking: { $each: true },
            award: { $each: true },
            volunteering: { $each: true },
            sideProject: { $each: true },
            nowPage: true,
            avatarImage: { original: true },
          },
          'profile.jazz.dev': {
            socialLinks: true,
            projects: { $each: true },
            workExp: { $each: true },
            writing: { $each: true },
            education: { $each: true },
            certification: { $each: true },
            speaking: { $each: true },
            award: { $each: true },
            volunteering: { $each: true },
            sideProject: { $each: true },
            nowPage: true,
            avatarImage: { original: true },
          },
          'auth.regarde.dev': true,
          'auth.jazz.dev': true,
        },
      },
    } : {}
  );

  const jazzAppProfile = account?.root?.['regarde.dev'] || account?.root?.['profile.jazz.dev'];
  const registrationKey = account?.root?.['auth.regarde.dev'] || account?.root?.['auth.jazz.dev'];

  return {
    account,
    jazzAppProfile,
    registrationKey,
    isAuthenticated,
    logOut,
    isAccountReady: !!account && !!jazzAppProfile,
  };
}
