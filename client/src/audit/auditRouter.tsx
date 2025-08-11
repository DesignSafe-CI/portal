import React from 'react';
import AuditTrail from './AuditTrail';

import { createBrowserRouter } from 'react-router-dom';

const auditRouter = createBrowserRouter([
  {
    path: '/audit',
    element: <AuditTrail />,
  },
]);

export default auditRouter;
