import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { Link } from 'react-router-dom';

export const ProjectBestPracticesModal: React.FC<{
  projectId: string;
}> = ({ projectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="primary" className="success-button" onClick={showModal}>
        Publish/ Amend/ Version
      </Button>
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width={900}
        title={<h2>Best Practices</h2>}
        footer={null}
      >
        <article>
          <div>
            <strong>
              Before you publish, please make sure you are following these best
              practices:
            </strong>
            <p style={{ paddingBottom: '10px' }}></p>
            <ul>
              <li>
                Publish data files in a format that is interoperable and open.
                Example: CSV files instead of Excel spreadsheet files
              </li>
              <li>
                Before publishing raw data, consider why it is necessary. If so,
                explain how others can use the raw data.
              </li>
              <li>
                Be selective with any images you choose. Use file tags to
                describe them. Make sure they have a purpose or a function.
              </li>
              <li>
                Do not publish Zip files. Zip files prevent others from viewing
                and understanding your data.
              </li>
              <li>
                Use applicable software to review for any errors in your data
                before you publish.
              </li>
            </ul>
            <p></p>
            <div className="text-right">
              <Link to={`/projects/${projectId}/prepare-to-publish/start`}>
                <Button type="primary" className="success-button">
                  <span>
                    Continue <i role="none" className="fa fa-arrow-right"></i>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </Modal>
    </>
  );
};
