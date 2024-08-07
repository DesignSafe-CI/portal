import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { TTapisJob } from '@client/hooks';
import { SecondaryButton } from '@client/common-components';

export const JobsReuseInputsButton: React.FC<{
  job: TTapisJob;
  isSecondaryButton?: boolean;
}> = ({ job, isSecondaryButton = false }) => {
  const navigate = useNavigate();

  const handleReuseInputs = () => {
    const path =
      '/' +
      `${job.appId}` +
      (job.appVersion ? `?appVersion=${job.appVersion}` : '') +
      `&jobUUID=${job.uuid}`;
    navigate(path);
  };

  return isSecondaryButton ? (
    <SecondaryButton size="small" onClick={() => handleReuseInputs()}>
      Reuse Inputs
    </SecondaryButton>
  ) : (
    <Button size="middle" onClick={() => handleReuseInputs()} type="primary">
      Reuse Inputs
    </Button>
  );
};
