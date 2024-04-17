import {
  BaseProjectDetails,
  ProjectNavbar,
  ProjectPreview,
  ProjectTitleHeader,
} from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';
import { Button } from 'antd';
import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

export const ProjectPreviewLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');

  if (!projectId) return null;
  if (!data) return null;
  return (
    <div style={{ flex: 1 }}>
      <ProjectTitleHeader projectId={projectId} />
      <BaseProjectDetails projectValue={data.baseProject.value} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <ProjectNavbar projectId={projectId} />
        <NavLink to={`/projects/${projectId}/prepare-to-publish/start`}>
          <Button type="primary" className="success-button">
            Prepare to Publish
          </Button>
        </NavLink>
      </div>

      <ProjectPreview projectId={projectId} />
    </div>
  );
};
