import {
  BaseProjectDetails,
  DatafilesToolbar,
  PublishedCitation,
} from '@client/datafiles';
import { usePublicationDetail, usePublicationVersions } from '@client/hooks';
import React, { useEffect } from 'react';
import { Button, Form, Input } from 'antd';
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

  const version = (projectId ?? '').split('v')[1];
  useEffect(() => {
    if (version) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('version', version);
      setSearchParams(newSearchParams);
    }
  }, [version, searchParams, setSearchParams]);

  if (!projectId || !data) return null;

  if (searchParams.get('q') && !path) {
    return (
      <Navigate
        to={`/public/designsafe.storage.published/${projectId}/%2F${projectId}?q=${searchParams.get(
          'q'
        )}`}
      />
    );
  }

  const publicationDate = data.tree.children.find(
    (c) => c.value.projectId === projectId
  )?.publicationDate;

  return (
    <div style={{ width: '100%', paddingBottom: '100px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <DatafilesToolbar searchInput={<FileListingSearchBar />} />
      </div>
      <div
        className="prj-head-title"
        style={{ marginTop: '20px', marginBottom: '20px' }}
      >
        <strong>{data.baseProject.projectId}</strong>&nbsp;|&nbsp;
        {data.baseProject.title}
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
        </section>
      )}
      <BaseProjectDetails
        projectValue={data?.baseProject}
        publicationDate={publicationDate}
        versions={allVersions}
        isPublished
      />
      <Outlet />
    </div>
  );
};
