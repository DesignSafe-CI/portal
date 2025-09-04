import React from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { OpenTopoDataset } from '@client/hooks';
import { Typography, Space } from 'antd';
import styles from './OpenTopoPopupContent.module.css';

const { Title, Text, Link } = Typography;

interface OpenTopoPopupContentProps {
  dataset: OpenTopoDataset;
}

export const OpenTopoPopupContent: React.FC<OpenTopoPopupContentProps> = ({
  dataset,
}) => {
  const title = dataset.name;
  const startDate = dayjs(dataset.temporalCoverage.split('/')[0]).format(
    'MM/DD/YYYY'
  );
  const endDate = dayjs(dataset.temporalCoverage.split('/')[1]).format(
    'MM/DD/YYYY'
  );
  const doiUrl = dataset.url;
  const product = dataset.fileFormat;
  return (
    <Typography className={styles.popupContainer}>
      <Title level={5} className={styles.title}>
        {title}
      </Title>

      <Space direction="vertical" size={2}>
        <div className={styles.fieldContainer}>
          <Text className={styles.compactText}>Date of Survey</Text>
          <Text strong className={styles.compactText}>
            {startDate} – {endDate}
          </Text>
        </div>

        <div className={styles.fieldContainer}>
          <Text className={styles.compactText}>Data Source</Text>
          <Text strong className={styles.compactText}>OpenTopography</Text>
        </div>

        <div className={styles.fieldContainer}>
          <Text className={styles.compactText}>Products Available</Text>
          <Text strong className={styles.compactText}>{product}</Text>
        </div>

        <div className={styles.fieldContainer}>
          <Text className={styles.compactText}>DOI</Text>
          <Link href={doiUrl} target="_blank" rel="noopener noreferrer" className={styles.compactText}>
            {doiUrl}
            <span className={styles.externalIcon}>
              <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />
            </span>
          </Link>
        </div>
      </Space>
    </Typography>
  );
};
