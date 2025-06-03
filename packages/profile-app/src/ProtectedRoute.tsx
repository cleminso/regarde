import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';

import {
  fetchUserDetailsByAccountId,
  fetchUserDetailsWithValidation,
  validateNicknameOwnership,
} from './lib/api';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const { nickname } = useParams();
  const [validationState, setValidationState] = useState<
    'loading' | 'valid' | 'invalid' | 'error'
  >('loading');
  const [actualNickname, setActualNickname] = useState<string>('');

  const { me } = useAccount(OnboardingAccount, {
    resolve: false,
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (!me?.id || !nickname) return;

    setValidationState('loading');

    fetchUserDetailsWithValidation(me.id, nickname)
      .then((userDetails) => {
        // Handle specific case where backend says nickname is not owned by account
        if (
          userDetails.error ===
          'Provided nickname is not owned by the provided jazzAccountId'
        ) {
          // Fetch account details to get the actual nickname
          return fetchUserDetailsByAccountId(me.id)
            .then((accountDetails) => {
              if (
                accountDetails.nickname &&
                accountDetails.nickname !== nickname
              ) {
                setActualNickname(accountDetails.nickname);
                setValidationState('invalid');
              } else {
                setValidationState('error');
              }
            })
            .catch((error) => {
              console.error('Failed to fetch account details:', error);
              setValidationState('error');
            });
        }

        const validation = validateNicknameOwnership(
          userDetails,
          me.id,
          nickname,
        );

        if (validation.isValid) {
          setValidationState('valid');
        } else if (validation.redirectTo) {
          setActualNickname(validation.redirectTo);
          setValidationState('invalid');
        } else {
          setValidationState('error');
        }
      })
      .catch((error) => {
        console.error('ProtectedRoute validation error:', error);
        setValidationState('error');
      });
  }, [me?.id, nickname]);

  if (validationState === 'loading') {
    return <div>Loading...</div>;
  }

  if (validationState === 'error') {
    return <Navigate to="/" replace />;
  }

  if (validationState === 'invalid' && actualNickname) {
    return <Navigate to={`/${actualNickname}/edit`} replace />;
  }

  return <Outlet />;
}
