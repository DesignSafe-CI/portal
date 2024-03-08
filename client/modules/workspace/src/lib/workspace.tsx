import styles from './workspace.module.css';
import { useAppsListing } from '@client/hooks';
import { uuid } from 'uuidv4';

/* eslint-disable-next-line */
export interface WorkspaceProps {}

export function Workspace(props: WorkspaceProps) {
  const { data, isLoading } = useAppsListing();

  return (
    <div className={styles['container']}>
      <h1>Welcome to Workspace!</h1>
      {isLoading && <div>Loading app listing...</div>}
      {data && (
        <>
          {data.categories.map((category) => (
            <div key={uuid()}>
              <h3>{category.title}</h3>
              <ul>
                {category.apps.map((app) => (
                  <li key={uuid()}>{app.app_id}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Workspace;
