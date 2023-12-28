import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import workspaceRouter from './workspace/router';

const queryClient = new QueryClient();

const appsElement = document.getElementById('apps-root');
if (appsElement) {
  const appsRoot = ReactDOM.createRoot(appsElement as HTMLElement);
  appsRoot.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={workspaceRouter} />
      </QueryClientProvider>
    </StrictMode>
  );
}
