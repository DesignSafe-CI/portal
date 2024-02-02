import styles from './common-components.module.css';

/* eslint-disable-next-line */
export interface CommonComponentsProps {}

export function CommonComponents(props: CommonComponentsProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to CommonComponents!</h1>
    </div>
  );
}

export default CommonComponents;
