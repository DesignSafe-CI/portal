import { Modal } from 'antd';
import React, { useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { TFileListing, apiClient } from '@client/hooks';
import { MicrosurveyModal } from '../MicrosurveyModal';

export const DownloadModal: React.FC<{
  api: string;
  system: string;
  scheme?: string;
  selectedFiles: TFileListing[];
  children: TModalChildren;
}> = ({ api, system, scheme, selectedFiles, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMicrosurveyOpen, setIsMicrosurveyOpen] = useState(false);

  const doiArray = selectedFiles.filter((f) => f.doi).map((f) => f.doi);

  const doiString = doiArray.join(',');

  let fileName: string | undefined = undefined;
  if (selectedFiles.length === 1 && selectedFiles[0].format === 'folder') {
    fileName = selectedFiles[0].name;
  }

  const showModal = () => {
    setIsModalOpen(true);
  };

  let downloadUrl = '';
  if (api === 'dropbox') {
    const selectedFile = selectedFiles[0];
    downloadUrl = `/api/datafiles/${api}/${scheme ?? 'public'}/preview/${
      selectedFile?.system
    }/${selectedFile?.path}/`;
  } else {
    downloadUrl = `/api/datafiles/${api}/${
      scheme ?? 'public'
    }/download/${system}/?doi=${doiString}`;
  }

  const handleDownload = () => {
    if (system === 'designsafe.storage.published') {
      apiClient.put('/api/datafiles/microsurvey/').then((resp) => {
        if (resp.data.show) {
          setIsMicrosurveyOpen(true);
        }
      });
    }

    const putBody =
      api === 'tapis' ? { paths: selectedFiles.map((f) => f.path) } : {};

    apiClient
      .put(downloadUrl.toString(), putBody)
      .then((resp) => {
        const link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute(
          'href',
          fileName
            ? `${resp.data.href}?filename=${fileName}.zip`
            : resp.data.href
        );
        link.setAttribute('download', 'null');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((e) => {
        console.log(e);
        if (e.response.status === 413) {
          showModal();
        }
      });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {React.createElement(children, { onClick: handleDownload })}
      <Modal
        open={isModalOpen}
        title={<h2>Data Transfer Help</h2>}
        onCancel={handleCancel}
        cancelButtonProps={{ hidden: true }}
        onOk={handleCancel}
      >
        <p>
          The data set that you are attempting to download is too large for a
          direct download. Direct downloads are supported for up to 5 gigabytes
          of data at a time. Alternative approaches for transferring large
          amounts of data are provided in the Large Data Transfer Methods
          section of the Data Transfer Guide (
          <a href="/user-guide/managingdata/datatransfer/">
            https://www.designsafe-ci.org/user-guide/managingdata/datatransfer/
          </a>
          ). When using Cyberduck, Globus, or Command Line Interface, a
          project’s datasets/files are accessible at the following path:
          <strong>
            data.tacc.utexas.edu/corral/projects/NHERI/published/published-data/PRJ-####
          </strong>
          .
        </p>
        <div hidden={!(system === 'designsafe.storage.published')}>
          <p>
            This data directory is accessible on{' '}
            <strong>data.tacc.utexas.edu</strong> at the following path:
          </p>
          <p>
            <code>{`/corral/projects/NHERI/published/published-data/${selectedFiles[0]?.name}`}</code>
          </p>
        </div>
      </Modal>
      <MicrosurveyModal
        isModalOpen={isMicrosurveyOpen}
        setIsModalOpen={setIsMicrosurveyOpen}
      />
    </>
  );
};
