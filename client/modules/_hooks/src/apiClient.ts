import axios, { AxiosError } from 'axios';

export type TApiError = AxiosError<{ message?: string }>;

export const apiClient = axios.create({
  timeout: 60 * 1000, // 1 minute
  xsrfHeaderName: 'X-CSRFToken',
  xsrfCookieName: 'csrftoken',
});

export default apiClient;
