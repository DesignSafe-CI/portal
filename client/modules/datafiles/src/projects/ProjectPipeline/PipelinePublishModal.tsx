import {
  useAmendProject,
  usePublishProject,
  useVersionProject,
} from '@client/hooks';
import { Button, Checkbox, Input, Modal } from 'antd';
import React, { useState } from 'react';

export const PipelinePublishModal: React.FC<{
  projectId: string;
  entityUuids: string[];
  operation: string;
  projectType: string;
  disabled: boolean;
}> = ({ projectId, entityUuids, operation, projectType, disabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const [versionInfo, setVersionInfo] = useState('');

  const { mutate: publishMutation } = usePublishProject();
  const { mutate: amendMutation } = useAmendProject();
  const { mutate: versionMutation } = useVersionProject();

  const doPublish = () => {
    switch (operation) {
      case 'publish':
        publishMutation({ projectId, entityUuids });
        break;
      case 'amend':
        amendMutation({ projectId });
        break;
      case 'version':
        versionMutation({ projectId, entityUuids, versionInfo });
        break;
    }
  };

  const publishButtonText: Record<string, string> = {
    amend: 'Submit Amendments',
    version: 'Create a New Version',
    publish: 'Request DOI & Publish',
  };

  const [protectedDataAgreement, setProtectedDataAgreement] = useState(false);
  const [publishingAgreement, setPublishingAgreement] = useState(false);

  const canPublish =
    publishingAgreement &&
    (projectType === 'field_recon' ? protectedDataAgreement : true) &&
    (operation === 'version' ? !!versionInfo : true);

  return (
    <>
      <Button
        disabled={disabled}
        className="success-button"
        style={{ padding: '0px 40px' }}
        type="primary"
        onClick={showModal}
      >
        <i role="none" className="fa fa-globe"></i>&nbsp;
        {publishButtonText[operation]}
      </Button>
      <Modal
        width="60%"
        open={isModalOpen}
        footer={() => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              <Checkbox
                id="publication-agreement-checkbox"
                checked={publishingAgreement}
                onChange={(e) => setPublishingAgreement(e.target.checked)}
              />
              <label htmlFor="publication-agreement-checkbox">
                &nbsp;I agree
              </label>
            </span>
            <Button
              disabled={!canPublish}
              onClick={doPublish}
              type="primary"
              className="success-button"
            >
              {publishButtonText[operation]}
            </Button>
          </div>
        )}
        onCancel={handleCancel}
      >
        {projectType === 'field_recon' && (
          <div className="pad-content">
            <h3>
              Guidelines Regarding the Storage and Publication of Protected Data
              in DesignSafe-CI
            </h3>
            <hr />
            <p>
              Researchers should always comply with the requirements, norms and
              procedures approved by the Institutional Review Board (IRB) or
              equivalent body, regarding human subjects’ data storage and
              publication.
            </p>
            <p>
              <i>Protected data</i> includes human subjects data with Personal
              Identifiable Information (PII), data that is protected under{' '}
              <a
                href="https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                HIPPA
              </a>
              ,{' '}
              <a
                href="https://studentprivacy.ed.gov/faq/what-ferpa"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                FERPA
              </a>{' '}
              and{' '}
              <a
                href="https://csrc.nist.gov/projects/risk-management/detailed-overview"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                FISMA
              </a>{' '}
              regulations, as well as data that involves vulnerable populations
              and that contains
              <a
                href="https://en.wikipedia.org/wiki/Information_sensitivity"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                {' '}
                sensitive information
              </a>
              .
            </p>
            <div className="overview-heading">Storing Protected Data</div>
            <p>
              DesignSafe My Data and My Projects are secure spaces to store raw
              protected data as long as it is not under HIPPA, FERPA or FISMA
              regulations. If data needs to comply with these regulations,
              researchers must contact DesignSafe through a
              <a
                href="/help/new-ticket/"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-new-window"
              >
                {' '}
                help ticket
              </a>{' '}
              to evaluate the case and use
              <a
                href="https://www.tacc.utexas.edu/protected-data-service"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                {' '}
                TACC‘s Protected Data Service
              </a>
              . Researchers with doubts are welcome to send a{' '}
              <a
                href="/help/new-ticket/"
                target="_blank"
                aria-describedby="msg-open-new-window"
              >
                ticket
              </a>{' '}
              or join
              <a
                href="/facilities/virtual-office-hours/"
                target="_blank"
                aria-describedby="msg-open-new-window"
              >
                {' '}
                curation office hours
              </a>
              .
            </p>
            <div className="overview-heading">Publishing Protected Data</div>
            <p>
              To publish protected data researchers should adhere to the
              following procedures:
            </p>
            <p>
              1. Do not publish HIPPA, FERPA, FISMA, PII data or other sensitive
              information in DesignSafe.
            </p>
            <p>
              2. To publish protected data and any related documentation
              (reports, planning documents, field notes, etc.) it must be
              properly anonymized. No <i>direct identifiers</i> and up to three{' '}
              <i>indirect identifiers</i> are allowed. <i>Direct identifiers</i>{' '}
              include items such as participant names, participant initials,
              facial photographs (unless expressly authorized by participants),
              home addresses, social security numbers and dates of birth.{' '}
              <i>Indirect identifiers</i>
              are identifiers that, taken together, could be used to deduce
              someone’s identity. Examples of
              <i>indirect identifiers</i> include gender, household and family
              compositions, occupation, places of birth, or year of birth/age.
            </p>
            <p>
              3. If a researcher needs to restrict public access to data because
              it includes HIPPA, FERPA, PII data or other sensitive information,
              consider publishing metadata and other documentation about the
              data.
            </p>
            <p>
              4. Users of DesignSafe interested in the data will be directed to
              contact the project PI or designated point of contact through a
              published email address to request access to the data and to
              discuss the conditions for its reuse.
            </p>
            <p>
              5. Please contact DesignSafe through a
              <a
                href="/help/new-ticket/"
                target="_blank"
                aria-describedby="msg-open-new-window"
              >
                help ticket
              </a>{' '}
              or join
              <a
                href="/facilities/virtual-office-hours/"
                target="_blank"
                aria-describedby="msg-open-new-window"
              >
                curation office hours
              </a>
              prior to preparing this type of data publication.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                <Checkbox
                  id="publication-protected-checkbox"
                  checked={protectedDataAgreement}
                  onChange={(e) => setProtectedDataAgreement(e.target.checked)}
                />
                <label htmlFor="publication-protected-checkbox">
                  &nbsp;The data I am publishing adheres to the procedures
                  listed above
                </label>
              </span>
            </div>
          </div>
        )}

        <div className="pad-content">
          <h3>Publishing Agreement</h3>
          <hr />
          <p>
            This submission represents my original work and meets the policies
            and requirements established by the DesignSafe-CI{' '}
            <a
              href="/rw/user-guides/data-publication-guidelines/"
              target="_blank"
              aria-describedby="msg-open-new-window"
            >
              Policies and Best Practices.
            </a>
            I grant the Data Depot Repository (DDR) all required permissions and
            licenses to make the work I publish in the DDR available for
            archiving and continued access. These permissions include allowing
            DesignSafe to:
          </p>
          <ol>
            <li>
              Disseminate the content in a variety of distribution formats
              according to the DDR{' '}
              <a
                href="/rw/user-guides/data-publication-guidelines/"
                target="_blank"
                aria-describedby="msg-open-new-window"
              >
                Policies and Best Practices.
              </a>{' '}
            </li>
            <li>Promote and advertise the content publicly in DesignSafe.</li>
            <li>
              Store, translate, copy, or re-format files in any way to ensure
              its future preservation and accessibility.{' '}
            </li>
            <li>
              Improve usability and/or protect respondent confidentiality.
            </li>
            <li>
              Exchange and or incorporate metadata or documentation in the
              content into public access catalogues.
            </li>
            <li>
              Transfer data, metadata with respective DOI to other institution
              for long-term accessibility if needed for continued access.{' '}
            </li>
          </ol>
          <p></p>
          <p>
            I understand the type of license I choose to distribute my data, and
            I guarantee that I am entitled to grant the rights contained in
            them. I agree that when this submission is made public with a unique
            digital object identifier (DOI), this will result in a publication
            that cannot be changed. If the dataset requires revision, a new
            version of the data publication will be published under the same
            DOI.
          </p>
          I warrant that I am lawfully entitled and have full authority to
          license the content submitted, as described in this agreement. None of
          the above supersedes any prior contractual obligations with third
          parties that require any information to be kept confidential.
          <p>
            If applicable, I warrant that I am following the IRB agreements in
            place for my research and following{' '}
            <a
              href="/rw/user-guides/curating-publishing-projects/best-practices/data-publication/"
              target="_blank"
              aria-describedby="msg-open-new-window"
            >
              Protected Data Best Practices.
            </a>
          </p>
          <p>
            I understand that the DDR does not approve data publications before
            they are posted; therefore, I am solely responsible for the
            submission, publication, and all possible confidentiality/privacy
            issues that may arise from the publication.
          </p>
        </div>
        {operation === 'version' && (
          <>
            {' '}
            <label htmlFor="version-info-input">
              Version Changes (required)
            </label>{' '}
            <div>
              Specify what files you are adding, removing, or replacing, and why
              these changes are needed. This will be displayed to those viewing
              your publication, so be detailed and formal in your explanation.
            </div>
            <Input.TextArea
              autoSize={{ minRows: 3 }}
              onChange={(e) => setVersionInfo(e.target.value)}
              id="version-info-input"
            />
          </>
        )}
      </Modal>
    </>
  );
};
