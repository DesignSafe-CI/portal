import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, TableColumnType, TableProps } from 'antd';
import useWebSocket from 'react-use-websocket';
import {
  useJobsListing,
  TTapisJob,
  TJobStatusNotification,
  useGetNotifications,
} from '@client/hooks';
import styles from './JobsListingTable.module.css';

type TableRef = {
  nativeElement: HTMLDivElement;
  scrollTo: (config: { index?: number; key?: React.Key; top?: number }) => void;
};

export type TJobsListingColumns = (TableColumnType<TTapisJob> & {
  dataIndex: keyof TTapisJob;
})[];

export const JobsListingTable: React.FC<
  {
    columns: TJobsListingColumns;
    filterFn?: (listing: TTapisJob[]) => TTapisJob[];
    className?: string;
  } & Omit<TableProps, 'columns' | 'className'>
> = ({ filterFn, columns, className, ...props }) => {
  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );
  const { data: unreadNotifs } = useGetNotifications({
    eventTypes: ['interactive_session_ready', 'job'],
    read: false,
    markRead: false,
  });
  const limit = 100;
  const [scrollElement, setScrollElement] = useState<Element | undefined>(
    undefined
  );

  /* FETCH JOB LISTING */
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useJobsListing(limit);
  // const jobs = data?.pages.flatMap((page) => page.listing) || [];

  const combinedListing = useMemo(() => {
    const cl: TTapisJob[] = [];
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

  const lastNotificationJobUUID = lastMessage
    ? (JSON.parse(lastMessage.data) as TJobStatusNotification).extra.uuid
    : '';
  const unreadJobUUIDs = unreadNotifs?.notifs.map((x) => x.extra.uuid) ?? [];

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
      rowClassName={(record: TTapisJob) => {
        if (
          unreadJobUUIDs.concat(lastNotificationJobUUID).includes(record.uuid)
        ) {
          return styles['highlighted-row'];
        }
        return '';
      }}
      locale={{
        emptyText:
          isLoading || isFetchingNextPage ? (
            <div style={{ padding: '50px' }}>&nbsp;</div>
          ) : (
            <div>No recent jobs.</div>
          ),
      }}
      {...props}
    >
      placeholder
    </Table>
  );
};
