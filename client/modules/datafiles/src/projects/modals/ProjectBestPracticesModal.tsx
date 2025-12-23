import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { Link } from 'react-router-dom';
import { useProjectDetail } from '@client/hooks';

export const ProjectBestPracticesModal: React.FC<{
  projectId: string;
  disabled?: boolean;
}> = ({ projectId, disabled = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data } = useProjectDetail(projectId);
  const projectType = data?.baseProject.value.projectType;
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        type="primary"
        className="success-button"
        onClick={showModal}
        disabled={disabled}
      >
        Prepare to Publish / Amend / Version
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
              {projectType !== 'software' && (
                <>
                  <li>
                    Publish data files in a format that is interoperable and
                    open. Example: CSV files instead of Excel spreadsheet files
                  </li>
                  <li>
                    Before publishing raw data, consider why it is necessary. If
                    so, explain how others can use the raw data.
                  </li>
                  <li>
                    Be selective with any images you choose. Use file tags to
                    describe them. Make sure they have a purpose or a function.
                  </li>
                  <li>
                    Do not publish Zip files. Zip files prevent others from
                    viewing and understanding your data.
                  </li>
                  <li>
                    Use applicable software to review for any errors in your
                    data before you publish.
                  </li>
                </>
              )}
              {projectType === 'software' && (
                <>
                  <li>
                    Please read and follow the documented{' '}
                    <a
                      href="https://www.designsafe-ci.org/user-guide/curating/policies/#publishing-research-software"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Policies
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://www.designsafe-ci.org/user-guide/curating/bestpractices/#research-software"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Best Practices
                    </a>{' '}
                    regarding publication of research software.
                  </li>
                  <li>
                    Test that the software is in working condition and can be
                    installed and used according to the readme file included in
                    the release.
                  </li>
                  <li>
                    Include as much information as possible in the{' '}
                    <code>codemeta.json</code> file. This information allows for
                    attribution, dissemination, reuse, and interoperability.
                  </li>
                  <li>
                    Do not include data in the release. Data used with the
                    published research software (e.g training, testing,
                    validation, etc.) should be published as a stand-alone
                    dataset in DesignSafe and related to the research software
                    publication via the Related Work type: linked dataset entry.
                    From the research software publication, data can be related
                    via the Referenced Data and Software entry.
                  </li>
                </>
              )}
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
