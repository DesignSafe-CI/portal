import React from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { Layout, Space } from 'antd';
import { SecondaryButton } from '@client/common-components';
// import {} from '@client/onboarding';
import {
  useAuthenticatedUser,
  useGetOnboardingUserSuspense,
} from '@client/hooks';
import styles from './layout.module.css';

export const OnboardingUserLayout: React.FC = () => {
  const { user: authenticatedUser } = useAuthenticatedUser();
  const { username } = useParams();
  const { data: onboardingUser } = useGetOnboardingUserSuspense(
    username || (authenticatedUser?.username as string)
  );

  const { Header } = Layout;
  const headerStyle = {
    background: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid #707070',
    fontSize: 16,
  };

  return (
    <>
      <Layout style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Header style={headerStyle}>
            {authenticatedUser?.isStaff
              ? `Onboarding Administration for ${onboardingUser.username} - ${onboardingUser.lastName}, ${onboardingUser.firstName}`
              : 'The following steps must be completed before accessing the portal'}
          </Header>
          <>
            {onboardingUser.steps.map((step) => (
              // <OnboardingStep step={step} key={uuidv4()} />
              <div key={step.step}>{step.displayName}</div>
            ))}
            <div className={styles.access}>
              <Link className="wb-link" to={`tickets/create`}>
                Get Help
              </Link>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <SecondaryButton
                href="/dashboard/"
                disabled={!onboardingUser.setupComplete}
              >
                Continue
              </SecondaryButton>
            </div>
          </>
        </Space>
      </Layout>
      <Outlet />
    </>
  );
};
