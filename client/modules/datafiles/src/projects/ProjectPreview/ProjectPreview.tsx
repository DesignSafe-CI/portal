import React, { useEffect, useMemo, useState } from 'react';
import {
  TPreviewTreeData,
  useCitationMetrics,
  useProjectPreview,
  usePublicationDetail,
  usePublicationVersions,
  useSelectedFiles,
} from '@client/hooks';
import { Button, Collapse } from 'antd';
import styles from './ProjectPreview.module.css';
import { DISPLAY_NAMES, PROJECT_COLORS } from '../constants';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import {
  ProjectCitation,
  PublishedCitation,
} from '../ProjectCitation/ProjectCitation';
import {
  FileListingTable,
  TFileListingColumns,
} from '../../FileListing/FileListingTable/FileListingTable';
import { NavLink } from 'react-router-dom';
import { PublishedEntityDetails } from '../PublishedEntityDetails';

const columns: TFileListingColumns = [
  {
    title: 'File Name',
    dataIndex: 'name',
    ellipsis: true,
    render: (data, record) =>
      record.type === 'dir' ? (
        <NavLink
          className="listing-nav-link"
          to={`./${encodeURIComponent(record.path)}`}
          replace={false}
        >
          <i role="none" style={{ color: '#333333' }} className="fa fa-folder">
            &nbsp;&nbsp;
          </i>
          {data}
        </NavLink>
      ) : (
        <Button type="link">
          <i role="none" style={{ color: '#333333' }} className="fa fa-file-o">
            &nbsp;&nbsp;
          </i>
          {data}
        </Button>
      ),
  },
];

function RecursiveTree({
  treeData,
  defaultOpen = false,
}: {
  treeData: TPreviewTreeData;
  defaultOpen?: boolean;
}) {
  return (
    <li className={`${styles['tree-li']}`}>
      <ProjectCollapse
        entityName={treeData.name}
        title={treeData.value.title}
        defaultOpen={defaultOpen}
      >
        <span>{treeData.value.description}</span>
        <FileListingTable
          api="tapis"
          system="designsafe.storage.published"
          path={treeData.uuid}
          scheme="public"
          columns={columns}
          dataSource={treeData.value.fileObjs}
          disabled
        />
      </ProjectCollapse>
      <ul className={styles['tree-ul']}>
        {(treeData.children ?? []).map((child) => (
          <div key={child.id} style={{ display: 'inline-flex', flex: 1 }}>
            <span
              style={{
                fontSize: '20px',
                marginLeft: '5px',
                marginRight: '7px',
                marginTop: '3px',
                color: PROJECT_COLORS[treeData.name]['outline'],
              }}
            >
              <i role="none" className="fa fa-level-up fa-rotate-90"></i>
            </span>
            <RecursiveTree treeData={child} defaultOpen={defaultOpen} />
          </div>
        ))}
      </ul>
    </li>
  );
}

export const PublishedEntityDisplay: React.FC<{
  projectId: string;
  preview?: boolean;
  license?: string;
  treeData: TPreviewTreeData;
  defaultOpen?: boolean;
  defaultOpenChildren?: boolean;
}> = ({
  projectId,
  preview,
  treeData,
  license,
  defaultOpen = false,
  defaultOpenChildren = false,
}) => {
  const [active, setActive] = useState<boolean>(defaultOpen);
  const sortedChildren = useMemo(
    () => [...(treeData.children ?? [])].sort((a, b) => a.order - b.order),
    [treeData]
  );

  const dois = treeData.value.dois && treeData.value.dois.length > 0 ? treeData.value.dois[0] : '';
  const { data: citationMetrics, isLoading, isError, error } = useCitationMetrics(dois);

  useEffect(() => {
    console.log("isLoading:", isLoading);
    console.log("isError:", isError);
    if (isError) {
      console.error("Error fetching citation metrics:", error);
    }
  }, [isLoading, isError, error]);  
  
  return (
    <section>
      <div
        className={styles['pub-show-button']}
        style={{ padding: '16px 12px', width: '100%' }}
      >
        {DISPLAY_NAMES[treeData.name]} | <strong>{treeData.value.title}</strong>
      </div>
      <article
        style={{
          backgroundColor: '#eef9fc',
          borderLeft: '1px solid #d9d9d9',
          borderRight: '1px solid #d9d9d9',
          padding: '10px 20px',
        }}
      >
        <strong>Cite This Data:</strong>
        {preview ? (
          <ProjectCitation projectId={projectId} entityUuid={treeData.uuid} />
        ) : (
          <PublishedCitation projectId={projectId} entityUuid={treeData.uuid} />
        )}
        {/* Display citation metrics */}
        {isLoading && <div>Loading citation metrics...</div>}
        {isError && <div>Error fetching citation metrics</div>}
        {citationMetrics && (
          <div>
            <strong>Download Citation:</strong>
            <div>
              <span className={styles["yellow-highlight"]}>
                {citationMetrics?.data?.attributes.downloadCount ?? '--'} Downloads
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles["yellow-highlight"]}>
                {citationMetrics?.data?.attributes.viewCount ?? '--'} Views
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles["yellow-highlight"]}>
                {citationMetrics?.data?.attributes.citationCount ?? '--'} Citations
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span>
                Details
              </span>
            </div>
          </div>
        )}

      </article>
      <Collapse
        expandIcon={() => null}
        activeKey={active ? '0' : undefined}
        onChange={(key) => {
          setActive(key[0] === '0');
        }}
        items={[
          {
            label: (
              <div style={{ textAlign: 'center' }}>
                {' '}
                {active ? (
                  <span style={{ width: '100%' }}>
                    <i className="curation-chevron-expanded" />
                    &nbsp;Hide Data
                  </span>
                ) : (
                  <span>
                    <i className="curation-chevron-collapsed" />
                    &nbsp;View Data
                  </span>
                )}
              </div>
            ),
            children: (
              <>
                <PublishedEntityDetails
                  entityValue={treeData.value}
                  license={license}
                  publicationDate={treeData.publicationDate}
                />
                {(treeData.value.fileObjs?.length ?? 0) > 0 && (
                  <FileListingTable
                    api="tapis"
                    system="designsafe.storage.published"
                    path={treeData.uuid}
                    scheme="public"
                    columns={columns}
                    dataSource={treeData.value.fileObjs}
                    disabled
                  />
                )}
                {(sortedChildren ?? []).map((child) => (
                  <RecursiveTree
                    treeData={child}
                    key={child.id}
                    defaultOpen={defaultOpenChildren}
                  />
                ))}
              </>
            ),
          },
        ]}
      />
    </section>
  );
};

export const ProjectPreview: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data } = useProjectPreview(projectId ?? '');
  const { children } = data?.tree ?? {};

  const sortedChildren = useMemo(
    () => [...(children ?? [])].sort((a, b) => a.order - b.order),
    [children]
  );
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {sortedChildren
        .filter((child) => child.name !== 'designsafe.project')
        .map((child, idx) => (
          <PublishedEntityDisplay
            preview
            projectId={projectId}
            treeData={child}
            defaultOpen={idx === 0}
            key={child.id}
          />
        ))}
    </div>
  );
};

export const PublicationView: React.FC<{
  projectId: string;
  version?: number;
}> = ({ projectId, version = 1 }) => {
  const { data } = usePublicationDetail(projectId ?? '');
  const { unsetSelections } = useSelectedFiles('tapis', '', '');
  // Unset file selections when project ID changes to prevent them carrying over on nav.
  useEffect(() => unsetSelections(), [projectId, unsetSelections]);
  const { children } = data?.tree ?? {};

  const { selectedVersion } = usePublicationVersions(projectId);

  const sortedChildren = useMemo(
    () => [...(children ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [children]
  );
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {sortedChildren
        .filter(
          (child) =>
            child.version === selectedVersion &&
            child.name !== 'designsafe.project'
        )
        .map((child, idx) => (
          <PublishedEntityDisplay
            license={data.baseProject.license}
            projectId={projectId}
            treeData={child}
            defaultOpen={idx === 0}
            key={child.id}
          />
        ))}
    </div>
  );
};
