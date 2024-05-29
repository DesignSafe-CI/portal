import { Icon } from '@client/common-components';
import styles from './AppIcon.module.css';

const AppIcon: React.FC<{ name: string }> = ({ name }) => {
  const className = `ds-icon ds-icon-${name}`;
  return <Icon className={`${className} ${styles.root}`} label={name} />;
};

export default AppIcon;
