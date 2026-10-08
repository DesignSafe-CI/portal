import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  DownloadCitation,
  FileListing,
  PublishedCitation,
} from '@client/datafiles';
import { DatafilesBreadcrumb } from '@client/common-components';
import { DoiContextProvider, usePublicationDetail } from '@client/hooks';

export const PublishedFileListingLayout: React.FC = () => {
  const { projectId, path } = useParams();
  const [searchParams] = useSearchParams();
  const { data } = usePublicationDetail(projectId ?? '');
  //const systemRoot =
  //  selectedVersion && selectedVersion > 1
  //    ? `/${projectId}v${selectedVersion}`
  //    : `/${projectId}`;
  const systemRoot = `/published-data/${projectId}`;
  if (!projectId) return null;

  const doi = searchParams.get('doi');
  const search = searchParams.toString();
  const citationEntity = data?.tree.children
    .filter((child) => child.value.dois?.includes(doi ?? ''))
    .sort((a, b) => (b.version ?? 1) - (a.version ?? 1))[0];
  const hasProjectLevelCitation = ['other', 'software'].includes(
    data?.baseProject.projectType ?? ''
  );

  return (
    <>
      {citationEntity && !hasProjectLevelCitation && (
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
            entityUuid={citationEntity.uuid}
            version={citationEntity.version ?? 1}
          />
          <br />
          <DownloadCitation
            projectId={projectId}
            entityUuid={citationEntity.uuid}
          />
        </section>
      )}
      <DatafilesBreadcrumb
        initialBreadcrumbs={[
          {
            title: projectId,
            path: `/public/designsafe.storage.published/${projectId}`,
          },
        ]}
        path={path ?? ''}
        baseRoute={`/public/designsafe.storage.published/${projectId}`}
        systemRootAlias={projectId}
        systemRoot={systemRoot}
        itemRender={(obj) => {
          return (
            <Link
              className="breadcrumb-link"
              to={`${obj.path ?? '/'}${search ? `?${search}` : ''}`}
            >
              {obj.title}
            </Link>
          );
        }}
      />
      <div style={{ paddingBottom: '32px' }}>
        {' '}
        <DoiContextProvider value={doi ?? undefined}>
          <FileListing
            api="tapis"
            system="designsafe.storage.published"
            scheme="public"
            path={path ?? ''}
            emptyListingDisplay={
              data?.baseProject.projectType === 'software'
                ? 'File Unavailable'
                : undefined
            }
            fileTags={data?.fileTags}
            scroll={{ y: 500 }}
          />
        </DoiContextProvider>
      </div>
    </>
  );
};
