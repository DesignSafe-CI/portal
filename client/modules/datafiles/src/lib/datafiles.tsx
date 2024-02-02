import styles from './datafiles.module.css';

/* eslint-disable-next-line */
export interface DatafilesProps {}

export function Datafiles(props: DatafilesProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to Datafiles!</h1>
    </div>
  );
}

export default Datafiles;
