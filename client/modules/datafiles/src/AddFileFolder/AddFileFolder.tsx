import React from 'react';
import { Button} from 'antd';
import { NavLink } from 'react-router-dom';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import { 
    useAuthenticatedUser,
    useFileListingRouteParams,
    useSelectedFiles, 
} from '@client/hooks';

const DataFilesNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  return (
    <li>
      <NavLink to={to} >
        <div>{children}</div>
      </NavLink>
    </li>
  );
};

export const AddFileFolder: React.FC = () => {
  const { api, system, scheme, path } = useFileListingRouteParams();
  const { selectedFiles } = useSelectedFiles(api, system, path);
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
                        <DatafilesModal.NewFolder api={api} system={system} path={path}>
                        {({ onClick }) => (
                            <>
                                <span className="fa-stack fa-lg" onClick={onClick}>
                                <i className="fa fa-folder fa-stack-2x" role="none"></i>
                                <i className="fa fa-plus fa-stack-1x fa-inverse" role="none"></i>
                                </span>
                                <span onClick={onClick}>New Folder</span>
                            </>
                            )}    
                        </DatafilesModal.NewFolder>
                    </li>
                    <li>
                        <span className="fa-stack fa-lg">
                            <i className="fa fa-briefcase fa-2x" role="none"></i>
                        </span>
                        <span>New Project</span>   
                     </li>
                    <li role="separator" className="divider"></li>
                    <li>
                        <span className="fa-stack fa-lg">
                            <i className="fa fa-file-o fa-stack-2x" role="none"></i>
                            <i className="fa fa-cloud-upload fa-stack-1x" role="none"></i>
                        </span>
                        <span>File upload: max 2GB</span>   
                    </li>
                    <li>
                        <span className="fa-stack fa-lg">
                            <i className="fa fa-folder-o fa-stack-2x" role="none"></i>
                            <i className="fa fa-cloud-upload fa-stack-1x" role="none"></i>
                        </span>
                        <span>Folder upload: max 25 files</span>   
                    </li>
                    <li>
                        <a href='https://www.designsafe-ci.org/rw/user-guides/data-transfer-guide/' ></a>
                        <span className="fa-stack fa-lg">
                            <i className="fa fa-hdd-o fa-stack-2x" role="none"></i>
                        </span>
                        <span>Bulk Data Transfer</span>   
                    </li>
                </ul>
                
            </div>
        </div>
          
        </>
      )}
    </ul>
  );
};
