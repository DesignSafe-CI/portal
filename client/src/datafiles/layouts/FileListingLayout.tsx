import {
  BaseFileListingBreadcrumb,
  DatafilesToolbar,
  FileListing,
} from '@client/datafiles';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import { Button, Form, Input, Layout } from 'antd';
import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import styles from './layout.module.css';

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
        <Input placeholder="Search Data Files" style={{ width: '250px' }} />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const FileListingLayout: React.FC = () => {
  const { api, path, scheme, system } = useFileListingRouteParams();
  const { user } = useAuthenticatedUser();

  const isUserHomeSystem = [
    'designsafe.storage.default',
    'designsafe.storage.frontera.work',
  ].includes(system);

  const redirectHome =
    user?.username && !path && api === 'tapis' && isUserHomeSystem;
  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <DatafilesToolbar searchInput={<FileListingSearchBar />} />
      {true && (
        <BaseFileListingBreadcrumb
          api={api}
          system={system}
          path={path}
          itemRender={(obj) => {
            return (
              <Link className="breadcrumb-link" to={obj.path ?? '/'}>
                {obj.title}
              </Link>
            );
          }}
        />
      )}
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          {redirectHome && (
            <Navigate
              to={`../${encodeURIComponent('/' + user.username)}`}
              replace
            />
          )}
          <FileListing api={api} system={system} path={path} scheme={scheme} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
//
