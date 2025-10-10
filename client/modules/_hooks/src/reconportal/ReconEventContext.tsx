import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type ReconPortalEvent } from '@client/hooks';

type ReconEventContextType = {
  selectedReconPortalEventIdentifier: string | null;
  setSelectedReconPortalEventIdentifier: (title: string | null) => void;
  filteredReconPortalEvents: ReconPortalEvent[];
  setFilteredReconPortalEvents: (events: ReconPortalEvent[]) => void;
};

const ReconEventContext = createContext<ReconEventContextType | undefined>(
  undefined
);

/**
 * Converts a ReconPortalEvent into a normalized, URL-safe identifier string.
 */
export const getReconPortalEventIdentifier = (
  event: ReconPortalEvent
): string => {
  const title = event.title;
  return `${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

export const ReconEventProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredReconPortalEvents, setFilteredReconPortalEvents] = useState<
    ReconPortalEvent[]
  >([]);

  const selectedReconPortalEventIdentifier = searchParams.get('eventId');

  // Track in Google Analytics whenever eventId changes
  useEffect(() => {
    if (selectedReconPortalEventIdentifier && window.gtag) {
      // Maps URL param 'eventId' → GA parameter name 'recon_event_id'
      window.gtag('event', 'page_view', {
        recon_event_id: selectedReconPortalEventIdentifier,
      });
    }
  }, [selectedReconPortalEventIdentifier]);

  const setSelectedReconPortalEventIdentifier = (
    eventIdentifier: string | null
  ) => {
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
        selectedReconPortalEventIdentifier,
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
