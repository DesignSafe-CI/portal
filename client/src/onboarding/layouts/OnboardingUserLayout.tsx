import React from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Space } from 'antd';
import { PrimaryButton } from '@client/common-components';
import { OnboardingStep } from '@client/onboarding';
import {
  useAuthenticatedUser,
  useGetOnboardingUserSuspense,
} from '@client/hooks';
import styles from './OnboardingUserLayout.module.css';

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
    <Layout style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Header style={headerStyle}>
          {authenticatedUser?.isStaff
            ? `Onboarding Administration for ${onboardingUser.username} - ${onboardingUser.lastName}, ${onboardingUser.firstName}`
            : ''}
        </Header>
        <>
          {onboardingUser.steps.map((step) => (
            <OnboardingStep step={step} key={step.step} />
          ))}
          <div className={styles.access}>
            <a
              rel="noopener noreferrer"
              target="_blank"
              className="wb-link"
              href="https://www.designsafe-ci.org/help/submit-ticket/"
            >
              Get Help
            </a>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <PrimaryButton
              href="/dashboard/"
              disabled={!onboardingUser.setupComplete}
            >
              Continue
            </PrimaryButton>
          </div>
        </>
      </Space>
    </Layout>
  );
};
