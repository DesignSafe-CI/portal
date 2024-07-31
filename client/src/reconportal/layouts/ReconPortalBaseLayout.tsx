import React from 'react';
import { Layout } from 'antd';
import {
  ReconPortal,
  ReconPortalHeader,
} from '@client/reconportal';
import { usePrefetchGetEventTypes, EventTypeResponse, useGetEvents, useGetEventTypes, useGetOpenTopo } from '@client/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { error } from 'console';

const ReconPortalBaseLayout: React.FC = () => {
  const { data: events, isLoading: eventsLoading, error: eventsError } = useGetEvents();
  const { data: eventTypes, isLoading: eventTypesLoading, error: eventTypesError } = useGetEventTypes();
  const {data: openTopoData, isLoading: openTopoLoading, error: openTopoError} = useGetOpenTopo();

  if (openTopoLoading ) {
    return <div>Loading...</div>;
  }

  return (
      <Layout>
        <ReconPortalHeader/>
        <ReconPortal/>
      </Layout>
  );
};

export default ReconPortalBaseLayout;
