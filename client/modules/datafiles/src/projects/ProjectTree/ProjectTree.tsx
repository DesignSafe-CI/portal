import React from 'react';
import styles from './ProjectTree.module.css';
import { useProjectDetail } from '@client/hooks';

type TTreeData = {
  name: string;
  id: string;
  children: TTreeData[];
};

function RecursiveTree({ treeData }: { treeData: TTreeData }) {
  return (
    <li className={styles['tree-li']}>
      <span className={styles['tree-list-item']}>{treeData.name}</span>
      <ul className={styles['tree-ul']}>
        {(treeData.children ?? []).map((child) => (
          <RecursiveTree treeData={child} key={child.id} />
        ))}
      </ul>
    </li>
  );
}

export const ProjectTree: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data } = useProjectDetail(projectId);
  const treeJSON = data?.tree;

  if (!treeJSON) return <div>project tree</div>;
  return (
    <ul className={styles['tree-base']}>
      <RecursiveTree treeData={treeJSON} />
    </ul>
  );
};
