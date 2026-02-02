import { lazy } from "react";

export const routes = {
  LandingPage: lazy(() => import("./landing.tsx").then((m) => ({ default: m.LandingPage }))),
  ProfilePage: lazy(() => import("./profile.tsx").then((m) => ({ default: m.ProfilePage }))),
  EditorPage: lazy(() => import("./edit.tsx").then((m) => ({ default: m.EditorPage }))),
  NotFoundPage: lazy(() => import("./notFound.tsx").then((m) => ({ default: m.NotFoundPage }))),
} as const;
