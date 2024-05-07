import React from 'react';

export const sensitiveDataContext = React.createContext<{
  sensitiveDataOption?: number;
  setSensitiveDataOption?: (newState: number) => void;
}>({});
