import {
  ProjectCurationFileListing,
  ProjectNavbar,
  RelateDataModal,
} from '@client/datafiles';
import { Button } from 'antd';

import React from 'react';
import { useParams } from 'react-router-dom';

export const ProjectCurationLayout: React.FC = () => {
  const { projectId, path } = useParams();
  if (!projectId) return null;
  return (
    <div style={{ paddingBottom: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <ProjectNavbar projectId={projectId} />
        <span>
          1. Add Experiments | 2. Add Categories | 3.{' '}
          <RelateDataModal projectId={projectId}>
            {({ onClick }) => (
              <Button onClick={onClick} type="link">
                Relate Data
              </Button>
            )}
          </RelateDataModal>
        </span>
      </div>
      <ProjectCurationFileListing projectId={projectId} path={path ?? ''} />
    </div>
  );
};
