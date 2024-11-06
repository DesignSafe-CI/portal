import { render } from '@client/test-fixtures';
import { OnboardingStatus } from './OnboardingStatus';
import { TOnboardingStep } from '@client/hooks';
import { describe, it, expect } from 'vitest';

describe('OnboardingStatus Component', () => {
  const renderComponent = (step: TOnboardingStep) =>
    render(<OnboardingStatus step={step} />);

  it('should render Preparing tag for pending state', () => {
    const step = { state: 'pending' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Preparing')).toBeTruthy();
  });

  it('should render Waiting for Staff Approval tag for staffwait state', () => {
    const step = { state: 'staffwait' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Waiting for Staff Approval')).toBeTruthy();
  });

  it('should render Waiting for User tag for userwait state', () => {
    const step = { state: 'userwait' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Waiting for User')).toBeTruthy();
  });

  it('should render Unsuccessful tag for failed state', () => {
    const step = { state: 'failed' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Unsuccessful')).toBeTruthy();
  });

  it('should render Unsuccessful tag for error state', () => {
    const step = { state: 'error' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Unsuccessful')).toBeTruthy();
  });

  it('should render Unavailable tag for null state', () => {
    const step = { state: null } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Unavailable')).toBeTruthy();
  });

  it('should render Completed tag for completed state', () => {
    const step = { state: 'completed' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Completed')).toBeTruthy();
  });

  it('should render Processing tag and Spin for processing state', () => {
    const step = { state: 'processing' } as TOnboardingStep;
    const { getByText, container } = renderComponent(step);
    expect(getByText('Processing')).toBeTruthy();
    expect(container.querySelector('.ant-spin')).toBeTruthy();
  });

  it('should render custom status if customStatus is present', () => {
    const step = {
      state: 'pending',
      customStatus: 'Custom Status',
    } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('Custom Status')).toBeTruthy();
  });

  it('should render default tag for unknown state', () => {
    const step = { state: 'unknown' } as TOnboardingStep;
    const { getByText } = renderComponent(step);
    expect(getByText('unknown')).toBeTruthy();
  });

  it('should render null if no state is provided', () => {
    const step = {} as TOnboardingStep;
    const { container } = renderComponent(step);
    expect(container.firstChild).toBeNull();
  });

  it('should render correct color for each state', () => {
    const states = [
      { state: 'pending', color: 'blue' },
      { state: 'staffwait', color: 'blue' },
      { state: 'userwait', color: 'gold' },
      { state: 'failed', color: 'red' },
      { state: 'error', color: 'red' },
      { state: null, color: 'volcano' },
      { state: 'completed', color: 'green' },
      { state: 'processing', color: 'blue' },
    ];

    states.forEach(({ state, color }) => {
      const step = { state } as TOnboardingStep;
      const { container } = renderComponent(step);
      const tag = container.querySelector('.ant-tag');
      expect(Object.values(tag?.classList || {})).toContain(`ant-tag-${color}`);
    });
  });
});
