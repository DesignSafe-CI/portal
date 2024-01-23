import React, { useEffect, useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Table, TableColumnsType } from 'antd';
import { useFileListing, TFileListing } from '@client/hooks';

export const FileListing: React.FC<{
  api: string;
  system?: string;
  path?: string;
}> = ({ api, system, path }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useFileListing({
      api,
      system: system ?? '-',
      path: path ?? '',
      scheme: 'private',
      pageSize: limit,
    });

  const [totalItems, setTotalItems] = useState<number>(0);
  useEffect(() => {
    if (data?.pages.length && hasNextPage) {
      setTotalItems(data.pages.length * limit + 1);
    }
    if (!hasNextPage) {
      setTotalItems((data?.pages.length ?? 0) * limit);
    }
  }, [data, hasNextPage]);

  const columns: TableColumnsType<TFileListing> &
    { dataIndex: keyof TFileListing }[] = [
    { title: 'File Name', dataIndex: 'name', width: '50%' },
    { title: 'Size', dataIndex: 'length' },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      render: (d) => new Date(d).toLocaleString(),
    },
  ];

  const onPageChange = (page: number) => {
    const loadedPages = data?.pages.length ?? 0;
    if (page > loadedPages) {
      fetchNextPage();
    }
    setCurrentPage(page);
  };

  const combinedListing = useMemo(
    () =>
      data?.pages.reduce<TFileListing[]>(
        (acc, curr) => [...acc, ...curr.listing],
        [] as TFileListing[]
      ),
    [data?.pages]
  );

  // reset the listing if the parameters change.
  useEffect(() => {
    setCurrentPage(1);
    //setTotalItems(0);
  }, [api, system, path]);

  return (
    <Table
      style={{ height: '100%' }}
      rowSelection={{ type: 'checkbox' }}
      scroll={{ y: '100%', x: '500px' }}
      columns={columns}
      rowKey={(record) => record.path}
      dataSource={combinedListing}
      pagination={{
        pageSize: limit,
        current: currentPage,
        total: totalItems,
        showSizeChanger: false,
        onChange: onPageChange,
      }}
      loading={isLoading || isFetchingNextPage}
      locale={{
        emptyText:
          isLoading || isFetchingNextPage ? (
            <div style={{ flex: '1' }} />
          ) : (
            'No files to list.'
          ),
      }}
    >
      placeholder
    </Table>
  );
};
