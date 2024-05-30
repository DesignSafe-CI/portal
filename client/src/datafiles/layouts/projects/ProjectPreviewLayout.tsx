import {
  BaseProjectDetails,
  ProjectBestPracticesModal,
  ProjectNavbar,
  ProjectPreview,
  ProjectTitleHeader,
} from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';
import { Alert } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';

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
        <ProjectBestPracticesModal projectId={projectId} />
      </div>

      <ProjectPreview projectId={projectId} />
      {data.baseProject.value.projectType === 'other' && (
        <Alert
          showIcon
          description={
            <span>
              You will select the data to be published in the next step.
            </span>
          }
        />
      )}
    </div>
  );
};
