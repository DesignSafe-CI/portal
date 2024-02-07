import React from 'react';
import { Outlet } from 'react-router-dom';
import { BaseProjectForm } from '@client/datafiles';

export const ProjectDetailLayout: React.FC = () => {
  return (
    <div>
      Placeholder for the project detail layout (handles workdir and curation).{' '}
      <BaseProjectForm />
      <Outlet />
    </div>
  );
};
