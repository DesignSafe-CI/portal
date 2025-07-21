import React from 'react';
import dayjs from 'dayjs';
import { ReconPortalEvents } from '@client/hooks';
import { Tag, Typography, Space } from 'antd';
import styles from './ReconPortalPopUp.module.css';
import { getReconEventColor } from '../utils';

const { Title, Text } = Typography;

interface ReconPortalPopuprops {
  dataset: ReconPortalEvents;
  showDetails?: boolean;
}

export const ReconPortalPopup: React.FC<ReconPortalPopuprops> = ({
  dataset,
  showDetails = true,
}) => {
  const title = dataset.title;
  const eventDate = dayjs(dataset.event_date.split('/')[0]).format(
    'MM/DD/YYYY'
  );
  const location = dataset.location_description;
  return (
    <Typography>
      <Title level={5} style={{ marginBottom: 6 }}>
        {title}
      </Title>

      {showDetails && (
        <Space direction="vertical" size={6}>
          <div>
            <Text>{eventDate}</Text>
          </div>
          <Tag
            color={getReconEventColor(dataset)}
            className={styles.eventDetailTag}
          >
            {dataset.event_type}
          </Tag>

          <div>
            <Text>{location}</Text>
          </div>
        </Space>
      )}
    </Typography>
  );
};
