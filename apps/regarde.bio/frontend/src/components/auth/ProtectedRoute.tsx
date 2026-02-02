import { Navigate, Outlet, useParams } from "react-router";

import { useMyRegardeAccount } from "../../lib/account/useMyRegardeAccount";
import { createNicknameUrl } from "../../lib/utils/utils";

export function ProtectedRoute() {
  const { nickname } = useParams();
  const { account, isAuthenticated, userNickname } = useMyRegardeAccount();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (account === undefined) {
    return <div>Loading account...</div>;
  }

  if (account === null || !account.$isLoaded || !account.root?.["regarde.bio"]) {
    return <Navigate to="/" replace />;
  }

  const profileNickname = userNickname;

  if (!profileNickname) {
    return <Navigate to="/" replace />;
  }

  if (nickname !== profileNickname) {
    return <Navigate to={createNicknameUrl(profileNickname, "/edit")} replace />;
  }

  return <Outlet />;
}
