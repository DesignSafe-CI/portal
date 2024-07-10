import React from 'react';
import { Layout, Form, Button, Input } from 'antd';
import { Navigate, Outlet, useParams, useSearchParams } from 'react-router-dom';
import { NeesListing, DatafilesToolbar } from '@client/datafiles';


const NeesListingSearchBar = () => {
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
          style={{ width: '250px' }}
        />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const NEESListingLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  if (searchParams.get('q')) {
    return (
      <Navigate
        to={`/public/nees.public/?q=${searchParams.get(
          'q'
        )}`}
        replace
      />
    );
  }

  return (
    <Layout>
      <div style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <DatafilesToolbar searchInput={<NeesListingSearchBar />} />
      </div>
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <NeesListing />
      </div>
    </Layout>
  );
};
