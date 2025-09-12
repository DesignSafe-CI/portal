import React from 'react';
import dayjs from 'dayjs';
import { ReconPortalEvent } from '@client/hooks';
import { Tag, Typography, Space } from 'antd';
import styles from './ReconPortalPopUpContent.module.css';
import { getReconEventColor } from '../utils';

const { Title, Text } = Typography;

interface ReconPortalPopuprops {
  event: ReconPortalEvent;
  showDetails?: boolean;
}

export const ReconPortalPopupContent: React.FC<ReconPortalPopuprops> = ({
  event,
  showDetails = true,
}) => {
  const title = event.title;
  const eventDate = dayjs(event.event_date.split('/')[0]).format('MM/DD/YYYY');
  const location = event.location_description;
  return (
    <Typography>
      <Title level={5} style={{ marginBottom: 6 }}>
        {title}
      </Title>
      {!showDetails && (
        <span>
          (Event details, including reconnaissance data, appear in the left
          panel)
        </span>
      )}

      {showDetails && (
        <Space direction="vertical" size={6}>
          <div>
            <Text>{eventDate}</Text>
          </div>
          <Tag
            color={getReconEventColor(event)}
            className={styles.eventDetailTag}
          >
            {event.event_type}
          </Tag>

          <div>
            <Text>{location}</Text>
          </div>
        </Space>
      )}
    </Typography>
  );
};
