import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import { NeesDetails } from '@client/datafiles';

export const NeesDetailLayout: React.FC = () => {
  const { neesid } = useParams();
  if (!neesid) return null;
  const nees = neesid?.split('.')[0];

  return (
    <Layout>
      <div>Placeholder for the NEES buttons.</div>
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <NeesDetails neesId={nees} />
      </div>
    </Layout>
  );
};
