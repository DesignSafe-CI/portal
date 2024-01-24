import axios from 'axios';

const apiClient = axios.create({
  timeout: 30000,
  xsrfHeaderName: 'X-CSRFToken',
  xsrfCookieName: 'csrftoken',
});

export default apiClient;
