import { createBrowserRouter } from 'react-router-dom';
import Workspace from './Workspace';

const workspaceRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <Workspace />,
    },
  ],
  { basename: '/rw/workspace' }
);

export default workspaceRouter;
