import React from 'react';
import { render as _render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();
const TestWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </BrowserRouter>
);

export const render = function (
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  return _render(<TestWrapper>{ui}</TestWrapper>, options);
};
