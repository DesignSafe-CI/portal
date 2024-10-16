import { Suspense } from 'react';
import { Layout } from 'antd';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spinner } from '@client/common-components';
// import { OnboardingAdminLayout } from './layouts/OnboardingAdminLayout';
import { OnboardingUserLayout } from './layouts/OnboardingUserLayout';

const onboardingRouter = createBrowserRouter(
  [
    // {
    //   id: 'admin',
    //   path: 'admin',
    //   element: <OnboardingAdminLayout />,
    // },
    {
      path: `setup/:username?`,
      element: (
        <Suspense
          fallback={
            <Layout>
              <Spinner />
            </Layout>
          }
        >
          <OnboardingUserLayout />
        </Suspense>
      ),
    },
    {
      path: '*',
      element: <Navigate to={'/setup'} replace={true} />,
    },
  ],
  { basename: '/onboarding' }
);

export default onboardingRouter;
