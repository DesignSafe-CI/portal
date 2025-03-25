import React, { createContext, useContext } from 'react';

type TInteractiveModalDetails = {
  show: boolean;
  interactiveSessionLink?: string;
  message?: string;
  openedBySubmit?: boolean;
  uuid?: string;
};

export type TInteractiveModalContext = [
  TInteractiveModalDetails,
  React.Dispatch<React.SetStateAction<TInteractiveModalDetails>>
];

export const InteractiveModalContext =
  createContext<TInteractiveModalContext | null>(null);

export const useInteractiveModalContext = () => {
  return useContext(InteractiveModalContext);
};
