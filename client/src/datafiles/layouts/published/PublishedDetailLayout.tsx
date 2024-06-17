import {
  BaseProjectDetails,
  DatafilesToolbar,
  DownloadDatasetModal,
  PublishedCitation,
} from '@client/datafiles';
import {
  usePublicationDetail,
  usePublicationVersions,
  useCitationMetrics,
} from '@client/hooks';
import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Layout, Spin } from 'antd';
import { Navigate, Outlet, useParams, useSearchParams } from 'react-router-dom';
import { MetricsModal } from '@client/datafiles';
import styles from './PublishedDetailLayout.module.css';

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
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dois = data?.baseProject.dois[0] ? data?.baseProject.dois[0] : '';
  const {
    data: citationMetrics,
    isLoading,
    isError,
    error,
  } = useCitationMetrics(dois);

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

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

          {isLoading && <div>Loading citation metrics...</div>}
          {isError && <div>Error fetching citation metrics</div>}
          {citationMetrics && (
            <div>
              <strong>Download Citation:</strong>
              <a
                href={`https://data.datacite.org/application/vnd.datacite.datacite+xml/${dois}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                DataCite XML
              </a>{' '}
              |
              <a
                href={`https://data.datacite.org/application/x-research-info-systems/${dois}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {' '}
                RIS
              </a>{' '}
              |
              <a
                href={`https://data.datacite.org/application/x-bibtex/${dois}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {' '}
                BibTeX
              </a>
              <div>
                <span className={styles['yellow-highlight']}>
                  {citationMetrics?.data2?.data.attributes.downloadCount ??
                    '--'}{' '}
                  Downloads
                </span>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className={styles['yellow-highlight']}>
                  {citationMetrics?.data2?.data.attributes.viewCount ?? '--'}{' '}
                  Views
                </span>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className={styles['yellow-highlight']}>
                  {citationMetrics?.data2?.data.attributes.citationCount ??
                    '--'}{' '}
                  Citations
                </span>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span
                  onClick={openModal}
                  style={{
                    cursor: 'pointer',
                    color: '#337AB7',
                    fontWeight: 'bold',
                  }}
                >
                  Details
                </span>
                <MetricsModal
                  isOpen={isModalVisible}
                  handleCancel={closeModal}
                  eventMetricsData={citationMetrics?.data1}
                  usageMetricsData={citationMetrics?.data2}
                />
              </div>
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
