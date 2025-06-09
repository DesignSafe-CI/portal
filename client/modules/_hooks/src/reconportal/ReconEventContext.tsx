import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type ReconPortalEvents } from '@client/hooks';

type ReconEventContextType = {
  selectedReconPortalEventIdentfier: string | null;
  setSelectedReconPortalEventIdentifier: (title: string | null) => void;
  filteredReconPortalEvents: ReconPortalEvents[];
  setFilteredReconPortalEvents: (events: ReconPortalEvents[]) => void;
};

const ReconEventContext = createContext<ReconEventContextType | undefined>(undefined)


/**
 * Converts a ReconPortalEvent into a normalized, URL-safe identifier string.
 */
export const getReconPortalEventIdentifier = (
  event: ReconPortalEvents
): string => {
  const title = event.title || event.properties?.name || '';
  return `${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

export const ReconEventProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredReconPortalEvents, setFilteredReconPortalEvents] = useState<ReconPortalEvents[]>([]);

  const selectedReconPortalEventIdentfier = searchParams.get('eventId');

  const setSelectedReconPortalEventIdentifier = (eventIdentifier: string | null) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (eventIdentifier) {
        newParams.set('eventId', eventIdentifier);
      } else {
        newParams.delete('eventId');
      }
      return newParams;
    });
  };

  return (
    <ReconEventContext.Provider
      value={{
        selectedReconPortalEventIdentfier,
        setSelectedReconPortalEventIdentifier,
        filteredReconPortalEvents,
        setFilteredReconPortalEvents,
      }}
    >
      {children}
    </ReconEventContext.Provider>
  );
};


/**
 * Hook to access and update the selected Recon Portal event identifier
 * and the filtered event list (which is managed in context).
 * 
 * Must be used within a `ReconEventProvider`.
 *
 * @throws If used outside the provider
 */
export const useReconEventContext = (): ReconEventContextType => {
  const context = useContext(ReconEventContext);
  if (!context) {
    throw new Error(
      'useReconEventContext must be used within a ReconEventProvider'
    );
  }
  return context;
};