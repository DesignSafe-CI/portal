import { Dashboard } from '@client/dashboard';
import { BrowserRouter } from 'react-router-dom';

const WrappedDashboard = () => (
  <BrowserRouter>
    <Dashboard />
  </BrowserRouter>
);

export default WrappedDashboard;
