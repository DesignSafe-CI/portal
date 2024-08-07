import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './FileListingTable.module.css';
import { Alert, Table, TableColumnType, TableProps } from 'antd';
import {
  useFileListing,
  TFileListing,
  useSelectedFiles,
  useDoiContext,
} from '@client/hooks';
import { FileListingTableCheckbox } from './FileListingTableCheckbox';
import parse from 'html-react-parser';

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
    noSelection?: boolean;
    searchTerm?: string | null;
    currentDisplayPath?: TFileListing | undefined;
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
  searchTerm = '',
  noSelection,
  currentDisplayPath = null,
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
    searchTerm,
    pageSize: limit,
  });

  const combinedListing = useMemo(() => {
    const cl: TFileListing[] = [];
    data?.pages.forEach((page) => cl.push(...page.listing));
    if (filterFn) {
      return filterFn(cl);
    }
    if (currentDisplayPath) {
      return [currentDisplayPath, ...cl];
    }

    return cl;
  }, [data, filterFn, currentDisplayPath]);

  /* HANDLE FILE SELECTION */
  const doi = useDoiContext();
  const { selectedFiles, setSelectedFiles } = useSelectedFiles(
    api,
    system ?? '-',
    path
  );
  const onSelectionChange = useCallback(
    (_: React.Key[], selection: TFileListing[]) => {
      setSelectedFiles(doi ? selection.map((s) => ({ ...s, doi })) : selection);
    },
    [setSelectedFiles, doi]
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
      rowSelection={
        noSelection
          ? undefined
          : {
              type: 'checkbox',
              onChange: onSelectionChange,
              selectedRowKeys,
              renderCell: (checked, _rc, _idx, node) => (
                <FileListingTableCheckbox
                  checked={checked}
                  onChange={(node as React.ReactElement)?.props.onChange}
                />
              ),
            }
      }
      scroll={{ y: '100%', x: '1000px' }} // set to undefined to disable sticky header
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
                      {parse(error.response?.data.message ?? '')}
                      {system?.includes('project') && (
                        <div>
                          <strong>
                            If this is a newly created project, it may take a
                            few minutes for file system permissions to
                            propagate.
                          </strong>
                        </div>
                      )}
                    </span>
                  }
                />
              )}
              {!error && (
                <Alert
                  showIcon
                  type="info"
                  description={
                    emptyListingDisplay ?? 'No files or folders to display.'
                  }
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
