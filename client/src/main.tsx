import './styles.css';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import workspaceRouter from './workspace/workspaceRouter';
import datafilesRouter from './datafiles/datafilesRouter';
import onboardingRouter from './onboarding/onboardingRouter';
import { Dashboard } from '@client/dashboard';
import { ConfigProvider, ThemeConfig } from 'antd';
import { BrowserRouter } from 'react-router-dom';

console.log(Dashboard);

console.log(Dashboard);

const queryClient = new QueryClient();
const themeConfig: ThemeConfig = {
  token: {
    borderRadius: 0,
    colorPrimary: '#337ab7',
    colorError: '#d9534f',
    colorPrimaryTextHover: 'black',
    colorBorderSecondary: '#b7b7b7',
  },
  components: {
    Table: {
      cellPaddingBlock: 8,
      headerBg: 'transparent',
      headerColor: '#333333',
      headerSplitColor: 'transparent',
      rowHoverBg: 'rgb(230, 246, 255)',
      borderColor: 'rgb(215, 215, 215)',
      colorText: 'rgb(112, 112, 112)',
    },
    Layout: {
      bodyBg: 'transparent',
    },
    Steps: {
      colorPrimary: '#1cb500',
    },
    Menu: {
      itemHeight: 45,
      itemMarginInline: 0,
      itemSelectedColor: 'black',
      itemHoverBg: '#cbdded',
      itemSelectedBg: '#cbdded',
    },
    Form: {
      itemMarginBottom: 16,
      verticalLabelPadding: 0,
    },
  },
};

const appsElement = document.getElementById('apps-root');
if (appsElement) {
  const appsRoot = ReactDOM.createRoot(appsElement as HTMLElement);
  appsRoot.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig}>
          <RouterProvider router={workspaceRouter} />
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const datafilesElement = document.getElementById('datafiles-root');
if (datafilesElement) {
  const datafilesRoot = ReactDOM.createRoot(datafilesElement as HTMLElement);
  datafilesRoot.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig}>
          <RouterProvider router={datafilesRouter} />
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const onboardingElement = document.getElementById('onboarding-root');
if (onboardingElement) {
  const onboardingRoot = ReactDOM.createRoot(onboardingElement as HTMLElement);
  onboardingRoot.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig}>
          <RouterProvider router={onboardingRouter} />
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const dashboardElement = document.getElementById('dashboard-root');
if (dashboardElement) {
  const dashboardRoot = ReactDOM.createRoot(dashboardElement as HTMLElement);
  dashboardRoot.render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider theme={themeConfig}>
            <Dashboard />
          </ConfigProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
