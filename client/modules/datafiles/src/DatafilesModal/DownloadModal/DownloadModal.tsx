import { Modal } from 'antd';
import React, { useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { TFileListing, apiClient } from '@client/hooks';

export const DownloadModal: React.FC<{
  api: string;
  system: string;
  scheme?: string;
  selectedFiles: TFileListing[];
  children: TModalChildren;
}> = ({ api, system, scheme, selectedFiles, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const doiArray = selectedFiles.filter((f) => f.doi).map((f) => f.doi);

  const doiString = doiArray.join(',');

  const showModal = () => {
    setIsModalOpen(true);
  };

  const zipUrl = `/api/datafiles/${api}/${
    scheme ?? 'public'
  }/download/${system}/?doi=${doiString}`;

  const handleDownload = () => {
    apiClient
      .put(zipUrl, { paths: selectedFiles.map((f) => f.path) })
      .then((resp) => {
        const link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute('href', resp.data.href);
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
          direct download. Direct downloads are supported for up to 2 gigabytes
          of data at a time. Alternative approaches for transferring large
          amounts of data are provided in the Large Data Transfer Methods
          section of the Data Transfer Guide (
          <a href="/user-guide/managingdata/datatransfer/">
            https://www.designsafe-ci.org/user-guide/managingdata/datatransfer/
          </a>
          ).
        </p>
      </Modal>
    </>
  );
};
