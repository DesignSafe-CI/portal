import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type ReconPortalEvents } from '@client/hooks';

type SelectedReconPortalEventContextType = {
  selectedReconPortalEventIdentfier: string | null;
  setSelectedReconPortalEventIdentifier: (title: string | null) => void;
};

const SelectedReconPortalEventContext = createContext<SelectedReconPortalEventContextType | undefined>(undefined);

export const getReconPortalEventIdentifier = (event: ReconPortalEvents): string => {
  const title = event.title || event.properties?.name || '';
  return `${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

export const SelectedReconPortalEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReconPortalEventIdentfier, setSelectedReconPortalEventIdentifierState] = useState<string | null>(null);

  useEffect(() => {
    const event = searchParams.get('event');
    setSelectedReconPortalEventIdentifier(event);
  }, [searchParams]);

  const setSelectedReconPortalEventIdentifier = (eventIdentifier: string | null) => {
    if (eventIdentifier) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('eventId', eventIdentifier);
        return newParams;
      });
      setSelectedReconPortalEventIdentifierState(eventIdentifier);
    } else {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('eventId');
        return newParams;
      });
      setSelectedReconPortalEventIdentifierState(null);
    }
  };

  return (
    <SelectedReconPortalEventContext.Provider value={{ selectedReconPortalEventIdentfier, setSelectedReconPortalEventIdentifier }}>
      {children}
    </SelectedReconPortalEventContext.Provider>
  );
};

export const useSelectedReconPortalEvent = () => {
  const context = useContext(SelectedReconPortalEventContext);
  if (!context) throw new Error('useReconPortalSelectedEvent must be used within SelectedReconPortalEventProvider');
  return context;
};
