import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TJobPostOperations = 'resubmitJob' | 'cancelJob' | 'submitJob';

type TJobBody = {
  operation: TJobPostOperations;
  uuid?: string;
  job?: FormData;
  licenseType?: string | null;
  isInteractive?: boolean;
};

async function postJobs(body: TJobBody) {
  const res = await apiClient.post(`/api/workspace/jobs`, body);
  return res.data.response;
}

export function usePostJobs() {
  return useMutation({
    mutationFn: (body: TJobBody) => {
      return postJobs(body);
    },
  });
}

export default usePostJobs;
