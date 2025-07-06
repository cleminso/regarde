import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';

import {
  fetchUserDetailsByAccountId,
  fetchUserDetailsWithValidation,
  validateNicknameOwnership,
} from './lib/api/base';
import { createNicknameUrl } from './lib/utils';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const { nickname } = useParams();
  const [validationState, setValidationState] = useState<
    'loading' | 'valid' | 'invalid' | 'error'
  >('loading');
  const [actualNickname, setActualNickname] = useState<string>('');

  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true },
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (!me?.id || !nickname) return;

    if (validationState === 'loading') return;
    setValidationState('loading');

    fetchUserDetailsWithValidation(me.id, nickname)
      .then((userDetails) => {
        console.log('ProtectedRoute: Received user details', userDetails);

        if (
          userDetails.error ===
          'Provided nickname is not owned by the provided jazzAccountId'
        ) {
          console.log(
            'ProtectedRoute: Nickname ownership error, fetching account details',
          );
          return fetchUserDetailsByAccountId(me.id)
            .then((accountDetails) => {
              console.log(
                'ProtectedRoute: Account details received',
                accountDetails,
              );
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
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        setValidationState('error');
      });
  }, [me?.id, nickname, validationState]);

  if (validationState === 'error') {
    return <Navigate to="/" replace />;
  }

  if (validationState === 'invalid' && actualNickname) {
    return <Navigate to={createNicknameUrl(actualNickname, '/edit')} replace />;
  }

  return <Outlet />;
}
