import React from 'react';
import { Button } from 'antd';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import styles from './AddFileFolder.module.css';

export const AddFileFolder: React.FC = () => {
  const { api, system, path } = useFileListingRouteParams();
  const { user } = useAuthenticatedUser();
  return (
    <ul className={styles.customUl}>
      {user && (
        <div className={styles.customDiv}>
          <div className="btn-group btn-block">
            <Button
              className="btn btn-block btn-primary dropdown-toggle"
              data-toggle="dropdown"
            >
              <i className="fa fa-plus-circle" role="none"></i> Add
            </Button>
            <ul className="dropdown-menu">
              <li>
                <DatafilesModal.NewFolder api={api} system={system} path={path}>
                  {({ onClick }) => (
                    <Button
                      type="text"
                      className={`${styles.active} ${styles.fullWidthButton}`}
                      onClick={onClick}
                    >
                      <span className="fa-stack fa-lg">
                        <i className="fa fa-folder fa-stack-2x" role="none"></i>
                        <i
                          className="fa fa-plus fa-stack-1x fa-inverse"
                          role="none"
                        ></i>
                      </span>
                      New Folder
                    </Button>
                  )}
                </DatafilesModal.NewFolder>
              </li>
              <li>
                <Button
                  type="text"
                  className={`${styles.active} ${styles.fullWidthButton}`}
                >
                  <span className="fa-stack fa-lg">
                    <i className="fa fa-briefcase fa-2x" role="none"></i>
                  </span>
                  <span>New Project</span>
                </Button>
              </li>
              <li role="separator" className="divider"></li>
              <li>
                <DatafilesModal.UploadFile
                  api={api}
                  system={system}
                  path={path}
                >
                  {({ onClick }) => (
                    <Button
                      type="text"
                      className={`${styles.active} ${styles.fullWidthButton}`}
                      onClick={onClick}
                    >
                      <span className="fa-stack fa-lg" onClick={onClick}>
                        <i className="fa fa-file-o fa-stack-2x" role="none"></i>
                        <i
                          className="fa fa-cloud-upload fa-stack-1x"
                          role="none"
                        ></i>
                      </span>
                      <span onClick={onClick}>File upload: max 2GB</span>
                    </Button>
                  )}
                </DatafilesModal.UploadFile>
              </li>
              <li>
                <DatafilesModal.UploadFolder
                  api={api}
                  system={system}
                  path={path}
                >
                  {({ onClick }) => (
                    <Button
                      type="text"
                      className={`${styles.active} ${styles.fullWidthButton}`}
                      onClick={onClick}
                    >
                      <span className="fa-stack fa-lg" onClick={onClick}>
                        <i
                          className="fa fa-folder-o fa-stack-2x"
                          role="none"
                        ></i>
                        <i
                          className="fa fa-cloud-upload fa-stack-1x"
                          role="none"
                        ></i>
                      </span>
                      <span onClick={onClick}>Folder upload: max 25 files</span>
                    </Button>
                  )}
                </DatafilesModal.UploadFolder>
              </li>
              <li
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href =
                    'https://www.designsafe-ci.org/rw/user-guides/data-transfer-guide/';
                }}
              >
                <Button
                  type="text"
                  className={`${styles.active} ${styles.fullWidthButton}`}
                >
                  <span className="fa-stack fa-lg">
                    <i className="fa fa-hdd-o fa-stack-2x" role="none"></i>
                  </span>
                  <span>Bulk Data Transfer</span>
                </Button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </ul>
  );
};
