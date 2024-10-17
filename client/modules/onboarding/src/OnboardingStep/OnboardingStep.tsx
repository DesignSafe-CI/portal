import React from 'react';
import parse from 'html-react-parser';
import OnboardingStatus from '../OnboardingStatus/OnboardingStatus';
import OnboardingActions from '../OnboardingActions/OnboardingActions';
import { TOnboardingStep } from '@client/hooks';
import styles from './OnboardingStep.module.css';

export const OnboardingStep = ({ step }: { step: TOnboardingStep }) => {
  const styleName = `${styles.root} ${
    step.state === styles.pending ? 'disabled' : ''
  }`;
  return (
    <div className={styleName}>
      <div className={styles.name}>{step.displayName}</div>
      <div className={styles.description}>{parse(step.description)}</div>
      <div className={styles.status}>
        <OnboardingStatus step={step} />
        <OnboardingActions step={step} />
      </div>
    </div>
  );
};
