import React from 'react';
import { Button, ButtonProps, ConfigProvider, ThemeConfig } from 'antd';
import styles from './Button.module.css';

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
      <Button className={styles.root} {...props} />
    </ConfigProvider>
  );
};

const primaryButtonTheme: ThemeConfig = {
  components: {
    Button: {
      defaultActiveBg: '#74B566',
      defaultActiveColor: '#fff',
      defaultActiveBorderColor: '#74B566',
      defaultBg: '#74B566',
      defaultBorderColor: '#74B566',
      defaultColor: '#fff',
      defaultHoverBg: '#74b566d9',
      defaultHoverBorderColor: '#74b566d9',
      defaultHoverColor: '#fff',
    },
  },
};

export const PrimaryButton: React.FC<ButtonProps> = (props) => {
  return (
    <ConfigProvider theme={primaryButtonTheme}>
      <Button className={styles.root} {...props} />
    </ConfigProvider>
  );
};
