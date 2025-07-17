import React from 'react';
import dayjs from 'dayjs';
import { ReconPortalEvents } from '@client/hooks';
import { Tag, Typography, Space } from 'antd';
import { getReconEventColor } from '../utils';

const { Title, Text } = Typography;

interface ReconPortalPopuprops {
  dataset: ReconPortalEvents;
}

export const ReconPortalPopup: React.FC<ReconPortalPopuprops> = ({
  dataset,
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

      <Space direction="vertical" size={6}>
        <div>
          <Text>{eventDate}</Text>
        </div>
        <Tag
          color={getReconEventColor(dataset)}
          style={{
            fontWeight: 600,
            fontSize: 14,
            textTransform: 'capitalize',
          }}
        >
          {dataset.event_type || dataset.properties?.host || ''}
        </Tag>

        <div>
          <Text>{location}</Text>
        </div>
      </Space>
    </Typography>
  );
};
