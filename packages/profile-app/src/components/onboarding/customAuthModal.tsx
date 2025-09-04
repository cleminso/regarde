import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CustomAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
  nicknameContext?: {
    nickname: string;
    onRegistered: (nickname: string) => void;
  };
}

export function CustomAuthModal({
  isOpen,
  onClose,
  mode: initialMode = 'login',
  onModeChange,
  nicknameContext,
}: CustomAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const {
    isLoaded: signUpLoaded,
    signUp,
    setActive: setActiveSignUp,
  } = useSignUp();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setVerificationCode('');
    setError('');
    setPendingVerification(false);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signIn) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onClose();
        resetForm();
      } else if (result.status === 'needs_second_factor') {
        setPendingVerification(true);
      } else {
        setError('Unable to complete login. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        setPendingVerification(true);
      } else if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        if (nicknameContext) {
          nicknameContext.onRegistered(nicknameContext.nickname);
        }
        onClose();
        resetForm();
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setError(
        err.errors?.[0]?.message || 'An error occurred during registration',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        if (nicknameContext) {
          nicknameContext.onRegistered(nicknameContext.nickname);
        }
        onClose();
        resetForm();
      } else if (result.status === 'missing_requirements') {
        const isTestMode = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.includes('test');

        if (isTestMode) {
          if (nicknameContext) {
            nicknameContext.onRegistered(nicknameContext.nickname);
          }
          onClose();
          resetForm();
          return;
        } else {
          setError('Additional information required to complete signup.');
        }
      } else {
        setError(`Verification status: ${result.status}`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    const newMode = initialMode === 'login' ? 'register' : 'login';
    onModeChange?.(newMode);
    resetForm();
  };

  if (!signInLoaded || !signUpLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground font-mono">Loading...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] h-[400px] bg-card border-border">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-mono text-foreground">
            {pendingVerification
              ? 'Verify your email'
              : initialMode === 'login'
                ? 'Login'
                : 'Create your account'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono">
            {pendingVerification ? (
              `We sent a verification code to ${email}`
            ) : initialMode === 'login' ? (
              'Welcome back! Please log in to continue.'
            ) : nicknameContext ? (
              <>
                Create your account to register `
                <span className="text-foreground font-semibold">
                  {nicknameContext.nickname}
                </span>
                `
              </>
            ) : (
              'Welcome! Please fill the details to get started.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md font-mono">
              {error}
            </div>
          )}

          {pendingVerification ? (
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground font-mono">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
                disabled={!verificationCode || isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingVerification(false)}
                className="w-full font-mono text-foreground"
              >
                Back to register
              </Button>
            </form>
          ) : (
            <>
              <form
                onSubmit={
                  initialMode === 'login' ? handleLogin : handleRegister
                }
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-mono">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete={
                      initialMode === 'login' ? 'email' : 'new-email'
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-foreground font-mono"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={
                      initialMode === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full text-foreground font-mono h-11"
                  disabled={!email || !password || isLoading}
                >
                  {isLoading
                    ? 'Loading...'
                    : initialMode === 'login'
                      ? 'Login'
                      : 'Create account'}
                </Button>
              </form>

              {!nicknameContext && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground font-mono">
                    {initialMode === 'login'
                      ? "Don't have an account? "
                      : 'Already have an account? '}
                  </span>
                  <button
                    onClick={switchMode}
                    className="text-foreground hover:underline hover:underline-offset-2 font-mono "
                  >
                    {initialMode === 'login' ? 'register' : 'Log In'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
