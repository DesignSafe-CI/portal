import { Button, Dropdown } from 'antd';
import React from 'react';
import styles from './DatafilesHelpDropdown.module.css';

const items = [
  {
    label: (
      <a
        href="https://www.youtube.com/playlist?list=PL2GxvrdFrBlkwHBgQ47pZO-77ZLrJKYHV"
        rel="noopener noreferrer"
        target="_blank"
        aria-describedby="msg-open-ext-site-new-window"
      >
        <div>Curation Tutorials</div>
      </a>
    ),
    key: '1',
  },
  {
    label: (
      <a
        href="/rw/user-guides/data-publication-guidelines/"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>Curation Guidelines</div>
      </a>
    ),
    key: '2',
  },
  {
    label: (
      <a
        href="/rw/user-guide/data-depot"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>
          Learn About the <br />
          Data Depot
        </div>
      </a>
    ),
    key: '3',
  },
  {
    label: (
      <a
        href="/rw/user-guides/data-transfer-guide/"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>Data Transfer Guide</div>
      </a>
    ),
    key: '4',
  },
  {
    label: (
      <a
        href="/faq/#!#faq-dcap"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>Curation FAQ</div>
      </a>
    ),
    key: '5',
  },
  {
    label: (
      <a
        href="/faq/#!#faq-citation"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>
          How to Acknowledge <br />
          DesignSafe-CI
        </div>
      </a>
    ),
    key: '6',
  },
  {
    label: (
      <a
        href="/rw/user-guides/curating-publishing-projects/policies/publication/"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>Data Usage Agreement</div>
      </a>
    ),
    key: '7',
  },
  {
    label: (
      <a
        href="/faq"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-new-window"
      >
        <div>FAQ</div>
      </a>
    ),
    key: '8',
  },
];

export const DatafilesHelpDropdown: React.FC = () => {
  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      overlayClassName={styles.datafilesHelp}
    >
      <Button type="primary">
        Help <span className="caret" role="presentation" />
      </Button>
    </Dropdown>
  );
};
