import { useMutation } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function createFeedbackTicket(formData: {
  name: string;
  email: string;
  body: string;
  projectId: string;
  title: string;
}) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  const res = await apiClient.post(`/help/feedback/`, {
    name: formData.name,
    email: formData.email,
    body: formData.body,
    subject: `Project Feedback for ${formData.projectId}`,
    projectId: formData.projectId,
    title: formData.title,
  });
  return res.data;
}

export function useCreateFeedbackTicket(projectId: string, title: string) {
  return useMutation({
    mutationFn: ({
      formData,
    }: {
      formData: {
        name: string;
        email: string;
        body: string;
        projectId: string;
        title: string;
      };
    }) => createFeedbackTicket(formData),
  });
}
