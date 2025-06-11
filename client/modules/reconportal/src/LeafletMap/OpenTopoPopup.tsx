import React from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { OpenTopoDataset } from '@client/hooks';
import { Typography, Space } from 'antd';


const { Title, Text, Link } = Typography;


interface OpenTopoPopupProps {
  dataset: OpenTopoDataset;
}

export const OpenTopoPopup: React.FC<OpenTopoPopupProps> = ({ dataset }) => {
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
    <Typography>
      <Title level={5} style={{ marginBottom: 6 }}>
        {title}
      </Title>

      <Space direction="vertical" size={6}>
        <div>
          <Text>Date of Survey</Text>
          <br />
          <Text strong>
            {startDate} – {endDate}
          </Text>
        </div>

        <div>
          <Text>Data Source</Text>
          <br />
          <Text strong>OpenTopography</Text>
        </div>

        <div>
          <Text>Products Available</Text>
          <br />
          <Text strong>{product}</Text>
        </div>

        <div>
          <Text>DOI</Text>
          <br />
          <Link href={doiUrl} target="_blank" rel="noopener noreferrer">
            {doiUrl}
            <span style={{ marginLeft: 4 }}>
                <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />
            </span>
          </Link>
        </div>
      </Space>
    </Typography>
  );
};
