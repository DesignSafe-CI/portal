import React, { useContext } from 'react';
import { useSearchParams } from 'react-router-dom';

const doiContext = React.createContext<string | undefined>(undefined);

export function useDoiContext() {
  const doiFromContext = useContext(doiContext);
  const [searchParams] = useSearchParams();
  if (doiFromContext) {
    return doiFromContext;
  }
  const doiFromParams = searchParams.get('doi');

  if (doiFromParams) {
    return doiFromParams;
  }
  return undefined;
}

export const DoiContextProvider = doiContext.Provider;
