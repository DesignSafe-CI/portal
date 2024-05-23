import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './FileListingTable.module.css';
import { Alert, Table, TableColumnType, TableProps } from 'antd';
import { useFileListing, TFileListing, useSelectedFiles } from '@client/hooks';
import { FileListingTableCheckbox } from './FileListingTableCheckbox';

type TableRef = {
  nativeElement: HTMLDivElement;
  scrollTo: (config: { index?: number; key?: React.Key; top?: number }) => void;
};

export type TFileListingColumns = (TableColumnType<TFileListing> & {
  dataIndex: keyof TFileListing;
})[];

export const FileListingTable: React.FC<
  {
    api: string;
    system?: string;
    path?: string;
    scheme?: string;
    columns: TFileListingColumns;
    filterFn?: (listing: TFileListing[]) => TFileListing[];
    disabled?: boolean;
    className?: string;
    emptyListingDisplay?: React.ReactNode;
  } & Omit<TableProps, 'columns' | 'className'>
> = ({
  api,
  system,
  path = '',
  scheme = 'private',
  filterFn,
  columns,
  disabled = false,
  className,
  emptyListingDisplay,
  ...props
}) => {
  const limit = 100;
  const [scrollElement, setScrollElement] = useState<Element | undefined>(
    undefined
  );

  /* FETCH FILE LISTINGS */
  const {
    data,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFileListing({
    api,
    system: system ?? '-',
    path: path ?? '',
    scheme,
    disabled,
    pageSize: limit,
  });

  const combinedListing = useMemo(() => {
    const cl: TFileListing[] = [];
    data?.pages.forEach((page) => cl.push(...page.listing));
    if (filterFn) {
      return filterFn(cl);
    }
    return cl;
  }, [data, filterFn]);

  /* HANDLE FILE SELECTION */
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

  /* HANDLE INFINITE SCROLL */
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
  useEffect(() => {
    // Set and clean up scroll event listener on the table ref.
    const observer = new IntersectionObserver((entries) => {
      // Fetch the next page when the final listing item enters the viewport.
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

  /* RENDER THE TABLE */
  return (
    <Table
      ref={scrollRefCallback}
      className={`${styles['listing-table-base']} ${
        (combinedListing?.length ?? 0) > 0 ? 'table--pull-spinner-bottom' : ''
      } ${className ?? ''}`}
      rowSelection={{
        type: 'checkbox',
        onChange: onSelectionChange,
        selectedRowKeys,
        renderCell: (checked, _rc, _idx, node) => (
          <FileListingTableCheckbox
            checked={checked}
            onChange={(node as React.ReactElement)?.props.onChange}
          />
        ),
      }}
      scroll={{ y: '100%', x: '500px' }} // set to undefined to disable sticky header
      columns={columns}
      rowKey={(record) => record.path}
      dataSource={combinedListing}
      pagination={false}
      loading={isLoading || isFetchingNextPage}
      locale={{
        emptyText:
          isLoading || isFetchingNextPage ? (
            <div style={{ padding: '50px' }}>&nbsp;</div>
          ) : (
            <>
              {error && (
                <Alert
                  showIcon
                  type="error"
                  description={
                    <span style={{ color: '#d9534f' }}>
                      {error.response?.data.message}
                    </span>
                  }
                />
              )}
              {!error && (
                <Alert
                  showIcon
                  type="info"
                  description={emptyListingDisplay ?? 'No files to display.'}
                />
              )}
            </>
          ),
      }}
      {...props}
    >
      placeholder
    </Table>
  );
};
