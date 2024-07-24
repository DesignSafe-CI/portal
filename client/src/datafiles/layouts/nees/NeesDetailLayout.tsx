import React from 'react';
import { Button, Form, Input, Layout } from 'antd';
import { useParams } from 'react-router-dom';
import { DatafilesToolbar, NeesDetails } from '@client/datafiles';

import { useSearchParams } from 'react-router-dom';

const NeesFileSearchbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onSubmit = (queryString: string) => {
    const newSearchParams = searchParams;
    if (queryString) {
      newSearchParams.set('q', queryString);
    } else {
      newSearchParams.delete('q');
    }

    setSearchParams(newSearchParams);
  };
  return (
    <Form
      onFinish={(data) => onSubmit(data.query)}
      style={{ display: 'inline-flex' }}
    >
      <Form.Item name="query" style={{ marginBottom: 0 }}>
        <Input placeholder="Find in this Project" style={{ width: '300px' }} />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const NeesDetailLayout: React.FC = () => {
  const { neesid } = useParams();
  if (!neesid) return null;
  const nees = neesid?.split('.')[0];

  return (
    <Layout>
      <div style={{ flex: '1 0 0 ', height: '100%' }}>
        <DatafilesToolbar searchInput={<NeesFileSearchbar />} />
        <NeesDetails neesId={nees} />
      </div>
    </Layout>
  );
};
