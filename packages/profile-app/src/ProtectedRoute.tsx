import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { Navigate, Outlet, useParams } from 'react-router';

import { OnboardingAccount } from './lib/schema';
import { createNicknameUrl } from './lib/utils';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const { nickname } = useParams();

  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true },
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (me === undefined) {
    return <div>Loading account...</div>;
  }

  if (me === null || !me.profile) {
    return <Navigate to="/" replace />;
  }

  const profileNickname = me.profile.nickname;

  if (!profileNickname) {
    return <Navigate to="/" replace />;
  }

  if (nickname !== profileNickname) {
    return (
      <Navigate to={createNicknameUrl(profileNickname, '/edit')} replace />
    );
  }

  return <Outlet />;
}
