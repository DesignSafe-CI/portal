import {
  BaseProjectDetails,
  ProjectBestPracticesModal,
  ProjectGithubFileListing,
  ProjectNavbar,
  ProjectPreview,
  ProjectTitleHeader,
} from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';
import { Alert } from 'antd';
import React from 'react';
import { Link, useParams } from 'react-router-dom';

export const ProjectPreviewLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');

  if (!projectId) return null;
  if (!data) return null;

  const disabledNoRepo =
    data.baseProject.value.projectType === 'software' &&
    !data.baseProject.value.githubUrl;
  return (
    <div style={{ flex: 1, paddingBottom: '30px' }}>
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
        <ProjectBestPracticesModal
          projectId={projectId}
          disabled={disabledNoRepo || data.isPublishing}
        />
      </div>

      {data.isPublishing && (
        <Alert
          type="warning"
          showIcon
          description={
            <div>
              A dataset from this project is currently being published. Until
              this process is completed, published datasets within this project
              cannot be added or modified.
            </div>
          }
          style={{ marginBottom: '10px' }}
        />
      )}

      <ProjectPreview projectId={projectId} />

      {data.baseProject.value.projectType === 'software' &&
        (data.baseProject.value.githubUrl ? (
          <ProjectGithubFileListing projectId={projectId} />
        ) : (
          <Alert
            type="error"
            showIcon
            description={
              <div>
                Please go to the{' '}
                <Link to={`/projects/${projectId}/curation`}>
                  Curation Directory
                </Link>{' '}
                to associate a GitHub repository with your project before you
                publish.
              </div>
            }
            message="No Repository Selected"
          />
        ))}

      {data.baseProject.value.projectType === 'other' && !data.isPublishing && (
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
