import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';
import {
  TJobArgSpecs,
  TJobKeyValuePair,
  TAppFileInput,
  TTapisJob,
} from './types';

export type TJobPostOperations = 'resubmitJob' | 'cancelJob' | 'submitJob';

export type TParameterSetSubmit = {
  appArgs: TJobArgSpecs;
  containerArgs: TJobArgSpecs;
  schedulerOptions: TJobArgSpecs;
  envVariables: TJobKeyValuePair[];
};

export type TConfigurationValues = {
  execSystemId?: string;
  execSystemLogicalQueue?: string;
  maxMinutes: number;
  nodeCount?: number;
  coresPerNode?: number;
  allocation?: string;
};

export type TOutputValues = {
  name: string;
  archiveSystemId: string;
  archiveSystemDir: string;
};

export interface TJobSubmit extends TConfigurationValues, TOutputValues {
  archiveOnAppError: boolean;
  appId: string;
  appVersion: string;
  fileInputs: TAppFileInput[];
  parameterSet: TParameterSetSubmit;
}

export type TJobBody = {
  operation: TJobPostOperations;
  uuid?: string;
  job?: TJobSubmit;
  licenseType?: string;
  isInteractive?: boolean;
};

type TJobPostResponse = {
  response: TTapisJob;
  status: number;
};

async function postJobs(body: TJobBody) {
  const res = await apiClient.post<TJobPostResponse>(
    `/api/workspace/jobs`,
    body
  );
  return res.data.response;
}

export function usePostJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TJobBody) => {
      return postJobs(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace', 'jobsListing'],
      });
    },
  });
}

export default usePostJobs;
