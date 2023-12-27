import styles from './workspace.module.css';

/* eslint-disable-next-line */
export interface WorkspaceProps {}

export function Workspace(props: WorkspaceProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to Workspace!</h1>
    </div>
  );
}

export default Workspace;
