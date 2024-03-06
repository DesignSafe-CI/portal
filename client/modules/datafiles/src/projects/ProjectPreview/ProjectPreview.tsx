import React, { useCallback, useState } from 'react';
import { useProjectPreview } from '@client/hooks';
import { Collapse } from 'antd';
import styles from './ProjectPreview.module.css';
import { DISPLAY_NAMES, PROJECT_COLORS } from '../constants';

type TTreeData = {
  name: string;
  id: string;
  value: {
    title: string;
    description: string;
  };
  order: number;
  children: TTreeData[];
};

function RecursiveTree({ treeData }: { treeData: TTreeData }) {
  const refCallback = useCallback((ref: HTMLDivElement) => {
    if (ref) {
      const header = ref.getElementsByClassName('ant-collapse-header');
      if (header.length > 0) {
        const headerElement = header[0] as HTMLElement;
        headerElement.style.backgroundColor =
          PROJECT_COLORS[treeData.name]['fill'];
        headerElement.style.border = `1px solid ${
          PROJECT_COLORS[treeData.name]['outline']
        }`;
      }
    }
  }, []);

  return (
    <li className={`${styles['tree-li']}`}>
      <Collapse
        expandIconPosition="right"
        ref={refCallback}
        size="small"
        style={{ flex: 1 }}
        items={[
          {
            label: `${DISPLAY_NAMES[treeData.name]} | ${treeData.value.title}`,
            children: <span>{treeData.value.description}</span>,
          },
        ]}
      ></Collapse>
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
            <RecursiveTree treeData={child} />
          </div>
        ))}
      </ul>
    </li>
  );
}

const PublishedEntityDisplay: React.FC<{
  treeData: TTreeData;
  defaultOpen: boolean;
}> = ({ treeData, defaultOpen }) => {
  const [active, setActive] = useState<boolean>(defaultOpen);
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
          height: '100px',
          padding: '10px 20px',
        }}
      >
        Cite This Data
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
            children: (treeData.children ?? []).map((child) => (
              <RecursiveTree treeData={child} key={child.id} />
            )),
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
  if (!data) return null;

  const { children } = data.tree as TTreeData;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {children.map((child, idx) => (
        <PublishedEntityDisplay
          treeData={child}
          defaultOpen={idx === 0}
          key={child.id}
        />
      ))}
    </div>
  );
};
