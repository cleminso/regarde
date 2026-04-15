import { useNavigate } from "@tanstack/react-router";
import { Check, Clipboard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@regarde/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@regarde/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@regarde/ui/tabs";
import { Textarea } from "@regarde/ui/shadcn/textarea";
import { useRegardeAuth } from "@regarde-dev/core/react";

interface AuthCardProps {
  defaultMode?: "login" | "create";
}

export function AuthCard({ defaultMode = "login" }: AuthCardProps) {
  const { state, signUp, logIn, generatePassphrase } = useRegardeAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "create">(defaultMode);
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [generatedPassphrase, setGeneratedPassphrase] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state === "signedIn") {
      void navigate({ to: "/register-app" });
    }
  }, [state, navigate]);

  const handleShowPassphrase = () => {
    const passphrase = generatePassphrase();
    setGeneratedPassphrase(passphrase);
  };

  const handleLogin = async () => {
    const isPassphraseEmpty = loginPassphrase.trim().length === 0;
    if (isPassphraseEmpty) {
      setError("Please enter your passphrase.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await logIn(loginPassphrase.trim());
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Invalid passphrase. Please check and try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    const hasPassphrase =
      generatedPassphrase !== null && generatedPassphrase.length > 0;

    if (hasPassphrase === false) {
      setError("Please generate a passphrase first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUp("anonymous", generatedPassphrase);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const hasPassphrase =
      generatedPassphrase !== null && generatedPassphrase.length > 0;

    if (hasPassphrase === false) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassphrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard. Please copy manually.");
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as "login" | "create");
    setError(null);
    setGeneratedPassphrase(null);
  };

  const hasPassphrase = generatedPassphrase !== null;

  return (
    <Card className="w-full max-w-md">
      <Tabs value={mode} onValueChange={handleModeChange}>
        <CardHeader>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="create">Create Account</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="space-y-4">
          {error !== null && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <TabsContent value="login" className="mt-0 space-y-4">
            <div className="space-y-2">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your Regarde account using your BIP39 passphrase.
              </CardDescription>
            </div>

            <Textarea
              placeholder="Enter your BIP39 passphrase (12-24 words)..."
              value={loginPassphrase}
              onChange={(e) => setLoginPassphrase(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </TabsContent>

          <TabsContent value="create" className="mt-0 space-y-4">
            <div className="space-y-2">
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                {hasPassphrase
                  ? "Save this passphrase securely - it is your only recovery method."
                  : "Click the button below to generate your secure passphrase."}
              </CardDescription>
            </div>

            {hasPassphrase && (
              <>
                <div className="relative">
                  <Textarea
                    value={generatedPassphrase}
                    readOnly
                    rows={4}
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={handleCopy}
                    title="Copy passphrase"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Warning: Store this passphrase in a secure location. If you
                  lose it, your account cannot be recovered.
                </div>
              </>
            )}
          </TabsContent>
        </CardContent>

        <CardFooter>
          <TabsContent value="login" className="mt-0 w-full">
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading || loginPassphrase.trim().length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="create" className="mt-0 w-full">
            {hasPassphrase ? (
              <Button
                className="w-full"
                onClick={handleCreateAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleShowPassphrase}
                disabled={isLoading}
              >
                Generate Passphrase
              </Button>
            )}
          </TabsContent>
        </CardFooter>
      </Tabs>
    </Card>
  );
}
