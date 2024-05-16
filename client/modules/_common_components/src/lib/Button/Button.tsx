import React from 'react';
import { Button, ButtonProps, ConfigProvider, ThemeConfig } from 'antd';
import './Button.module.css';

const secondaryTheme: ThemeConfig = {
  components: {
    Button: {
      defaultActiveBg: '#f4f4f4',
      defaultActiveColor: '#222',
      defaultActiveBorderColor: '#026',
      defaultBg: '#f4f4f4',
      defaultBorderColor: '#222222',
      defaultColor: '#222222',
      defaultHoverBg: '#aac7ff',
    },
  },
};

export const SecondaryButton: React.FC<ButtonProps> = (props) => {
  return (
    <ConfigProvider theme={secondaryTheme}>
      <Button
        style={{
          fontFamily:
            '-apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
        {...props}
      />
    </ConfigProvider>
  );
};

const primaryButtonTheme: ThemeConfig = {
  components: {
    Button: {
      defaultActiveBg: '#039',
      defaultActiveColor: '#039',
      defaultActiveBorderColor: '#026',
      defaultBg: '#fff',
      defaultBorderColor: '#707070',
      defaultColor: '#707070',
      defaultHoverBg: '#026',
      defaultHoverBorderColor: '#026',
      defaultHoverColor: '#fff',
    },
  },
};

export const PrimaryButton: React.FC<ButtonProps> = (props) => {
  return (
    <ConfigProvider theme={primaryButtonTheme}>
      <Button
        type="primary"
        style={{
          fontFamily:
            '-apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
        {...props}
      />
    </ConfigProvider>
  );
};
