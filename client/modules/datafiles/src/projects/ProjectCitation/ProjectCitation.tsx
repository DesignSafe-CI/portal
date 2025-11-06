import React, { useState } from 'react';
import { Popover } from 'antd';
import {
  useDataciteMetrics,
  useProjectDetail,
  usePublicationDetail,
  useClarivateMetrics,
} from '@client/hooks';
import { MetricsModal } from '../modals/MetricsModal';
import styles from './ProjectCitation.module.css';

export const ProjectCitation: React.FC<{
  projectId: string;
  entityUuid: string;
}> = ({ projectId, entityUuid }) => {
  const { data } = useProjectDetail(projectId);
  const entityDetails = data?.entities.find((e) => e.uuid === entityUuid);
  const authors =
    entityDetails?.value.authors?.filter(
      (a) => a.fname && a.lname && a.authorship !== false
    ) ?? [];
  if (!data || !entityDetails) return null;
  return (
    <div>
      {authors
        .map((author, idx) =>
          idx === 0
            ? `${author.lname}, ${author.fname[0]}${
                authors.length > 1 ? '.' : ''
              }`
            : `${author.fname[0]}. ${author.lname}`
        )
        .join(', ')}
      .{' '}
      {!['other', 'software'].includes(data.baseProject.value.projectType) && (
        <span>"{entityDetails.value.title}", in </span>
      )}
      <i>{data.baseProject.value.title}</i>. DesignSafe-CI. (DOI will appear
      after publication)
    </div>
  );
};

export const PublishedCitation: React.FC<{
  projectId: string;
  entityUuid: string;
  version?: number;
}> = ({ projectId, entityUuid, version = 1 }) => {
  const { data } = usePublicationDetail(projectId);

  const entityDetails = (data?.tree.children ?? []).find(
    (child) => child.uuid === entityUuid && child.version === version
  );

  const authors =
    entityDetails?.value.authors?.filter((a) => a.authorship !== false) ?? [];
  if (!data || !entityDetails) return null;

  const doi =
    entityDetails.value.dois && entityDetails.value.dois.length > 0
      ? entityDetails.value.dois[0]
      : '';

  return (
    <div>
      {authors
        .map((author, idx) =>
          idx === 0
            ? `${author.lname}, ${author.fname[0]}${
                authors.length > 1 ? '.' : ''
              }`
            : `${author.fname[0]}. ${author.lname}`
        )
        .join(', ')}{' '}
      ({new Date(entityDetails.publicationDate).getFullYear()}).{' '}
      {!['other', 'software'].includes(data.baseProject.projectType) && (
        <span>"{entityDetails.value.title}", in </span>
      )}
      <i>{data.baseProject.title}</i>
      {(version ?? 1) > 1 && <span> [Version {version}]</span>}. DesignSafe-CI.{' '}
      {doi && (
        <a
          href={`https://doi.org/${doi}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          https://doi.org/{doi}
        </a>
      )}
      {/* DesignSafe-CI. ({entityDetails.value.dois && entityDetails.value.dois[0]}) */}
    </div>
  );
};

export const DownloadCitation: React.FC<{
  projectId: string;
  entityUuid: string;
  preview?: boolean;
}> = ({ projectId, entityUuid, preview }) => {
  const {
    data,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
  } = usePublicationDetail(projectId);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const entityDetails = (data?.tree.children ?? []).find(
    (child) => child.uuid === entityUuid
  );

  const doi =
    entityDetails?.value.dois && entityDetails.value.dois.length > 0
      ? entityDetails.value.dois[0]
      : '';

  const { data: dataciteMetrics } = useDataciteMetrics(doi, !preview);
  const {
    data: clarivateMetrics,
    isLoading: isClarivateLoading,
    isError: isClarivateError,
  } = useClarivateMetrics(doi, !preview);

  if (isClarivateError) {
    console.error('Error loading Clarivate metrics for DOI:', doi);
  }

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  if (isProjectLoading) return <div>Loading project details...</div>;
  if (isProjectError)
    return <div>Error fetching project details: {projectError.message}</div>;
  if (!entityDetails) return null;

  return (
    <div>
      {dataciteMetrics && !preview && (
        <div>
          <strong>Download Citation: </strong>
          <a
            href={`https://data.datacite.org/application/vnd.datacite.datacite+xml/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            DataCite XML
          </a>{' '}
          |
          <a
            href={`https://data.datacite.org/application/x-research-info-systems/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {' '}
            RIS
          </a>{' '}
          |
          <a
            href={`https://data.datacite.org/application/x-bibtex/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {' '}
            BibTeX
          </a>
          <div>
            <span className={styles['yellow-highlight']}>
              <Popover
                overlayStyle={{ maxWidth: '400px' }}
                title="Unique Requests"
                content="User sessions in which one or more files are downloaded or previewed."
              >
                {dataciteMetrics?.data.attributes.downloadCount ?? '--'} Unique
                Requests
              </Popover>
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className={styles['yellow-highlight']}>
              <Popover
                overlayStyle={{ maxWidth: '400px' }}
                title="Unique Investigations"
                content="User sessions in which any project or publication metadata is viewed,
                          or one or more files is downloaded or previewed"
              >
                {dataciteMetrics?.data.attributes.viewCount ?? '--'} Unique
                Investigations
              </Popover>
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className={styles['yellow-highlight']}>
              {isClarivateLoading
                ? 'Loading...'
                : isClarivateError ||
                  typeof clarivateMetrics?.citationCount !== 'number'
                ? '0'
                : clarivateMetrics.citationCount}{' '}
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
              doi={doi}
            />
          </div>
        </div>
      )}
    </div>
  );
};
