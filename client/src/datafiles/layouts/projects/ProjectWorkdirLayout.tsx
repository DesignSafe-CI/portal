import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChangeProjectTypeModal,
  EmptyProjectFileListing,
  FileListing,
  ProjectNavbar,
} from '@client/datafiles';
import { DatafilesBreadcrumb } from '@client/common-components';
import { useProjectDetail } from '@client/hooks';
import { Alert, Button } from 'antd';

export const ProjectWorkdirLayout: React.FC = () => {
  const { projectId, path } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!projectId) return null;
  if (!data) return <div>loading...</div>;

  const changeTypeModal = (
    <ChangeProjectTypeModal projectId={projectId}>
      {({ onClick }) => (
        <Button
          onClick={(evt) => {
            onClick(evt);
          }}
          type="link"
        >
          <strong>select a project type</strong>
        </Button>
      )}
    </ChangeProjectTypeModal>
  );

  return (
    <>
      {data.baseProject.value.projectType === 'None' ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: '12px' }}
          message="No Project Type Selected"
          description={
            <span>
              Please {changeTypeModal} in order to access data curation features
              and publish your data set.
            </span>
          }
        />
      ) : (
        <ProjectNavbar projectId={projectId} />
      )}
      <DatafilesBreadcrumb
        initialBreadcrumbs={[
          { path: `/projects/${projectId}/workdir`, title: projectId },
        ]}
        path={path ?? ''}
        baseRoute={`/projects/${projectId}/workdir`}
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
      <div style={{ paddingBottom: '32px' }}>
        {' '}
        {data && (
          <FileListing
            api="tapis"
            system={`project-${data.baseProject.uuid}`}
            path={path ?? ''}
            scroll={{ y: 500 }}
            emptyListingDisplay={<EmptyProjectFileListing />}
          />
        )}
      </div>
    </>
  );
};
