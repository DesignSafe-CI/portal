import './styles.css';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import workspaceRouter from './workspace/workspaceRouter';
import datafilesRouter from './datafiles/datafilesRouter';
import { ConfigProvider, ThemeConfig } from 'antd';

const queryClient = new QueryClient();
const themeConfig: ThemeConfig = {
  token: {
    borderRadius: 0,
    colorPrimary: '#337ab7',
    colorPrimaryTextHover: 'black',
  },
  components: {
    Table: {
      cellPaddingBlock: 8,
      headerBg: 'transparent',
      headerColor: '#333333',
      rowHoverBg: 'rgb(230, 246, 255)',
      borderColor: 'rgb(215, 215, 215)',
      colorText: 'rgb(112, 112, 112)',
    },
    Layout: {
      bodyBg: 'transparent',
    },
    Menu: {
      itemHeight: 60,
      itemMarginInline: 0,
      itemSelectedColor: 'black',
      itemHoverBg: 'rgba(96, 57, 204, 0.25)',
      itemSelectedBg: 'rgba(96, 57, 204, 0.25)',
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
