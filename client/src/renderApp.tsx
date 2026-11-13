import '@ant-design/v5-patch-for-react-19';
import { StrictMode, Suspense, type ComponentType } from 'react';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, type ThemeConfig } from 'antd';

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
      siderBg: 'transparent',
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

export const renderApp = (element: HTMLElement, App: ComponentType) => {
  ReactDOM.createRoot(element).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig}>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};
