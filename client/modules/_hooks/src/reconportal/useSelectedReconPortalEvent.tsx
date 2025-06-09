import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type ReconPortalEvents } from '@client/hooks';

type SelectedReconPortalEventContextType = {
  selectedReconPortalEventIdentfier: string | null;
  setSelectedReconPortalEventIdentifier: (title: string | null) => void;
};

const SelectedReconPortalEventContext = createContext<
  SelectedReconPortalEventContextType | undefined
>(undefined);

export const getReconPortalEventIdentifier = (
  event: ReconPortalEvents
): string => {
  const title = event.title || event.properties?.name || '';
  return `${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

export const SelectedReconPortalEventProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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
    <SelectedReconPortalEventContext.Provider
      value={{
        selectedReconPortalEventIdentfier,
        setSelectedReconPortalEventIdentifier,
      }}
    >
      {children}
    </SelectedReconPortalEventContext.Provider>
  );
};

export const useSelectedReconPortalEvent = (): SelectedReconPortalEventContextType => {
  const context = useContext(SelectedReconPortalEventContext);
  if (!context) {
    throw new Error(
      'useSelectedReconPortalEvent must be used within a SelectedReconPortalEventProvider'
    );
  }
  return context;
};