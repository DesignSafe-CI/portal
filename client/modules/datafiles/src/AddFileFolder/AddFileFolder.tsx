import React from 'react';
import { Button } from 'antd';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import styles from './AddFileFolder.module.css';

export const AddFileFolder: React.FC = () => {
  const { api, system, path } = useFileListingRouteParams();
  const { user } = useAuthenticatedUser();
  return (
    <ul
      style={{
        border: '1px solid #e3e3e3',
        listStyleType: 'none',
        paddingLeft: '0px',
      }}
    >
      {user && (
        <>
          <div style={{ margin: '0 10px 20px' }}>
            <div className="btn-group btn-block">
              <Button
                className="btn btn-block btn-primary dropdown-toggle"
                data-toggle="dropdown"
              >
                <i className="fa fa-plus-circle" role="none"></i> Add
              </Button>
              <ul className="dropdown-menu">
                <li>
                  <DatafilesModal.NewFolder
                    api={api}
                    system={system}
                    path={path}
                  >
                    {({ onClick }) => (
                      <a
                        href="#"
                        className={`${styles.navLink} ${styles.active}`}
                        onClick={(e) => e.preventDefault()}
                      >
                        <span className="fa-stack fa-lg" onClick={onClick}>
                          <i
                            className="fa fa-folder fa-stack-2x"
                            role="none"
                          ></i>
                          <i
                            className="fa fa-plus fa-stack-1x fa-inverse"
                            role="none"
                          ></i>
                        </span>
                        <span onClick={onClick}>New Folder</span>
                      </a>
                    )}
                  </DatafilesModal.NewFolder>
                </li>
                <li>
                  <a href="#" className={`${styles.navLink} ${styles.active}`}>
                    <span className="fa-stack fa-lg">
                      <i className="fa fa-briefcase fa-2x" role="none"></i>
                    </span>
                    <span>New Project</span>
                  </a>
                </li>
                <li role="separator" className="divider"></li>
                <li>
                  <DatafilesModal.UploadFile
                    api={api}
                    system={system}
                    path={path}
                  >
                    {({ onClick }) => (
                      <a
                        href="#"
                        className={`${styles.navLink} ${styles.active}`}
                        onClick={(e) => e.preventDefault()}
                      >
                        <span className="fa-stack fa-lg" onClick={onClick}>
                          <i
                            className="fa fa-file-o fa-stack-2x"
                            role="none"
                          ></i>
                          <i
                            className="fa fa-cloud-upload fa-stack-1x"
                            role="none"
                          ></i>
                        </span>
                        <span onClick={onClick}>File upload: max 2GB</span>
                      </a>
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
                      <a
                        href="#"
                        className={`${styles.navLink} ${styles.active}`}
                        onClick={(e) => e.preventDefault()}
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
                        <span onClick={onClick}>
                          Folder upload: max 25 files
                        </span>
                      </a>
                    )}
                  </DatafilesModal.UploadFolder>
                </li>
                <li
                  onClick={() =>
                    (window.location.href =
                      'https://www.designsafe-ci.org/rw/user-guides/data-transfer-guide/')
                  }
                >
                  <a href="#" className={`${styles.navLink} ${styles.active}`}>
                    <span className="fa-stack fa-lg">
                      <i className="fa fa-hdd-o fa-stack-2x" role="none"></i>
                    </span>
                    <span>Bulk Data Transfer</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </ul>
  );
};
