import styles from './workspace.module.css';
import { useAppsListing } from '@client/hooks';

/* eslint-disable-next-line */
export interface WorkspaceProps {}

export function Workspace(props: WorkspaceProps) {
  const { data, isLoading } = useAppsListing();

  return (
    <div className={styles['container']}>
      <h1>Welcome to Workspace!</h1>
      {isLoading && <div>Loading app listing...</div>}
      {data && (
        <ul>
          {data.map((appMeta) => (
            <li key={appMeta.uuid}>{appMeta.value.definition.id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Workspace;
