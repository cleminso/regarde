import type { RegisterAppResponse } from "#/lib/api/registerApp";
import type { TApp } from "@regarde-dev/core";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
  const { isExpired, refresh, isLoading: isTokenLoading } = useRegardeTokenAuth(auth);

  const [state, setState] = useState<WizardState>({
    step: 1,
    formData: INITIAL_FORM_DATA,
    submissionStatus: "idle",
  });

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

    // Move to step 2 and start submission
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

    setState((previous) => ({
      ...previous,
      submissionStatus: "loading",
      error: undefined,
    }));

    try {
      // Refresh token if expired before API call
      if (isExpired === true) {
        await refresh();
      }

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
    const canRetry =
      state.createdApp !== undefined && account !== undefined && account.$isLoaded === true;

    if (canRetry === false) {
      setState((previous) => ({
        ...previous,
        submissionStatus: "error",
        error: "Cannot retry - account data not available",
      }));
      return;
    }

    try {
      // Refresh token if expired before retry
      if (isExpired === true) {
        await refresh();
      }

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

  const handleGoToDashboard = async () => {
    const appId = state.createdApp?.$jazz.id ?? state.result?.appId;
    if (appId !== undefined) {
      // Wait for sync to ensure the new app is available in myApps list
      // This prevents navigation to a route that can't find the app
      await new Promise((resolve) => setTimeout(resolve, 500));
      await navigate({ to: "/app/$appId/overview", params: { appId } });
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
