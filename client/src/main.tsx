import './styles.css';
import type { ComponentType } from 'react';

type AppModule = { default: ComponentType };
type AppLoader = () => Promise<AppModule>;

const mountApp = (rootId: string, loadApp: AppLoader) => {
  const element = document.getElementById(rootId);

  if (element) {
    void Promise.all([import('./renderApp'), loadApp()]).then(
      ([{ renderApp }, { default: App }]) => renderApp(element, App)
    );
  }
};

mountApp('apps-root', () => import('./workspace/workspaceRouter'));
mountApp('datafiles-root', () => import('./datafiles/datafilesRouter'));
mountApp('onboarding-root', () => import('./onboarding/onboardingRouter'));
mountApp('nav-ai-root', () => import('./navAI'));
mountApp('recon-root', () => import('./reconportal/reconportalRouter'));
