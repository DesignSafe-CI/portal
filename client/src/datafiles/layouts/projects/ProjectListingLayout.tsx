import { DatafilesToolbar, ProjectListing } from '@client/datafiles';
import { Button, Form, Input, Layout } from 'antd';
import React from 'react';

import { useSearchParams } from 'react-router-dom';

const ProjectListingSearchBar = () => {
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
        <Input placeholder="Find in My Projects" style={{ width: '300px' }} />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const ProjectListingLayout: React.FC = () => {
  return (
    <Layout>
      <DatafilesToolbar searchInput={<ProjectListingSearchBar />} />
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <ProjectListing />
      </div>
    </Layout>
  );
};
