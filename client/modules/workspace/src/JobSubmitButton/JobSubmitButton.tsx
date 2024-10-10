import React from 'react';
import { PrimaryButton } from '@client/common-components';

export const JobSubmitButton: React.FC<{
  loading: boolean;
  interactive: boolean | undefined;
  disabled?: boolean;
}> = ({ loading, interactive, disabled = false }) => {
  return (
    <PrimaryButton
      disabled={disabled}
      htmlType="submit"
      loading={loading}
      style={{ width: 150 }}
    >
      {interactive ? 'Launch Session' : 'Submit Job'}
    </PrimaryButton>
  );
};
