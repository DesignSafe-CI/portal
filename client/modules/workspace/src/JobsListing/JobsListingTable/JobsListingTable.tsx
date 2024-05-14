import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './JobsListingTable.module.css';
import { Table, TableColumnType, TableProps } from 'antd';
import { useJobsListing, TJob } from '@client/hooks';

type TableRef = {
  nativeElement: HTMLDivElement;
  scrollTo: (config: { index?: number; key?: React.Key; top?: number }) => void;
};

export type TJobsListingColumns = (TableColumnType<TJob> & {
  dataIndex: keyof TJob;
})[];

export const JobsListingTable: React.FC<
  {
    columns: TJobsListingColumns;
    filterFn?: (listing: TJob[]) => TJob[];
    className?: string;
  } & Omit<TableProps, 'columns' | 'className'>
> = ({ filterFn, columns, className, ...props }) => {
  const limit = 100;
  const [scrollElement, setScrollElement] = useState<Element | undefined>(
    undefined
  );

  /* FETCH JOB LISTING */
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useJobsListing(limit);
    const jobs = data?.pages.flatMap(page => page.listing) || [];
    console.log(jobs);

  const combinedListing = useMemo(() => {
    const cl: TJob[] = [];
    data?.pages.forEach((page) => cl.push(...page.listing));
    if (filterFn) {
      return filterFn(cl);
    }
    return cl;
  }, [data, filterFn]);

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
            <div>Placeholder for empty data.</div>
          ),
      }}
      {...props}
    >
      placeholder
    </Table>
  );
};
