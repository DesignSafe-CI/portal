import React from 'react';

export type TModalChildren = (props: {
  onClick: React.MouseEventHandler<HTMLElement>;
}) => React.ReactElement;

export const JobsDetailModal = () => <span>Jobs Modal Root</span>;
