import React, { useEffect, useMemo, useState } from 'react';
import {
  TPreviewTreeData,
  useCitationMetrics,
  useProjectPreview,
  usePublicationDetail,
  usePublicationVersions,
  useSelectedFiles,
} from '@client/hooks';
import { Alert, Button, Collapse, Tag } from 'antd';
import styles from './ProjectPreview.module.css';
import { DISPLAY_NAMES, PROJECT_COLORS } from '../constants';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import {
  ProjectCitation,
  PublishedCitation,
  DownloadCitation,
} from '../ProjectCitation/ProjectCitation';
import {
  FileListingTable,
  FileTypeIcon,
  TFileListingColumns,
} from '@client/common-components';
import { Link } from 'react-router-dom';
import { PublishedEntityDetails } from '../PublishedEntityDetails';
import { MetricsModal } from '../modals/MetricsModal';
import { PreviewModalBody } from '../../DatafilesModal/PreviewModal';
import { SubEntityDetails } from '../SubEntityDetails';

const EntityFileListingTable: React.FC<{
  treeData: TPreviewTreeData;
  preview?: boolean;
}> = ({ treeData, preview }) => {
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    path?: string;
  }>({ isOpen: false });

  const columns: TFileListingColumns = [
    {
      title: 'File Name',
      dataIndex: 'name',
      ellipsis: true,
      render: (data, record) => (
        <div>
          {record.type === 'dir' ? (
            <Link
              className="listing-nav-link"
              to={`./${encodeURIComponent(record.path)}`}
              style={{ pointerEvents: preview ? 'none' : 'all' }}
              replace={false}
            >
              <i
                role="none"
                style={{ color: '#333333' }}
                className="fa fa-folder"
              >
                &nbsp;&nbsp;
              </i>
              {data}
            </Link>
          ) : (
            <>
              <FileTypeIcon name={record.name} />
              &nbsp;&nbsp;
              <Button
                type="link"
                disabled={preview}
                onClick={() =>
                  setPreviewModalState({ isOpen: true, path: record.path })
                }
              >
                {data}
              </Button>
            </>
          )}
          <div>
            {treeData.value.fileTags
              .filter((t) => t.path === record.path)
              .map((t) => (
                <Tag color="#337ab7" key={t.tagName}>
                  {t.tagName}
                </Tag>
              ))}
          </div>
        </div>
      ),
    },
  ];
  return (
    <>
      <FileListingTable
        api="tapis"
        system="designsafe.storage.published"
        path={treeData.uuid}
        scheme="public"
        columns={columns}
        scroll={{ x: 500, y: 500 }}
        dataSource={treeData.value.fileObjs}
        disabled
      />
      {previewModalState.path && (
        <PreviewModalBody
          isOpen={previewModalState.isOpen}
          api={'tapis'}
          system={'designsafe.storage.published'}
          path={previewModalState.path}
          handleCancel={() => setPreviewModalState({ isOpen: false })}
        />
      )}
    </>
  );
};

function RecursiveTree({
  treeData,
  preview,
  defaultOpen = false,
}: {
  treeData: TPreviewTreeData;
  defaultOpen?: boolean;
  preview?: boolean;
}) {
  return (
    <li className={`${styles['tree-li']}`}>
      <ProjectCollapse
        entityName={treeData.name}
        title={treeData.value.title}
        defaultOpen={defaultOpen}
      >
        <SubEntityDetails entityValue={treeData.value} />
        <EntityFileListingTable treeData={treeData} preview={preview} />
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
            <RecursiveTree
              treeData={child}
              defaultOpen={defaultOpen}
              preview={preview}
            />
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const sortedChildren = useMemo(
    () => [...(treeData.children ?? [])].sort((a, b) => a.order - b.order),
    [treeData]
  );

  const dois =
    treeData.value.dois && treeData.value.dois.length > 0
      ? treeData.value.dois[0]
      : '';
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
  useEffect(() => {
    if (isError) {
      console.error('Error fetching citation metrics:', error);
    }
  }, [isLoading, isError, error]);

  return (
    <section>
      <div
        className={styles['pub-show-button']}
        style={{
          padding: '16px 12px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          {DISPLAY_NAMES[treeData.name]} |{' '}
          <strong>{treeData.value.title}</strong>
        </span>
        {preview &&
          ((treeData.value.dois?.length ?? 0) > 0 ? (
            <Tag color="#1cb500">Published</Tag>
          ) : (
            <Tag>Unpublished</Tag>
          ))}
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
        {isLoading && <div>Loading citation metrics...</div>}
        {isError && <div>Error fetching citation metrics</div>}
        {citationMetrics && (
          <div>
            <strong>Download Citation:</strong>
            <div>
              <span className={styles['yellow-highlight']}>
                {citationMetrics?.data2?.data.attributes.downloadCount ?? '--'}{' '}
                Downloads
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles['yellow-highlight']}>
                {citationMetrics?.data2?.data.attributes.viewCount ?? '--'}{' '}
                Views
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles['yellow-highlight']}>
                {citationMetrics?.data2?.data.attributes.citationCount ?? '--'}{' '}
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
                data1={citationMetrics?.data1}
                data2={citationMetrics?.data2}
              />
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
                  <EntityFileListingTable
                    treeData={treeData}
                    preview={preview}
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

  if (!sortedChildren.length) {
    return (
      <Alert
        type="warning"
        showIcon
        description={
          <strong>
            No publishable collections were found for this project. You can add
            a new collection under the "Curation Directory" tab.
          </strong>
        }
      ></Alert>
    );
  }

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
            defaultOpen={idx === 0 && sortedChildren.length === 1}
            key={child.id}
          />
        ))}
    </div>
  );
};
