import {
  ManageCategoryModal,
  ManagePublishableEntityModal,
  ProjectCurationFileListing,
  ProjectNavbar,
  RelateDataModal,
} from '@client/datafiles';
import { DatafilesBreadcrumb } from '@client/common-components';
import { useProjectDetail } from '@client/hooks';
import { Button } from 'antd';

import React from 'react';
import { Link, useParams } from 'react-router-dom';

const PublishableEntityButton: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
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
            projectId={projectId}
            entityName="designsafe.project.field_recon.mission"
          >
            {({ onClick }) => (
              <Button
                onClick={onClick}
                type="link"
                style={{ fontWeight: 'bold' }}
              >
                Add Missions
              </Button>
            )}
          </ManagePublishableEntityModal>
          <ManagePublishableEntityModal
            projectId={projectId}
            entityName="designsafe.project.field_recon.report"
          >
            {({ onClick }) => (
              <Button
                onClick={onClick}
                type="link"
                style={{ fontWeight: 'bold' }}
              >
                Add Documents
              </Button>
            )}
          </ManagePublishableEntityModal>
        </div>
      );
    case 'experimental':
      return (
        <ManagePublishableEntityModal
          projectId={projectId}
          entityName="designsafe.project.experiment"
        >
          {({ onClick }) => (
            <Button
              onClick={onClick}
              type="link"
              style={{ fontWeight: 'bold' }}
            >
              Add Experiments
            </Button>
          )}
        </ManagePublishableEntityModal>
      );
    case 'simulation':
      return (
        <ManagePublishableEntityModal
          projectId={projectId}
          entityName="designsafe.project.simulation"
        >
          {({ onClick }) => (
            <Button
              onClick={onClick}
              type="link"
              style={{ fontWeight: 'bold' }}
            >
              Add Simulations
            </Button>
          )}
        </ManagePublishableEntityModal>
      );
    case 'hybrid_simulation':
      return (
        <ManagePublishableEntityModal
          projectId={projectId}
          entityName="designsafe.project.hybrid_simulation"
        >
          {({ onClick }) => (
            <Button
              onClick={onClick}
              type="link"
              style={{ fontWeight: 'bold' }}
            >
              Add Hybrid Simulations
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
          Add Hybrid Simulations
        </Button>
      );
  }
};

export const ProjectCurationLayout: React.FC = () => {
  const { projectId, path } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!projectId) return null;
  if (!data) return <div>loading...</div>;
  return (
    <div style={{ paddingBottom: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <ProjectNavbar projectId={projectId} />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontWeight: 'bold',
          }}
        >
          1&nbsp;| <PublishableEntityButton projectId={projectId} /> 2&nbsp;|
          <ManageCategoryModal projectId={projectId}>
            {({ onClick }) => (
              <Button
                onClick={onClick}
                type="link"
                style={{ fontWeight: 'bold' }}
              >
                Add Categories
              </Button>
            )}
          </ManageCategoryModal>{' '}
          3&nbsp;|
          <RelateDataModal projectId={projectId}>
            {({ onClick }) => (
              <Button
                onClick={onClick}
                type="link"
                style={{ fontWeight: 'bold' }}
              >
                Relate Data
              </Button>
            )}
          </RelateDataModal>
        </span>
      </div>
      <DatafilesBreadcrumb
        initialBreadcrumbs={[
          { path: `/projects/${projectId}/curation`, title: projectId },
        ]}
        path={path ?? ''}
        baseRoute={`/projects/${projectId}/curation`}
        systemRootAlias={data.baseProject.value.projectId}
        systemRoot=""
        itemRender={(obj) => {
          return (
            <Link className="breadcrumb-link" to={obj.path ?? '/'}>
              {obj.title}
            </Link>
          );
        }}
      />
      <ProjectCurationFileListing projectId={projectId} path={path ?? ''} />
    </div>
  );
};
