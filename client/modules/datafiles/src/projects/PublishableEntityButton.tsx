import { useProjectDetail } from '@client/hooks';
import { Button } from 'antd';

import React from 'react';
import { ManagePublishableEntityModal } from './modals';

export const PublishableEntityButton: React.FC<{
  projectId: string;
  verb?: string;
  editonly?: boolean;
}> = ({ projectId, verb = 'Add', editonly = false }) => {
  const { data } = useProjectDetail(projectId);
  if (!data) return null;
  const { baseProject } = data;

  switch (baseProject.value.projectType) {
    case 'field_recon':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <ManagePublishableEntityModal
            editOnly={editonly}
            projectId={projectId}
            entityName="designsafe.project.field_recon.mission"
          >
            {({ onClick }) => (
              <Button
                onClick={onClick}
                type="link"
                style={{ fontWeight: 'bold' }}
              >
                {verb} Missions
              </Button>
            )}
          </ManagePublishableEntityModal>
          <ManagePublishableEntityModal
            editOnly={editonly}
            projectId={projectId}
            entityName="designsafe.project.field_recon.report"
          >
            {({ onClick }) => (
              <Button
                onClick={onClick}
                type="link"
                style={{ fontWeight: 'bold' }}
              >
                {verb} Documents
              </Button>
            )}
          </ManagePublishableEntityModal>
        </div>
      );
    case 'experimental':
      return (
        <ManagePublishableEntityModal
          editOnly={editonly}
          projectId={projectId}
          entityName="designsafe.project.experiment"
        >
          {({ onClick }) => (
            <Button
              onClick={onClick}
              type="link"
              style={{ fontWeight: 'bold' }}
            >
              {verb} Experiments
            </Button>
          )}
        </ManagePublishableEntityModal>
      );
    case 'simulation':
      return (
        <ManagePublishableEntityModal
          editOnly={editonly}
          projectId={projectId}
          entityName="designsafe.project.simulation"
        >
          {({ onClick }) => (
            <Button
              onClick={onClick}
              type="link"
              style={{ fontWeight: 'bold' }}
            >
              {verb} Simulations
            </Button>
          )}
        </ManagePublishableEntityModal>
      );
    case 'hybrid_simulation':
      return (
        <ManagePublishableEntityModal
          editOnly={editonly}
          projectId={projectId}
          entityName="designsafe.project.hybrid_simulation"
        >
          {({ onClick }) => (
            <Button
              onClick={onClick}
              type="link"
              style={{ fontWeight: 'bold' }}
            >
              {verb} Hybrid Simulations
            </Button>
          )}
        </ManagePublishableEntityModal>
      );
    default:
      return (
        <Button
          onClick={() => console.log('TODO: open modal for changing type')}
          type="link"
          style={{ fontWeight: 'bold' }}
        >
          {verb} Hybrid Simulations
        </Button>
      );
  }
};
