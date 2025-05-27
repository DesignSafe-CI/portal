import React from 'react';
import { Tag, Spin } from 'antd';
import { TOnboardingStep } from '@client/hooks';
import styles from './OnboardingStatus.module.css';

const getContents = (step: TOnboardingStep) => {
  let color = '';
  switch (step.state) {
    case 'processing':
    case 'pending':
      color = 'blue';
      break;
    case 'failed':
    case 'error':
      color = 'red';
      break;
    case 'staffwait':
    case 'userwait':
      color = 'gold';
      break;
    case 'completed':
      color = 'green';
      break;
    case null:
      color = 'volcano';
      break;
    default:
      color = 'blue';
  }
  if ('customStatus' in step) {
    return <Tag color={color}>{step.customStatus}</Tag>;
  }

  if (
    step.events &&
    step.events[0] &&
    step.events[0].message === 'Portal access request has not been approved.'
  ) {
    return <Tag color="red">Denied</Tag>;
  }
  switch (step.state) {
    case 'pending':
      return <Tag color={color}>Preparing</Tag>;
    case 'staffwait':
      return <Tag color="blue">Waiting for Staff Approval</Tag>;
    case 'userwait':
      return <Tag color={color}>Waiting for User</Tag>;
    case 'failed':
      return <Tag color={color}>Unsuccessful, view log</Tag>;
    case 'error':
      return <Tag color={color}>Unsuccessful</Tag>;
    case null:
      return <Tag color={color}>Unavailable</Tag>;
    case 'completed':
      return <Tag color={color}>Completed</Tag>;
    case 'processing':
      return (
        <span className={styles.processing}>
          <Tag color={color}>Processing</Tag>
          <Spin />
        </span>
      );
    default:
      if (step.state) {
        return <Tag color="blue">{step.state}</Tag>;
      }
      return null;
  }
};

export const OnboardingStatus = ({ step }: { step: TOnboardingStep }) => {
  const contents = getContents(step);
  if (!contents) {
    return null;
  }

  return <span className={styles.root}>{getContents(step)}</span>;
};
