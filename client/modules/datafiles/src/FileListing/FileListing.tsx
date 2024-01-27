import React, { useCallback, useEffect, useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Table, TableColumnsType, Button } from 'antd';
import { useFileListing, TFileListing, useSelectedFiles } from '@client/hooks';
import { NavLink } from 'react-router-dom';
import DatafilesModal from '../DatafilesModal/DatafilesModal';

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
    ellipsis: true,
    width: '50%',
    //shouldCellUpdate: (record, prevRecord) => record.name !== prevRecord.name,
    render: (data, record) =>
      record.type === 'dir' ? (
        <NavLink to={`../${encodeURIComponent(record.path)}`} replace={false}>
          {data}
        </NavLink>
      ) : (
        <DatafilesModal.Preview
          api="tapis"
          system={record.system}
          path={record.path}
          scheme="private"
        >
          <Button type="link">{data}</Button>
        </DatafilesModal.Preview>
      ),
  },
  { title: 'Size', dataIndex: 'length', render: (d) => toBytes(d) },
  {
    title: 'Last Modified',
    dataIndex: 'lastModified',
    ellipsis: true,
    render: (d) => new Date(d).toLocaleString(),
  },
];

export const FileListing: React.FC<{
  api: string;
  system?: string;
  path?: string;
  scheme?: string;
}> = ({ api, system, path = '', scheme = 'private' }) => {
  const limit = 100;
  const [scrollElement, setScrollElement] = useState<Element | undefined>(
    undefined
  );

  const { selectedFiles, setSelectedFiles } = useSelectedFiles(
    api,
    system ?? '-',
    path
  );
  const onSelectionChange = useCallback(
    (_: React.Key[], selection: TFileListing[]) => setSelectedFiles(selection),
    [setSelectedFiles]
  );
  const selectedRowKeys = useMemo(
    () => selectedFiles.map((s) => s.path),
    [selectedFiles]
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useFileListing({
      api,
      system: system ?? '-',
      path: path ?? '',
      scheme,
      pageSize: limit,
    });

  const combinedListing = useMemo(() => {
    const cl: TFileListing[] = [];
    data?.pages.forEach((page) => cl.push(...page.listing));
    return cl;
  }, [data]);

  const scrollRefCallback = useCallback(
    (node: TableRef) => {
      if (node !== null) {
        const lastRow = node.nativeElement.querySelectorAll(
          '.ant-table-row:last-child'
        )[0];
        setScrollElement(lastRow);
      }
    },
    [setScrollElement]
  );

  // Set and clean up scroll event listener on the table ref.
  // Duplicate listeners will be set if they are added directly in the ref callback.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !(isFetchingNextPage || isLoading)
        ) {
          fetchNextPage();
        }
      });
    });
    scrollElement && observer.observe(scrollElement);

    return () => {
      observer.disconnect();
    };
  }, [
    scrollElement,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  ]);

  return (
    <Table
      ref={scrollRefCallback}
      className={`${
        (combinedListing?.length ?? 0) > 0 ? 'table--pull-spinner-bottom' : ''
      }`}
      style={{ height: '100%' }}
      rowSelection={{
        type: 'checkbox',
        onChange: onSelectionChange,
        selectedRowKeys,
      }}
      scroll={{ y: '100%', x: '500px' }}
      columns={columns}
      rowKey={(record) => record.path}
      dataSource={combinedListing}
      pagination={false}
      loading={isLoading || isFetchingNextPage}
      locale={{
        emptyText:
          isLoading || isFetchingNextPage ? (
            <div style={{ display: 'none' }}></div>
          ) : (
            <div>Placeholder for empty data.</div>
          ),
      }}
    >
      placeholder
    </Table>
  );
};
