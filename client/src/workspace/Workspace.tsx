// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './WorkspaceListing.module.css';
import { Workspace as WorkspaceListing } from '@client/workspace';

export function Workspace() {
  return (
    <div>
      This component is being rendered from Nx/React with hot reload!
      <WorkspaceListing />
    </div>
  );
}

export default Workspace;
