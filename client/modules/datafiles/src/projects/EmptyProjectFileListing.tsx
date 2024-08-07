import React from 'react';

export const EmptyProjectFileListing: React.FC = () => {
  return (
    <p style={{ marginTop: '20px', fontSize: '16px' }}>
      This folder is empty! <br />
      <i role="none" className="fa fa-folder-open-o">
        &nbsp;
      </i>
      <br />
      <a
        href="https://www.youtube.com/watch?v=ITf4hlBamGU&amp;list=PL2GxvrdFrBlkwHBgQ47pZO-77ZLrJKYHV"
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="msg-open-ext-site-new-window"
      >
        <i role="none" className="fa fa-question-circle">
          &nbsp;
        </i>
        Learn how to move files to a project
      </a>
    </p>
  );
};
