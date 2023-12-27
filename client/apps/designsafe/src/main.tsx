import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';

const appsElement = document.getElementById('apps-root');
if (appsElement) {
  const appsRoot = ReactDOM.createRoot(appsElement as HTMLElement);
  appsRoot.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
