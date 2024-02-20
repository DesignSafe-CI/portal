import axios, { AxiosError } from 'axios';

export type TApiError = AxiosError<{ message?: string }>;

export const apiClient = axios.create({
  timeout: 30000,
  xsrfHeaderName: 'X-CSRFToken',
  xsrfCookieName: 'csrftoken',
});

export default apiClient;
