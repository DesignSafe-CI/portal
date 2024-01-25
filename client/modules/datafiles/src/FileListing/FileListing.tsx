import React, { useCallback, useEffect, useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Table, TableColumnsType } from 'antd';
import { useFileListing, TFileListing } from '@client/hooks';
import { NavLink } from 'react-router-dom';

type TableRef = {
  nativeElement: HTMLDivElement;
  scrollTo: (config: { index?: number; key?: React.Key; top?: number }) => void;
};

function toBytes(bytes?: number) {
  if (bytes === 0) return '0 bytes';
  if (!bytes) return '-';
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  const orderOfMagnitude = Math.floor(Math.log(bytes) / Math.log(1024));
  const precision = orderOfMagnitude === 0 ? 0 : 1;
  const bytesInUnits = bytes / Math.pow(1024, orderOfMagnitude);
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
  const [scrollElement, setScrollElement] = useState<Element | undefined>(
    undefined
  );

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

  const scrollEvent = useCallback(
    (evt: Event) => {
      const target = evt?.target as HTMLElement;
      const reachedBottom =
        target.scrollTop === target.scrollHeight - target.offsetHeight;
      if (reachedBottom && hasNextPage && !(isLoading || isFetchingNextPage)) {
        fetchNextPage();
      }
    },
    [hasNextPage, isLoading, isFetchingNextPage, fetchNextPage]
  );

  const scrollRefCallback = useCallback(
    (node: TableRef) => {
      if (node !== null) {
        const tableBody =
          node.nativeElement.getElementsByClassName('ant-table-body')[0];
        setScrollElement(tableBody);
      }
    },
    [setScrollElement]
  );

  // Set and clean up scroll event listener on the table ref.
  // Duplicate listeners will be set if they are added directly in the ref callback.
  useEffect(() => {
    scrollElement && scrollElement.addEventListener('scroll', scrollEvent);
    return () => {
      scrollElement && scrollElement.removeEventListener('scroll', scrollEvent);
    };
  }, [scrollElement, scrollEvent]);

  return (
    <Table
      ref={scrollRefCallback}
      className={`${
        (combinedListing?.length ?? 0) > 0 ? 'table--pull-spinner-bottom' : ''
      }`}
      style={{ height: '100%' }}
      rowSelection={{ type: 'checkbox' }}
      scroll={{ y: '100%', x: '500px' }}
      columns={columns}
      rowKey={(record) => record.path}
      dataSource={combinedListing}
      pagination={false}
      loading={isLoading || isFetchingNextPage}
      locale={{
        emptyText:
          isLoading || isFetchingNextPage ? (
            <div style={{ display: 'none' }}>sup</div>
          ) : (
            <div style={{ display: 'none' }}>sup</div>
          ),
      }}
    >
      placeholder
    </Table>
  );
};
