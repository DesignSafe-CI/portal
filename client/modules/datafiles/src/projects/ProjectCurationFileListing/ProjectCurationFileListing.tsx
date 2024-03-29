import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileListingTable,
  TFileListingColumns,
} from '../../FileListing/FileListingTable/FileListingTable';
import { toBytes } from '../../FileListing/FileListing';
import { PreviewModalBody } from '../../DatafilesModal/PreviewModal';
import { NavLink } from 'react-router-dom';
import {
  TEntityMeta,
  TFileListing,
  TFileTag,
  useAddFileAssociation,
  useFileAssociations,
  useFileTags,
  useProjectDetail,
  useRemoveFileAssociation,
  useSetFileTags,
} from '@client/hooks';
import { Button, Select } from 'antd';
import {
  DISPLAY_NAMES,
  ENTITIES_WITH_FILES,
  PROJECT_COLORS,
} from '../constants';
import { DefaultOptionType } from 'antd/es/select';
import { FILE_TAG_OPTIONS } from './ProjectFileTagOptions';

const FileTagInput: React.FC<{
  projectId: string;
  filePath: string;
  entityUuid: string;
  entityName: string;
  initialTags: string[];
}> = ({ projectId, filePath, entityUuid, entityName, initialTags }) => {
  const [tagValue, setTagValue] = useState(initialTags);
  const [showSave, setShowSave] = useState(false);
  useEffect(() => setTagValue(initialTags), [setTagValue, initialTags]);

  const { mutate: setFileTags } = useSetFileTags(
    projectId,
    entityUuid,
    encodeURIComponent(filePath)
  );

  const onTagChange = useCallback(
    (newVal: string[]) => {
      setTagValue(newVal);
      setShowSave(true);
    },
    [setTagValue, setShowSave]
  );

  const onSaveSelection = useCallback(() => {
    setFileTags(
      { tagNames: tagValue },
      { onSuccess: () => setShowSave(false) }
    );
  }, [tagValue, setFileTags]);

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Select
        mode="tags"
        allowClear
        value={tagValue}
        onChange={onTagChange}
        placeholder={`Select ${DISPLAY_NAMES[entityName]} file tags or enter custom tags`}
        options={FILE_TAG_OPTIONS[entityName] ?? []}
        style={{ flex: 1 }}
      />
      {showSave && (
        <Button onClick={onSaveSelection} type="link">
          Save Selection
        </Button>
      )}
    </div>
  );
};

const FileCurationSelector: React.FC<{
  projectId: string;
  fileObj: TFileListing;
  options: DefaultOptionType[];
  filePathsToEntities: Record<string, TEntityMeta[]>;
  entityUuidToTags: Record<string, TFileTag[]>;
}> = ({
  projectId,
  fileObj,
  options,
  filePathsToEntities,
  entityUuidToTags,
}) => {
  const { data: projectDetail } = useProjectDetail(projectId);
  const { mutate: addFileAssociation } = useAddFileAssociation(projectId);
  const { mutate: removeFileAssociation } = useRemoveFileAssociation(projectId);

  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );

  const entitiesForFile = useMemo(() => {
    const associatedEntities = Object.keys(filePathsToEntities)
      .filter((k) => fileObj.path === k || fileObj.path.startsWith(k + '/'))
      .map((k) => filePathsToEntities[k])
      .flat();
    const uniqueUuids: string[] = [];
    const uniqueEntities: TEntityMeta[] = [];

    associatedEntities.forEach((e) => {
      if (!uniqueUuids.includes(e.uuid)) {
        uniqueEntities.push(e);
        uniqueUuids.push(e.uuid);
      }
    });
    return uniqueEntities;
  }, [filePathsToEntities, fileObj.path]);

  if (!projectDetail) return null;
  if (projectDetail.baseProject.value.projectType === 'other') {
    return (
      <section style={{ width: '50%' }}>
        <FileTagInput
          projectId={projectId}
          filePath={fileObj.path}
          entityName={projectDetail.baseProject.name}
          entityUuid={projectDetail.baseProject.uuid}
          initialTags={(entityUuidToTags[projectDetail.baseProject.uuid] ?? [])
            .filter((t) => t.path === fileObj.path)
            .map((t) => t.tagName)}
        />
      </section>
    );
  }

  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {entitiesForFile.map((e) => (
        <li key={e.uuid} style={{ display: 'flex', gap: '4rem' }}>
          <section
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                border: `1px solid ${PROJECT_COLORS[e.name]?.outline}`,
                backgroundColor: PROJECT_COLORS[e.name]?.fill,
                flex: 1,
                color: 'black',
                borderRadius: '5px',
                paddingLeft: '0.5rem',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {DISPLAY_NAMES[e.name]}: {e.value.title}
            </span>{' '}
            &nbsp;
            {(filePathsToEntities[fileObj.path] ?? []).find(
              (exactEntity) => exactEntity.uuid === e.uuid
            ) && (
              <Button
                type="link"
                onClick={() =>
                  removeFileAssociation({
                    filePath: encodeURIComponent(fileObj.path),
                    entityUuid: e.uuid,
                  })
                }
              >
                Remove
              </Button>
            )}
          </section>
          <section style={{ flex: 1 }}>
            {projectDetail && (
              <FileTagInput
                projectId={projectId}
                filePath={fileObj.path}
                entityName={e.name}
                entityUuid={e.uuid}
                initialTags={(entityUuidToTags[e.uuid] ?? [])
                  .filter((t) => t.path === fileObj.path)
                  .map((t) => t.tagName)}
              />
            )}
          </section>
        </li>
      ))}
      <li style={{ display: 'flex', gap: '4rem' }}>
        <section style={{ display: 'flex', flex: 1 }}>
          <Select<string>
            value={selectedEntity}
            allowClear
            onChange={(newVal) => setSelectedEntity(newVal)}
            options={options}
            placeholder="Select Category"
            style={{ flex: 1 }}
          />
          {selectedEntity && (
            <Button
              onClick={() =>
                addFileAssociation({
                  fileObjs: [fileObj],
                  entityUuid: selectedEntity,
                })
              }
              type="link"
            >
              &nbsp; Save
            </Button>
          )}
        </section>
        <div style={{ flex: 1 }} />
      </li>
    </ul>
  );
};

export const ProjectCurationFileListing: React.FC<{
  projectId: string;
  path: string;
}> = ({ projectId, path }) => {
  const { data } = useProjectDetail(projectId ?? '');
  const entityAssociations = useFileAssociations(projectId);
  const tagMapping = useFileTags(projectId);
  const options: DefaultOptionType[] = useMemo(
    () =>
      ENTITIES_WITH_FILES[data?.baseProject.value.projectType ?? 'None'].map(
        (t) => ({
          label: DISPLAY_NAMES[t],
          options: data?.entities
            .filter((e) => e.name === t)
            .map((e) => ({ label: e.value.title, value: e.uuid })),
        })
      ),
    [data]
  );

  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    path?: string;
  }>({ isOpen: false });

  const columns: TFileListingColumns = useMemo(
    () => [
      {
        title: 'File Name',
        dataIndex: 'name',
        ellipsis: true,
        width: '70%',
        render: (data, record) => (
          <>
            <div>
              {record.type === 'dir' ? (
                <NavLink
                  className="listing-nav-link"
                  to={`../${encodeURIComponent(record.path)}`}
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
                </NavLink>
              ) : (
                <Button
                  type="link"
                  onClick={() =>
                    setPreviewModalState({ isOpen: true, path: record.path })
                  }
                >
                  <i
                    role="none"
                    style={{ color: '#333333' }}
                    className="fa fa-file-o"
                  >
                    &nbsp;&nbsp;
                  </i>
                  {data}
                </Button>
              )}
            </div>{' '}
            <FileCurationSelector
              projectId={projectId}
              fileObj={record}
              options={options}
              filePathsToEntities={entityAssociations}
              entityUuidToTags={tagMapping}
            />
          </>
        ),
      },
      {
        title: 'Size',
        dataIndex: 'length',
        render: (d) => toBytes(d),
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastModified',
        ellipsis: true,
        render: (d) => new Date(d).toLocaleString(),
      },
    ],
    [setPreviewModalState, projectId, entityAssociations, options, tagMapping]
  );

  if (!data) return 'loading...';
  return (
    <>
      <FileListingTable
        api={'tapis'}
        system={`project-${data.baseProject.uuid}`}
        scheme="private"
        path={path}
        columns={columns}
        scroll={{ y: 500 }}
      />
      {previewModalState.path && (
        <PreviewModalBody
          isOpen={previewModalState.isOpen}
          api="tapis"
          system={`project-${data.baseProject.uuid}`}
          path={previewModalState.path}
          handleCancel={() => setPreviewModalState({ isOpen: false })}
        />
      )}
    </>
  );
};
