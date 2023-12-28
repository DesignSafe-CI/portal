// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';
import { Workspace } from '@client/workspace';

export function App() {
  return (
    <div>
      This component is being rendered from Nx/React with hot reload!
      <Workspace />
    </div>
  );
}

export default App;
