import { useProjectDetail } from '@client/hooks';
import React from 'react';
import { BaseProjectUpdateModal, ChangeProjectTypeModal } from '../modals';
import { Button } from 'antd';

export const ProjectTitleHeader: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data } = useProjectDetail(projectId);
  if (!data) return null;

  const { baseProject } = data;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <h3>
        {baseProject.value.projectId} |{' '}
        <span style={{ fontWeight: 'normal' }}>{baseProject.value.title}</span>
      </h3>
      {data.baseProject.value.projectType === 'None' ? (
        <ChangeProjectTypeModal projectId={projectId}>
          {({ onClick }) => (
            <Button
              onClick={(evt) => {
                onClick(evt);
              }}
              type="link"
            >
              <strong>Select Project Type</strong>
            </Button>
          )}
        </ChangeProjectTypeModal>
      ) : (
        <BaseProjectUpdateModal projectId={projectId}>
          {({ onClick }) => (
            <Button onClick={onClick} type="link">
              <strong>Edit Project</strong>
            </Button>
          )}
        </BaseProjectUpdateModal>
      )}
    </div>
  );
};
