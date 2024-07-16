import React, { useMemo, useState } from 'react';
import { Alert, Button, Modal, Spin } from 'antd';
import DatafilesModal from '../../DatafilesModal/DatafilesModal';
import { useFileDetail, usePublicationVersions } from '@client/hooks';
import { toBytes } from '@client/common-components';

const gnuGeneralLicenseInfo = (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className="curation-gpl" />
      &nbsp;
      <span>
        <strong> GNU General Public License</strong> (
        <a
          href="http://www.gnu.org/licenses/gpl.html"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-ext-site-new-window"
        >
          License Website
        </a>
        )
      </span>
    </div>
    <p />
    <ul style={{}}>
      <li>
        You may modify, copy, and redistribute this work or any derivative
        version.
      </li>
      <li>
        The licensee is free to choose whether or not to charge a fee for
        services that use this work.
      </li>
      <li>
        They cannot impose further restrictions on the rights imposed by this
        license.
      </li>
    </ul>
  </>
);

const ccAttributionInfo = (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className="curation-cc-share" />
      &nbsp;
      <span>
        <strong> Creative Commons Attribution</strong> (
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-ext-site-new-window"
        >
          License Website
        </a>
        )
      </span>
    </div>
    <p />
    <ul>
      <li>
        You allow others to freely share, reuse, and adapt your data/database.
      </li>
      <li>
        You expect to be attributed for any public use of the data/database.
      </li>
    </ul>
  </>
);

const openDataCommonsAttributionInfo = (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className="curation-odc" />
      &nbsp;
      <span>
        <strong> Creative Commons Public Domain Dedication</strong> (
        <a
          href="https://creativecommons.org/publicdomain/zero/1.0/"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-ext-site-new-window"
        >
          License Website
        </a>
        )
      </span>
    </div>
    <p />
    <ul>
      <li>
        You may freely share, modify, and use this work for any purpose without
        any restrictions.
      </li>
      <li>You do not need to be attributed for any public use of this work.</li>
    </ul>
  </>
);

const ccPublicDomainInfo = (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className="curation-cc-share" />
      &nbsp;
      <span>
        <strong> Creative Commons Public Domain Dedication</strong> (
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-ext-site-new-window"
        >
          License Website
        </a>
        )
      </span>
    </div>
    <p />
    <ul>
      <li>
        You allow others to freely share, reuse, and adapt your data/database.
      </li>
      <li>
        You expect to be attributed for any public use of the data/database.
      </li>
    </ul>
  </>
);

const openDataCommonsPublicDomainInfo = (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className="curation-odc" />
      &nbsp;
      <span>
        <strong> Open Data Commons Public Domain Dedication</strong> (
        <a
          href="https://opendatacommons.org/licenses/pddl/1-0/"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-ext-site-new-window"
        >
          License Website
        </a>
        )
      </span>
    </div>
    <p />
    <ul>
      <li>
        You may freely share, modify, and use this data/database for any purpose
        without any restrictions.
      </li>
      <li>
        You do not need to attribute for any public use of this data/database.
      </li>
    </ul>
  </>
);

const bsd3ClauseInfo = (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className="curation-3bsd" />
      &nbsp;
      <span>
        <strong> 3-clause BSD License</strong> (
        <a
          href="https://opensource.org/license/bsd-3-clause/"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-ext-site-new-window"
        >
          License Website
        </a>
        )
      </span>
    </div>
    <p />
    <ul>
      <li>
        Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
      </li>
      <li>
        Redistributions of source code must retain the above copyright notice,
        this list of conditions and the following disclaimer.
      </li>
      <li>
        Neither the name of the copyright holder nor the names of its
        contributors may be used to endorse or promote products derived from
        this software without specific prior written permission.
      </li>
    </ul>
  </>
);

const LICENSE_INFO_MAP: Record<string, React.ReactNode> = {
  'GNU General Public License': gnuGeneralLicenseInfo,
  'Open Data Commons Attribution': openDataCommonsAttributionInfo,
  'Open Data Commons Public Domain Dedication': openDataCommonsPublicDomainInfo,
  'Creative Commons Attribution': ccAttributionInfo,
  'Creative Commons Public Domain Dedication': ccPublicDomainInfo,
  '3-Clause BSD License': bsd3ClauseInfo,
};

export const DownloadDatasetModal: React.FC<{
  projectId: string;
  license?: string;
}> = ({ projectId, license }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { selectedVersion } = usePublicationVersions(projectId);

  const archivePath =
    selectedVersion > 1
      ? `/archives/${projectId}v${selectedVersion}_archive.zip`
      : `/archives/${projectId}_archive.zip`;

  const { data, isError, isLoading } = useFileDetail(
    'tapis',
    'designsafe.storage.published',
    'public',
    archivePath,
    isModalOpen
  );
  const FILE_SIZE_LIMIT = 2147483648;
  const exceedsLimit = useMemo(
    () => (data?.length ?? 0) > FILE_SIZE_LIMIT,
    [data?.length]
  );

  return (
    <>
      <Button type="primary" onClick={showModal}>
        <i className="curation-download" />
        &nbsp;&nbsp;Download Dataset
      </Button>
      <Modal
        destroyOnClose
        open={isModalOpen}
        onCancel={handleClose}
        width={600}
        title={<h2>Download Dataset</h2>}
        footer={null}
      >
        {isLoading && <Spin style={{ marginLeft: '50%' }} />}
        {isError && (
          <Alert
            type="error"
            showIcon
            description="The selected dataset could not be retrieved."
          />
        )}
        {data && (
          <>
            <p />
            {exceedsLimit ? (
              <p>
                This project zipped is <strong>{toBytes(data.length)}</strong>,
                exceeding the <strong>2 GB</strong> download limit. To download,
                <a
                  href="https://accounts.tacc.utexas.edu/register"
                  target="_blank"
                  rel="noreferrer"
                  aria-describedby="msg-open-new-window"
                >
                  {' '}
                  create an account
                </a>{' '}
                and follow the
                <a
                  href="/user-guide/managingdata/#data-transfer-guides"
                  target="_blank"
                  aria-describedby="msg-open-new-window"
                >
                  {' '}
                  Data Transfer Guide
                </a>
                . Alternatively, download files individually by selecting the
                file and using the download button in the toolbar.
              </p>
            ) : (
              <p>
                This download is a ZIP file of the complete project dataset. The
                size of the ZIP file is <strong>{toBytes(data.length)}</strong>.
              </p>
            )}
            <hr />
            <p>The files are licensed by the following:</p>
            {license && LICENSE_INFO_MAP[license]}
            <p>
              <a
                href="/rw/user-guides/curating-publishing-projects/policies/publication/"
                target="_blank"
                aria-describedby="msg-open-new-window"
              >
                Data Usage Agreement
              </a>
            </p>
            <div style={{ float: 'right' }}>
              <DatafilesModal.Download
                api="tapis"
                system="designsafe.storage.published"
                scheme="public"
                selectedFiles={[data]}
              >
                {({ onClick }) => (
                  <Button
                    type="primary"
                    className="success-button"
                    disabled={exceedsLimit}
                    onClick={onClick}
                  >
                    <span>
                      <i className="curation-download" />
                      &nbsp;&nbsp;Download Dataset
                    </span>
                  </Button>
                )}
              </DatafilesModal.Download>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};
