import React from 'react';
import { Button, Form, Input, Layout } from 'antd';
import { DatafilesToolbar, NeesListing } from '@client/datafiles';
import { useSearchParams } from 'react-router-dom';

const NeesListingSearchbar = () => {
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
        <Input
          placeholder="Find in Published (NEES)"
          style={{ width: '300px' }}
        />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const NEESListingLayout: React.FC = () => {
  return (
    <Layout>
      <DatafilesToolbar searchInput={<NeesListingSearchbar />} />
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <NeesListing />
      </div>
    </Layout>
  );
};
