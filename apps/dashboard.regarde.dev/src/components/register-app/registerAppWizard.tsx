import type { RegisterAppResponse } from "#/lib/api/registerApp";
import type { TApp } from "@regarde-dev/core";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";
import { registerApp, RegisterAppApiError } from "#/lib/api/registerApp";
import { Button } from "#ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#ui/card";
import { createApp } from "@regarde-dev/core";
import { useRegardeTokenAuth } from "@regarde-dev/core/react";

import { StepConfig, type AppConfigData } from "./stepConfig";
import { StepIndicator } from "./stepIndicator";
import { StepResult } from "./stepResult";

type WizardStep = 1 | 2;

type SubmissionStatus = "idle" | "loading" | "success" | "error";

interface WizardState {
  step: WizardStep;
  formData: AppConfigData;
  submissionStatus: SubmissionStatus;
  result?: RegisterAppResponse;
  error?: string;
  createdApp?: TApp;
}

const INITIAL_FORM_DATA: AppConfigData = {
  name: "",
  paymentProvider: "lemonsqueezy",
  description: "",
};

export function RegisterAppWizard(): React.ReactElement {
  const navigate = useNavigate();
  const { account, auth, isAccountReady } = useMyRegardeAccount();
  const {
    token,
    tokenId,
    isExpired,
    refresh,
    isLoading: isTokenLoading,
  } = useRegardeTokenAuth(auth);

  const [state, setState] = useState<WizardState>({
    step: 1,
    formData: INITIAL_FORM_DATA,
    submissionStatus: "idle",
  });

  // Auto-refresh token if expired
  useEffect(() => {
    const shouldRefresh = isExpired === true && isTokenLoading === false;
    if (shouldRefresh) {
      refresh();
    }
  }, [isExpired, isTokenLoading, refresh]);

  // Auto-retry submission when token becomes valid (was expired but now refreshed)
  useEffect(() => {
    const wasWaitingForToken =
      state.submissionStatus === "error" &&
      (state.error?.includes("expired") || state.error?.includes("Refreshing"));

    const hasToken = token !== null && token.length > 0;
    const hasTokenId = tokenId !== null && tokenId.length > 0;
    const isTokenValid = hasToken && hasTokenId && isExpired === false;

    if (wasWaitingForToken && isTokenValid && state.step === 2) {
      setState((previous) => ({
        ...previous,
        submissionStatus: "idle",
        error: undefined,
      }));
      setTimeout(() => {
        void handleSubmit();
      }, 100);
    }
  }, [token, tokenId, isExpired, state.submissionStatus, state.error, state.step]);

  const handleFormChange = (formData: AppConfigData) => {
    setState((previous) => ({ ...previous, formData }));
  };

  const handleContinue = () => {
    const isNameValid = state.formData.name.trim().length > 0;
    if (isNameValid === false) {
      setState((previous) => ({
        ...previous,
        error: "Please enter an app name",
      }));
      return;
    }

    // Check account is ready before moving to step 2
    const isAccountDataReady =
      isAccountReady === true && account !== undefined && account.$isLoaded === true;

    if (isAccountDataReady === false) {
      setState((previous) => ({
        ...previous,
        error: "Account is still loading. Please wait a moment and try again.",
      }));
      return;
    }

    // Check token validity
    const hasToken = token !== null && token.length > 0;
    const hasTokenId = tokenId !== null && tokenId.length > 0;
    const isTokenValid = hasToken && hasTokenId && isExpired === false;

    if (isTokenValid === false) {
      if (isExpired === true) {
        refresh();
        setState((previous) => ({
          ...previous,
          error: "Refreshing authentication token... Please try again in a moment.",
        }));
      } else {
        setState((previous) => ({
          ...previous,
          error: "Authentication not ready. Please wait.",
        }));
      }
      return;
    }

    setState((previous) => ({
      ...previous,
      step: 2,
      error: undefined,
    }));

    // Use setTimeout to ensure state update has completed
    setTimeout(() => {
      void handleSubmit();
    }, 0);
  };

  const handleSubmit = async () => {
    const isAccountDataReady =
      isAccountReady === true && account !== undefined && account.$isLoaded === true;

    if (isAccountDataReady === false) {
      setState((previous) => ({
        ...previous,
        submissionStatus: "error",
        error: "Account not ready. Please wait and try again.",
      }));
      return;
    }

    // Check token validity using the hook's token
    const hasToken = token !== null && token.length > 0;
    const hasTokenId = tokenId !== null && tokenId.length > 0;
    const isTokenValid = hasToken && hasTokenId && isExpired === false;

    if (isTokenValid === false) {
      console.log(
        "[RegisterAppWizard] Token not ready, isExpired:",
        isExpired,
        "hasToken:",
        hasToken,
      );
      setState((previous) => ({
        ...previous,
        submissionStatus: "error",
        error:
          isExpired === true
            ? "Authentication token expired. Refreshing..."
            : "Authentication not ready. Please wait.",
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      submissionStatus: "loading",
      error: undefined,
    }));

    try {
      // Step 1: Create the app locally using SDK
      const newApp = await createApp(account, {
        name: state.formData.name.trim(),
        description: state.formData.description.trim(),
        paymentProvider: state.formData.paymentProvider,
      });

      // Wait for sync to ensure the CoMap is persisted
      await newApp.$jazz.waitForSync();

      // Store the created app for potential retry
      setState((previous) => ({
        ...previous,
        createdApp: newApp,
      }));

      // Step 2: Register with the API
      const result = await registerApp(newApp.$jazz.id, auth!, account.$jazz.id);

      setState((previous) => ({
        ...previous,
        submissionStatus: "success",
        result,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof RegisterAppApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred";

      setState((previous) => ({
        ...previous,
        submissionStatus: "error",
        error: errorMessage,
      }));
    }
  };

  const handleRetry = () => {
    // Check token validity before retrying
    const hasToken = token !== null && token.length > 0;
    const hasTokenId = tokenId !== null && tokenId.length > 0;
    const isTokenValid = hasToken && hasTokenId && isExpired === false;

    if (isTokenValid === false && isExpired === true) {
      refresh();
      setState((previous) => ({
        ...previous,
        error: "Refreshing authentication token...",
      }));
      return;
    }

    // If we already created the app locally, just retry the API call
    if (state.createdApp !== undefined && state.submissionStatus === "error") {
      setState((previous) => ({
        ...previous,
        submissionStatus: "loading",
        error: undefined,
      }));
      void retryApiCall();
    } else {
      // Otherwise retry the full flow
      void handleSubmit();
    }
  };

  const retryApiCall = async () => {
    const hasToken = token !== null && token.length > 0;
    const hasTokenId = tokenId !== null && tokenId.length > 0;
    const isTokenValid = hasToken && hasTokenId && isExpired === false;

    const canRetry =
      state.createdApp !== undefined &&
      account !== undefined &&
      account.$isLoaded === true &&
      isTokenValid === true;

    if (canRetry === false) {
      const errorMsg =
        isExpired === true
          ? "Authentication token expired. Please wait for refresh."
          : "Cannot retry - account data not available";

      setState((previous) => ({
        ...previous,
        submissionStatus: "error",
        error: errorMsg,
      }));
      return;
    }

    try {
      const result = await registerApp(state.createdApp!.$jazz.id, auth!, account!.$jazz.id);

      setState((previous) => ({
        ...previous,
        submissionStatus: "success",
        result,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof RegisterAppApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred";

      setState((previous) => ({
        ...previous,
        submissionStatus: "error",
        error: errorMessage,
      }));
    }
  };

  const handleGoToDashboard = () => {
    const appId = state.createdApp?.$jazz.id ?? state.result?.appId;
    if (appId !== undefined) {
      void navigate({ to: "/app/$appId/overview", params: { appId } });
    }
  };

  // Show loading state while account or token initializes
  if (isAccountReady === false || isTokenLoading === true) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            {isTokenLoading === true
              ? "Refreshing authentication..."
              : "Initializing your account..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{state.step === 1 ? "Create New App" : "App Registration"}</CardTitle>
        <CardDescription>
          {state.step === 1
            ? "Enter your app details to get started with payment tracking."
            : "Registering your app with the Regarde API..."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {state.step === 1 ? (
          <StepConfig data={state.formData} onChange={handleFormChange} error={state.error} />
        ) : (
          <StepResult
            status={state.submissionStatus}
            result={state.result}
            error={state.error}
            onRetry={handleRetry}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {state.step === 1 && (
          <Button
            className="w-full"
            onClick={handleContinue}
            disabled={state.formData.name.trim().length === 0}
          >
            Continue
          </Button>
        )}
        <StepIndicator currentStep={state.step} totalSteps={2} />
      </CardFooter>
    </Card>
  );
}
