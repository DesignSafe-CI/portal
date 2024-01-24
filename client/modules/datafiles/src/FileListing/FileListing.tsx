import React, { useEffect, useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Table, TableColumnsType } from 'antd';
import { useFileListing, TFileListing } from '@client/hooks';
import { NavLink } from 'react-router-dom';

function toBytes(bytes?: number, precision: number = 1) {
  if (bytes === 0) return '0 bytes';
  if (!bytes) return '-';
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  const orderOfMagnitude = Math.floor(Math.log(bytes) / Math.log(1000));
  const bytesInUnits = bytes / Math.pow(1000, orderOfMagnitude);
  return `${bytesInUnits.toFixed(precision)} ${units[orderOfMagnitude]}`;
}

const columns: TableColumnsType<TFileListing> &
  { dataIndex: keyof TFileListing }[] = [
  {
    title: 'File Name',
    dataIndex: 'name',
    width: '50%',
    render: (data, record) =>
      record.type === 'dir' ? (
        <NavLink
          to={`/tapis/designsafe.storage.default/${encodeURIComponent(
            record.path.slice(1)
          )}`}
          replace={false}
        >
          {data}
        </NavLink>
      ) : (
        data
      ),
  },
  { title: 'Size', dataIndex: 'length', render: (d) => toBytes(d) },
  {
    title: 'Last Modified',
    dataIndex: 'lastModified',
    render: (d) => new Date(d).toLocaleString(),
  },
];

export const FileListing: React.FC<{
  api: string;
  system?: string;
  path?: string;
  scheme?: string;
}> = ({ api, system, path = '', scheme = 'private' }) => {
  const limit = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useFileListing({
      api,
      system: system ?? '-',
      path: path ?? '',
      scheme,
      pageSize: limit,
    });

  const combinedListing = useMemo(
    () =>
      data?.pages.reduce<TFileListing[]>(
        (acc, curr) => [...acc, ...curr.listing],
        [] as TFileListing[]
      ),
    [data?.pages]
  );

  const onPageChange = (page: number) => {
    const loadedPages = data?.pages.length ?? 0;
    if (page > loadedPages) {
      fetchNextPage();
    }
    setCurrentPage(page);
  };

  useEffect(() => {
    if (data?.pages.length && hasNextPage) {
      setTotalItems(data.pages.length * limit + 1);
    }
    if (!hasNextPage) {
      setTotalItems((data?.pages.length ?? 0) * limit);
    }
  }, [data, hasNextPage]);

  // reset the listing if the parameters change.
  useEffect(() => {
    setCurrentPage(1);
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
        style: { marginTop: 'auto', paddingTop: '16px' },
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
