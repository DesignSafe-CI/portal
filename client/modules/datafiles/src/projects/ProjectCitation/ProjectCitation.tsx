import React, { useState } from 'react';
import {
  useCitationMetrics,
  useProjectDetail,
  usePublicationDetail,
} from '@client/hooks';
// import { MetricsModal } from '../modals/MetricsModal';
import styles from './ProjectCitation.module.css';

export const ProjectCitation: React.FC<{
  projectId: string;
  entityUuid: string;
}> = ({ projectId, entityUuid }) => {
  const { data } = useProjectDetail(projectId);
  const entityDetails = data?.entities.find((e) => e.uuid === entityUuid);

  if (!data || !entityDetails) return null;
  return (
    <div>
      {(entityDetails.value.authors ?? [])
        .map((author, idx) =>
          idx === 0
            ? `${author.lname}, ${author.fname[0]}.`
            : `${author.fname[0]}. ${author.lname}`
        )
        .join(', ')}
      . "{entityDetails.value.title}", in <i>{data.baseProject.value.title}</i>.
      DesignSafe-CI. (DOI will appear after publication)
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
  if (!data || !entityDetails) return null;

  const doi =
    entityDetails.value.dois && entityDetails.value.dois.length > 0
      ? entityDetails.value.dois[0]
      : '';

  return (
    <div>
      {(entityDetails.value.authors ?? [])
        .map((author, idx) =>
          idx === 0
            ? `${author.lname}, ${author.fname[0]}.`
            : `${author.fname[0]}. ${author.lname}`
        )
        .join(', ')}{' '}
      ({new Date(entityDetails.publicationDate).getFullYear()}). "
      {entityDetails.value.title}", in <i>{data.baseProject.title}</i>.
      DesignSafe-CI.{' '}
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
}> = ({ projectId, entityUuid }) => {
  const {
    data,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = usePublicationDetail(projectId);
  const entityDetails = (data?.tree.children ?? []).find(
    (child) => child.uuid === entityUuid
  );

  if (!data || !entityDetails) {
    if (isProjectLoading) return <div>Loading project details...</div>;
    if (isProjectError) return <div>Error fetching project details</div>;
    return null;
  }

  const doi =
    entityDetails?.value.dois && entityDetails.value.dois.length > 0
      ? entityDetails.value.dois[0]
      : '';

  const { data: citationMetrics, isLoading, isError } = useCitationMetrics(doi);

  return (
    <div>
      {isLoading && <div>Loading citation metrics...</div>}
      {isError && <div>Error fetching citation metrics</div>}
      {citationMetrics && (
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
              {citationMetrics?.data2?.data.attributes.downloadCount ?? '--'}{' '}
              Downloads
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className={styles['yellow-highlight']}>
              {citationMetrics?.data2?.data.attributes.viewCount ?? '--'} Views
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className={styles['yellow-highlight']}>
              {citationMetrics?.data2?.data.attributes.citationCount ?? '--'}{' '}
              Citations
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            {/* <span
              onClick={openModal}
              style={{ cursor: 'pointer', color: '#337AB7', fontWeight: 'bold' }}
            >
              Details
            </span> */}
            {/* <MetricsModal isOpen={isModalVisible} handleCancel={closeModal} data1={citationMetrics?.data1} /> */}
          </div>
        </div>
      )}
    </div>
  );
};
