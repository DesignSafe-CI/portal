import React, { useState, useEffect } from 'react';
import {
  useDataciteMetrics,
  useProjectDetail,
  usePublicationDetail,
} from '@client/hooks';
import { MetricsModal } from '../modals/MetricsModal';
import styles from './ProjectCitation.module.css';

const useClarivateMetrics = (doi: string, shouldFetch = true) => {
  const [data, setData] = useState<{ citationCount: number | null }>({
    citationCount: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!doi || !shouldFetch) return;

    const fetchClarivateMetrics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/publications/clarivate/?doi=${doi}`);
        const result = await response.json();

        if (response.ok) {
          setData({ citationCount: result.citation_count ?? 0 });
        } else {
          setIsError(true);
        }
      } catch (error) {
        setIsError(true);
      }
      setIsLoading(false);
    };

    fetchClarivateMetrics();
  }, [doi, shouldFetch]);

  return { data, isLoading, isError };
};

export default useClarivateMetrics;

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
      {data.baseProject.value.projectType !== 'other' && (
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
      {data.baseProject.projectType !== 'other' && (
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
  const { data: clarivateMetrics, isLoading: isClarivateLoading, isError: isClarivateError } = useClarivateMetrics(doi, !preview);

console.log('dataciteMetrics', dataciteMetrics);
console.log('clarivateMetrics', clarivateMetrics);

  if (isClarivateError) {
    console.error("Error loading Clarivate metrics for DOI:", doi);
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
              {dataciteMetrics?.data.attributes.downloadCount ?? '--'} Downloads
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className={styles['yellow-highlight']}>
              {dataciteMetrics?.data.attributes.viewCount ?? '--'} Views
            </span>
            &nbsp;&nbsp;&nbsp;&nbsp;
             <span className={styles['yellow-highlight']}>
              {isClarivateLoading
                ? ''
                : isClarivateError
                ? '--'
                : clarivateMetrics?.citationCount ?? '--'}{' '}
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
