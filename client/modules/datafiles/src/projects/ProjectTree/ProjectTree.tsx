import React, { useMemo, useState } from 'react';
import styles from './ProjectTree.module.css';
import {
  TEntityValue,
  TPublicationTree,
  TTreeData,
  useAddEntityToTree,
  useProjectDetail,
  useProjectEntityReorder,
  usePublicationDetail,
  useRemoveEntityFromTree,
} from '@client/hooks';
import { Button, Select } from 'antd';
import {
  PROJECT_COLORS,
  ALLOWED_RELATIONS,
  DISPLAY_NAMES,
  PUBLISHABLE_NAMES,
} from '../constants';

const EntitySelector: React.FC<{
  projectId: string;
  entityName: string;
  nodeId: string;
}> = ({ projectId, entityName, nodeId }) => {
  const { data } = useProjectDetail(projectId);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const { mutate } = useAddEntityToTree(projectId, nodeId);
  if (!data) return null;
  if (!ALLOWED_RELATIONS[entityName]) return null;
  const { entities } = data;
  const options = entities
    .filter((e) => ALLOWED_RELATIONS[entityName].includes(e.name))
    .map((e) => ({
      label: `${DISPLAY_NAMES[e.name]}: ${e.value.title}`,
      value: e.uuid,
    }));
  const placeholder = ALLOWED_RELATIONS[entityName]
    .map((n) => DISPLAY_NAMES[n])
    .join('/');

  return (
    <>
      <Select
        allowClear
        style={{ width: 'fit-content' }}
        placeholder={`Select ${placeholder}`}
        value={selectedEntity}
        onChange={(newVal) => setSelectedEntity(newVal)}
        options={options}
      ></Select>{' '}
      &nbsp;
      {selectedEntity && (
        <Button
          onClick={() =>
            mutate(
              { uuid: selectedEntity },
              { onSuccess: () => setSelectedEntity(undefined) }
            )
          }
          type="link"
        >
          Save
        </Button>
      )}
    </>
  );
};

const ProjectTreeDisplay: React.FC<{
  projectId: string;
  uuid: string;
  nodeId: string;
  order: number;
  name: string;
  isLast: boolean;
}> = ({ projectId, uuid, nodeId, order, name, isLast }) => {
  const { data } = useProjectDetail(projectId);
  const { mutate } = useProjectEntityReorder(projectId, nodeId);
  const { mutate: removeEntity } = useRemoveEntityFromTree(projectId, nodeId);
  if (!data) return null;
  const { entities } = data;
  const entity = entities.find((e) => e.uuid === uuid);
  if (!entity) return null;
  return (
    <>
      <span> &nbsp;{entity.value.title}&nbsp;</span>
      <Button
        type="text"
        disabled={order === 0}
        onClick={() => mutate({ order: order - 1 })}
      >
        <i role="none" className="fa fa-arrow-up">
          &nbsp;
        </i>
      </Button>
      <Button
        type="text"
        disabled={isLast}
        onClick={() => mutate({ order: order + 1 })}
      >
        <i role="none" className="fa fa-arrow-down">
          &nbsp;
        </i>
      </Button>
      {!PUBLISHABLE_NAMES.includes(name) && (
        <Button onClick={() => removeEntity()} type="link">
          Remove
        </Button>
      )}
    </>
  );
};

const RecursiveTree: React.FC<{
  treeData: TTreeData | TPublicationTree<TEntityValue>;
  projectId: string;
  isLast?: boolean;
  readOnly?: boolean;
}> = ({ treeData, projectId, readOnly, isLast = false }) => {
  const sortedChildren = useMemo(
    () => [...(treeData.children ?? [])].sort((a, b) => a.order - b.order),
    [treeData]
  );

  const showDropdown =
    ALLOWED_RELATIONS[treeData.name] && treeData.name !== 'designsafe.project';

  return (
    <li className={styles['tree-li']}>
      <div
        className={styles['tree-list-item']}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <div
          className={styles['tree-list-badge']}
          style={{
            backgroundColor: PROJECT_COLORS[treeData.name].fill,
            outline: `1px solid ${PROJECT_COLORS[treeData.name].outline}`,
          }}
        >
          {DISPLAY_NAMES[treeData.name]}
        </div>
        {readOnly ? (
          <div
            style={{
              marginLeft: '1rem',
            }}
          >
            {(treeData as TPublicationTree<TEntityValue>).value.title}
          </div>
        ) : (
          <ProjectTreeDisplay
            projectId={projectId}
            uuid={treeData.uuid}
            nodeId={treeData.id}
            name={treeData.name}
            order={treeData.order ?? 0}
            isLast={isLast}
          />
        )}
      </div>
      <ul className={styles['tree-ul']}>
        {sortedChildren.map((child, idx) => (
          <RecursiveTree
            treeData={child}
            key={child.id}
            projectId={projectId}
            readOnly={readOnly}
            isLast={idx === sortedChildren.length - 1}
          />
        ))}
        {showDropdown && !readOnly && (
          <li className={styles['tree-li']}>
            <span className={styles['tree-select-item']}>
              <EntitySelector
                projectId={projectId}
                entityName={treeData.name}
                nodeId={treeData.id}
              />
            </span>
          </li>
        )}
      </ul>
    </li>
  );
};

export const ProjectTree: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data } = useProjectDetail(projectId);
  const treeJSON = data?.tree;

  if (!treeJSON) return <div>project tree</div>;
  return (
    <ul className={styles['tree-base']}>
      <RecursiveTree treeData={treeJSON} projectId={projectId} isLast />
    </ul>
  );
};

export const PublicationTree: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data } = usePublicationDetail(projectId);
  const treeJSON = data?.tree;

  if (!treeJSON) return <div>project tree</div>;
  return (
    <ul className={styles['tree-base']}>
      <RecursiveTree
        treeData={treeJSON}
        projectId={projectId}
        isLast
        readOnly
      />
    </ul>
  );
};
