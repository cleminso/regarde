import { OnboardingAccount } from '@onboarding.jazz/shared-schemas';
import { useAccount, useIsAuthenticated } from 'jazz-react';
import { Navigate, Outlet, useParams } from 'react-router';
import { useEffect, useState } from 'react';

import { fetchUserDetailsWithValidation, validateNicknameOwnership } from './lib/api';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const { nickname } = useParams();
  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
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
        const validation = validateNicknameOwnership(userDetails, me.id, nickname);
        
        if (validation.isValid) {
          setValidationState('valid');
        } else if (validation.redirectTo) {
          setActualNickname(validation.redirectTo);
          setValidationState('invalid');
        } else {
          setValidationState('error');
        }
      })
      .catch(() => {
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
    return <Navigate to={`/${actualNickname}`} replace />;
  }

  return <Outlet />;
}
