import React from 'react';
import { Flex, Layout, LayoutProps, Image } from 'antd';
import styles from './ReconSidePanel.module.css';

export const ReconSidePanel: React.FC<LayoutProps> = ({
  children,
  ...props
}) => {
  const { Content } = Layout;

  return (
    <Layout {...props}>
      <Flex align="center" className={styles.header} gap={20}>
        <Image src="/static/scripts/rapid/images/logoicon.png" />
        <h1>Recon Portal</h1>
      </Flex>

      <Content>{children}</Content>
    </Layout>
  );
};
