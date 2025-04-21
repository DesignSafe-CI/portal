import React from 'react';
import styles from './ReconPortal.module.css';
import { Layout } from 'antd';
import { LeafletMap } from '../LeafletMap/';

const { Content } = Layout;
export const ReconPortal: React.FC = () => {
  return (
    <Layout className={styles.root}>
      <Content><LeafletMap/></Content>
    </Layout>
  );
};
