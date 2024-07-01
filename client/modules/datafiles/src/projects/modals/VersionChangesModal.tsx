import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { usePublicationDetail } from '@client/hooks';

export const VersionChangesModal: React.FC<{
  projectId: string;
  version: number;
}> = ({ projectId, version }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data } = usePublicationDetail(projectId);

  const versionedPubs = data?.tree.children.filter(
    (c) => c.version === version
  );

  const versionDate =
    versionedPubs && versionedPubs.length > 0 && versionedPubs[0].versionDate
      ? new Date(versionedPubs[0].versionDate).toISOString().split('T')[0]
      : '--';

  const versionDesc =
    versionedPubs && versionedPubs.length > 0
      ? versionedPubs[0].versionInfo
      : '--';
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="link" onClick={showModal}>
        <strong>Version Changes</strong>
      </Button>
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width={500}
        title={<h2>Version Changes</h2>}
        footer={null}
      >
        <article>
          <div className="pub-info-item">
            <div className="pub-info-modal-label">Version</div>
            <div className="pub-info-modal-data">{version}</div>
          </div>
          <div className="pub-info-item">
            <div className="pub-info-modal-label">Date of Versioning</div>
            <div className="pub-info-modal-data">{versionDate}</div>
          </div>
          <div className="pub-info-modal-heading">Work(s) Versioned</div>
          <div className="pub-info-modal-body">
            {versionedPubs?.map((p) => (
              <p key={p.uuid}>{p.value.title}</p>
            ))}
          </div>
          <div className="pub-info-item">{versionDesc}</div>
        </article>
      </Modal>
    </>
  );
};
