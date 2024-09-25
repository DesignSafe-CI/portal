import React, { createContext, useContext } from 'react';

export const InteractiveModalContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | null
>(null);

export const useInteractiveModalContext = () => {
  return useContext(InteractiveModalContext);
};
