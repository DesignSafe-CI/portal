import React from 'react';
import { Button } from 'antd';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import {
  useAuthenticatedUser,
  useFileListingRouteParams,
  useProjectDetail,
} from '@client/hooks';
import styles from './AddFileFolder.module.css';
import { BaseProjectCreateModal } from '../projects/modals/BaseProjectCreateModal';
import { useMatches, useParams } from 'react-router-dom';
export const AddFileFolder: React.FC = () => {
  const routeParams = useFileListingRouteParams();
  const { path } = routeParams;
  let { api, system } = routeParams;

  const { user } = useAuthenticatedUser();

  let { projectId } = useParams();

  const matches = useMatches();
  const isProjects = matches.find((m) => m.id === 'project');
  const isPublished = matches.find((m) => m.id === 'published');
  const isNees = matches.find((m) => m.id === 'nees');

  const isReadOnly = !!(
    (isProjects && !projectId) ||
    isPublished ||
    isNees ||
    system === 'designsafe.storage.community'
  );

  if (!isProjects) projectId = '';
  const { data } = useProjectDetail(projectId ?? '');
  if (projectId) {
    system = `project-${data?.baseProject.uuid}`;
    api = 'tapis';
  }

  if (!user) return null;

  return (
    <ul className={styles.customUl}>
      <div className={styles.customDiv}>
        <div className="btn-group btn-block">
          <Button
            className="btn btn-block btn-primary dropdown-toggle"
            data-toggle="dropdown"
          >
            <i className="fa fa-plus-circle" role="none"></i>&nbsp;Add
          </Button>
          <ul className="dropdown-menu">
            <li>
              <DatafilesModal.NewFolder api={api} system={system} path={path}>
                {({ onClick }) => (
                  <Button
                    disabled={isReadOnly}
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
                    &nbsp;New Folder
                  </Button>
                )}
              </DatafilesModal.NewFolder>
            </li>
            <li>
              <BaseProjectCreateModal>
                {({ onClick }) => (
                  <Button
                    onClick={onClick}
                    type="text"
                    className={`${styles.active} ${styles.fullWidthButton}`}
                  >
                    <span className="fa-stack fa-lg">
                      <i className="fa fa-briefcase fa-2x" role="none"></i>
                    </span>
                    <span>&nbsp;New Project</span>
                  </Button>
                )}
              </BaseProjectCreateModal>
            </li>
            <li role="separator" className="divider"></li>
            <li>
              <DatafilesModal.UploadFile api={api} system={system} path={path}>
                {({ onClick }) => (
                  <Button
                    disabled={isReadOnly}
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
                    &nbsp;
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
                    disabled={isReadOnly}
                    type="text"
                    className={`${styles.active} ${styles.fullWidthButton}`}
                    onClick={onClick}
                  >
                    <span className="fa-stack fa-lg" onClick={onClick}>
                      <i className="fa fa-folder-o fa-stack-2x" role="none"></i>
                      <i
                        className="fa fa-cloud-upload fa-stack-1x"
                        role="none"
                      ></i>
                    </span>
                    &nbsp;
                    <span onClick={onClick}>Folder upload: max 25 files</span>
                  </Button>
                )}
              </DatafilesModal.UploadFolder>
            </li>
            <li>
              <a
                href="https://www.designsafe-ci.org/rw/user-guides/data-transfer-guide/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '0px' }}
              >
                <Button
                  disabled={isReadOnly}
                  type="text"
                  className={`${styles.active} ${styles.fullWidthButton}`}
                >
                  <span className="fa-stack fa-lg">
                    <i className="fa fa-hdd-o fa-stack-2x" role="none"></i>
                  </span>
                  &nbsp;
                  <span>Bulk Data Transfer</span>
                </Button>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </ul>
  );
};
