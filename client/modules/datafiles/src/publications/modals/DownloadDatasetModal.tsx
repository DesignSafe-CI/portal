import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import DatafilesModal from '../../DatafilesModal/DatafilesModal';
import { usePublicationDetail } from '@client/hooks';

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

  //const { selectedVersion } = usePublicationVersions(projectId);
  const { data: publicationData } = usePublicationDetail(projectId);
  const doiString = publicationData?.tree.children
    .map((c) => c.value.dois?.[0])
    .filter((doi) => !!doi)
    .join(',');

  //const archivePath =
  //  selectedVersion > 1
  //    ? `/archives/${projectId}v${selectedVersion}_archive.zip`
  //    : `/archives/${projectId}_archive.zip`;

  // const archivePath = `/published-data/${projectId}`;

  /*
  const { data, isError, isLoading } = useFileDetail(
    'tapis',
    'designsafe.storage.published',
    'public',
    archivePath,
    isModalOpen
  );
  const FILE_SIZE_LIMIT = 5368709120; // 5 GB
  const exceedsLimit = useMemo(
    () => (data?.length ?? 0) > FILE_SIZE_LIMIT,
    [data?.length]
  );
  */

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
        <>
          <p />

          <p>
            This download is a ZIP file of the complete project dataset. To
            download the metadata only,&nbsp;
            <DatafilesModal.Download
              api="tapis"
              system="designsafe.storage.published"
              scheme="public"
              selectedFiles={[
                {
                  system: 'designsafe.storage.published',
                  format: 'folder',
                  type: 'dir',
                  mimeType: '',
                  lastModified: '',
                  length: 0,
                  permissions: '',
                  name: projectId,
                  path: `/published-data/${projectId}/${projectId}_metadata.json`,
                  doi: doiString,
                },
              ]}
            >
              {({ onClick }) => (
                <Button type="link" onClick={onClick}>
                  click here
                </Button>
              )}
            </DatafilesModal.Download>
            .
          </p>

          <hr />
          <p>The files are licensed by the following:</p>
          {license && LICENSE_INFO_MAP[license]}
          <p>
            <a
              href="/user-guide/curating/policies/#data-publication-and-usage"
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
              selectedFiles={[
                {
                  system: 'designsafe.storage.published',
                  format: 'folder',
                  type: 'dir',
                  mimeType: '',
                  lastModified: '',
                  length: 0,
                  permissions: '',
                  name: projectId,
                  path: `/published-data/${projectId}`,
                  doi: doiString,
                },
              ]}
            >
              {({ onClick }) => (
                <Button
                  type="primary"
                  className="success-button"
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
      </Modal>
    </>
  );
};
