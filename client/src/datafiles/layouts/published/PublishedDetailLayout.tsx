import {
  BaseProjectDetails,
  DatafilesToolbar,
  DownloadDatasetModal,
  PublishedCitation,
  DownloadCitation,
} from '@client/datafiles';
import {
  usePublicationDetail,
  usePublicationVersions,
  useCitationMetrics,
} from '@client/hooks';
import React, { useEffect } from 'react';
import { Button, Form, Input, Layout, Spin } from 'antd';
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
  const { data } = usePublicationDetail(projectId ?? '');
  const { allVersions } = usePublicationVersions(projectId ?? '');

  const dois = data?.baseProject.dois[0] ? data?.baseProject.dois[0] : '';
  const { data: citationMetrics } = useCitationMetrics(dois);

  const version = (projectId ?? '').split('v')[1];
  useEffect(() => {
    if (version) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('version', version);
      setSearchParams(newSearchParams);
    }
  }, [version, searchParams, setSearchParams]);

  if (!projectId || !data)
    return (
      <Layout style={{ position: 'relative' }}>
        <Spin style={{ position: 'absolute', top: '50%', left: '50%' }} />
      </Layout>
    );

  if (searchParams.get('q') && !path) {
    return (
      <Navigate
        to={`/public/designsafe.storage.published/${projectId}/%2F${projectId}?q=${searchParams.get(
          'q'
        )}`}
        replace
      />
    );
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

      {data.baseProject.projectType === 'other' && (
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
          />
          <br />
          {citationMetrics && (
            <div>
              <DownloadCitation
                projectId={projectId}
                entityUuid={data.tree.children[0].uuid}
              />
            </div>
          )}
        </section>
      )}
      <BaseProjectDetails
        projectValue={data?.baseProject}
        publicationDate={publicationDate}
        versions={allVersions}
        isPublished
      />
      <Outlet />
    </Layout>
  );
};
