import { lazy } from 'react';

// Keep refreshable components separate from main.tsx's one-time DOM mounting.
export const WorkspaceApp = lazy(() => import('./workspace/workspaceRouter'));
export const DatafilesApp = lazy(() => import('./datafiles/datafilesRouter'));
export const OnboardingApp = lazy(
  () => import('./onboarding/onboardingRouter')
);
export const NavAI = lazy(() => import('./navAI'));
export const ReconApp = lazy(() => import('./reconportal/reconportalRouter'));
export const DashboardApp = lazy(() => import('./dashboard/dashboard'));
export const NcoApp = lazy(() => import('./nco/ncoRouter'));
