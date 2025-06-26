import React from 'react';
import dayjs from 'dayjs';
import { ReconPortalEvents, useGetReconPortalEventTypes } from '@client/hooks';
import { Tag, Typography, Space } from 'antd';
import styles from './LeafletMap.module.css';
import { getReconEventColor } from './leafletUtil';

const { Title, Text } = Typography;

interface ReconPortalPopuprops {
  dataset: ReconPortalEvents;
}

export const ReconPortalPopup: React.FC<ReconPortalPopuprops> = ({
  dataset,
}) => {
  const eventType = useGetReconPortalEventTypes();
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
    </Typography>
  );
};
