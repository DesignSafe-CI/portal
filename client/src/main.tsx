import './styles.css';
import type { ComponentType } from 'react';
import { renderApp } from './renderApp';
import {
  WorkspaceApp,
  DatafilesApp,
  OnboardingApp,
  NavAI,
  ReconApp,
  DashboardApp,
  NcoApp,
} from './appRoots';

const mountApp = (rootId: string, App: ComponentType) => {
  const element = document.getElementById(rootId);

  if (element) {
    renderApp(element, App);
  }
};

mountApp('apps-root', WorkspaceApp);
mountApp('datafiles-root', DatafilesApp);
mountApp('onboarding-root', OnboardingApp);
mountApp('nav-ai-root', NavAI);
mountApp('recon-root', ReconApp);
mountApp('dashboard-root', DashboardApp);
mountApp('nco-root', NcoApp);
