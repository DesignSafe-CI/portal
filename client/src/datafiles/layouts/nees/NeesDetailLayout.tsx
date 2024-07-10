import React from 'react';
import { Button, Form, Input, Layout, Spin } from 'antd';
import { Navigate, Outlet, useParams, useSearchParams } from 'react-router-dom';
import {
  NeesDetails,
  DatafilesToolbar
} from '@client/datafiles';

const FileListingSearchBar = () => {
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
          placeholder="Search within Publication"
          style={{ width: '250px' }}
        />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const NeesDetailLayout: React.FC = () => {
  const { neesid, path } = useParams();
  if (!neesid) return null;
  const nees = neesid?.split('.')[0];

  const [searchParams, setSearchParams] = useSearchParams();

  if (searchParams.get('q') && !path) {
    return (
      <Navigate
        to={`/public/nees.public/${neesid}/%2F${neesid}?q=${searchParams.get(
          'q'
        )}`}
        replace
      />
    );
  }

  return (
    <Layout>
      <div style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <DatafilesToolbar searchInput={<FileListingSearchBar />} />
      </div>
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <NeesDetails neesId={nees} />
      </div>
    </Layout>
  );
};
