import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';

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
  mode?: 'signin' | 'signup';
}

export function CustomAuthModal({
  isOpen,
  onClose,
  mode: initialMode = 'signin',
}: CustomAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

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

  const handleSignIn = async (e: React.FormEvent) => {
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
        setError('Unable to complete sign-in. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
        onClose();
        resetForm();
      }
    } catch (err: any) {
      console.error('Sign-up error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during sign up');
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
        onClose();
        resetForm();
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (!signInLoaded || !signUpLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[460px] bg-card border-border">
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-secondary-foreground font-mono">
                Loading...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] h-[400px] bg-card border-border">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-mono text-foreground">
            {pendingVerification
              ? 'Verify your email'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create your account'}
          </DialogTitle>
          <DialogDescription className="text-secondary-foreground font-mono">
            {pendingVerification
              ? `We sent a verification code to ${email}`
              : mode === 'signin'
                ? 'Welcome back! Please sign in to continue.'
                : 'Welcome! Please fill the details to get started.'}
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
                Back to sign up
              </Button>
            </form>
          ) : (
            <>
              <form
                onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
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
                    autoComplete={mode === 'signin' ? 'email' : 'new-email'}
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
                      mode === 'signin' ? 'current-password' : 'new-password'
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-foreground hover:bg-primary/90 font-mono h-11"
                  disabled={!email || !password || isLoading}
                >
                  {isLoading
                    ? 'Loading...'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Create account'}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-secondary-foreground font-mono">
                  {mode === 'signin'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                </span>
                <button
                  onClick={switchMode}
                  className="text-foreground hover:underline hover:underline-offset-2 font-mono "
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
