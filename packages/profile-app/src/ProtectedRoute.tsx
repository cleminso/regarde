import { Navigate, Outlet, useParams } from 'react-router';

import { useMyJazz } from './lib/account/useMyJazz';
import { createNicknameUrl } from './lib/utils';

export function ProtectedRoute() {
  const { nickname } = useParams();
  const { account, jazzAppProfile, isAuthenticated } = useMyJazz();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (account === undefined) {
    return <div>Loading account...</div>;
  }

  if (account === null || !account.profile) {
    return <Navigate to="/" replace />;
  }

  const profileNickname = jazzAppProfile?.userHandle?.nickname;

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
