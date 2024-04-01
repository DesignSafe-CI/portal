import React from 'react';
import { NavLink } from 'react-router-dom';

export const JobStatusNav: React.FC = () => {
  return (
    <div>
      <NavLink to={`history`}>Job Status</NavLink>
    </div>
  );
};
