import { Button, ButtonProps, ConfigProvider, ThemeConfig } from 'antd';

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
