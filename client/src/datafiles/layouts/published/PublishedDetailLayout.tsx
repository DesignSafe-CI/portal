import {
  BaseProjectDetails,
  DatafilesToolbar,
  DownloadDatasetModal,
  PublishedCitation,
  DownloadCitation,
} from '@client/datafiles';
import {
  TBaseProjectValue,
  usePublicationDetail,
  usePublicationVersions,
} from '@client/hooks';
import React, { useEffect } from 'react';
import { Alert, Button, Form, Input, Layout, Spin } from 'antd';
import { Navigate, Outlet, useParams, useSearchParams } from 'react-router-dom';

const FileListingSearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onSubmit = (queryString: string) => {
    const newSearchParams = searchParams;
    if (queryString) {
      newSearchParams.set('q', queryString);
    } else {
      newSearchParams.delete('q');
    }

    setSearchParams(newSearchParams);
  };
  return (
    <Form
      onFinish={(data) => onSubmit(data.query)}
      style={{ display: 'inline-flex' }}
    >
      <Form.Item name="query" style={{ marginBottom: 0 }}>
        <Input
          placeholder="Search within Publication"
          style={{ width: '250px' }}
        />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const PublishedDetailLayout: React.FC = () => {
  const { projectId, path } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isError } = usePublicationDetail(projectId ?? '');
  const { allVersions } = usePublicationVersions(projectId ?? '');
  const version = (projectId ?? '').split('v')[1];

  // match /PRJ-XXXX--VY and capture the version, Y
  const pathRegex = /--V([0-9]*)/;
  const versionFromPath = (path ?? '').match(pathRegex)?.[1] || undefined;

  const selectedVersion =
    version ||
    searchParams.get('version') ||
    versionFromPath ||
    Math.max(...allVersions).toString();

  useEffect(() => {
    if (version) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('version', version);
      setSearchParams(newSearchParams);
    }
  }, [version, searchParams, setSearchParams]);

  // List files in the project root for metrics/reporting purposes.
  /*
  useEffect(() => {
    if (!data) return;

    !['other', 'software'].includes(data?.baseProject.projectType) &&
      apiClient.get(
        `/api/datafiles/tapis/public/listing/designsafe.storage.published/${projectId}${
          selectedVersion && parseInt(selectedVersion) > 1
            ? `v${selectedVersion}`
            : ''
        }`
      );
  }, [data, selectedVersion, searchParams, projectId]);
  */

  if (isError) {
    return (
      <Layout>
        <Alert
          showIcon
          type="error"
          style={{ marginTop: '16px', color: '#d9534f', textAlign: 'center' }}
          description={'There was an error fetching this publication'}
        />
      </Layout>
    );
  }

  if (!projectId || !data)
    return (
      <Layout style={{ position: 'relative' }}>
        <Spin style={{ position: 'absolute', top: '50%', left: '50%' }} />
      </Layout>
    );

  if (searchParams.get('q') && !path) {
    return (
      <Navigate
        to={`/public/designsafe.storage.published/${projectId}/%2Fpublished-data%2F${projectId}?q=${searchParams.get(
          'q'
        )}`}
        replace
      />
    );
  }

  let baseProjectValue = data.baseProject;

  if (['other', 'software'].includes(data.baseProject.projectType)) {
    const versionValue = data.tree.children.find(
      (c) => (c.version ?? 1) === parseFloat(selectedVersion)
    )?.value;
    if (versionValue) {
      baseProjectValue = versionValue as unknown as TBaseProjectValue;
    }
  }

  const publicationDate = data.tree.children.find(
    (c) => c.value.projectId === projectId
  )?.publicationDate;

  return (
    <Layout style={{ paddingBottom: '100px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <DatafilesToolbar searchInput={<FileListingSearchBar />} />
      </div>
      <div
        style={{
          marginTop: '20px',
          marginBottom: '20px',
          fontSize: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <span>
          <strong>{data.baseProject.projectId}</strong> |{' '}
          {data.baseProject.title}
        </span>
        <DownloadDatasetModal
          projectId={projectId}
          license={data.baseProject.license}
        />
      </div>

      {['other', 'software'].includes(data.baseProject.projectType) && (
        <>
          {data.baseProject.tombstone && (
            <Alert
              showIcon
              type="warning"
              message={
                <strong>
                  The following dataset is no longer published in DesignSafe.
                </strong>
              }
              description={
                <div>
                  The Dataset with DOI:{' '}
                  <a href={`https://doi.org/${data.baseProject.dois[0]}`}>
                    {data.baseProject.dois[0]}
                  </a>{' '}
                  does not comply with one or more{' '}
                  <a href="https://www.designsafe-ci.org/user-guide/curating/policies/">
                    DesignSafe policies
                  </a>{' '}
                  and has been removed. The metadata is still available.
                </div>
              }
            />
          )}
          <section
            style={{
              backgroundColor: '#eef9fc',
              padding: '10px 20px',
              margin: '10px 0px',
            }}
          >
            <strong>Cite This Data:</strong>

            <PublishedCitation
              projectId={projectId}
              entityUuid={data.tree.children[0].uuid}
              version={parseInt(selectedVersion)}
            />
            <br />
            <div>
              <DownloadCitation
                projectId={projectId}
                entityUuid={data.tree.children[0].uuid}
              />
            </div>
          </section>
        </>
      )}
      <BaseProjectDetails
        projectValue={baseProjectValue}
        publicationDate={publicationDate}
        versions={allVersions}
        isPublished
      />
      <Outlet />
    </Layout>
  );
};
