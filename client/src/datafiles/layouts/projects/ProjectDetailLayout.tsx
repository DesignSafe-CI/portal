import React from 'react';
import { Outlet } from 'react-router-dom';

export const ProjectDetailLayout: React.FC = () => {
  return (
    <div>
      Placeholder for the project detail layout (handles workdir and curation).{' '}
      <Outlet />
    </div>
  );
};
