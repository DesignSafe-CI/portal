import { Spin } from 'antd';
import React from 'react';
import styles from './Spinner.module.css';

const Spinner: React.FC = () => <Spin className={styles.spinner} />;

export default Spinner;
