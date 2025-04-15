import React from 'react';
import styles from './ReconPortal.module.css';
import { Layout, Flex } from 'antd';

const { Content } = Layout;
export const ReconPortal: React.FC = () => {
  return (
    <Layout className={styles.root}>
      <Content>Leaflet + Left-Sided Nav Placeholder</Content>
    </Layout>
  );
};
