declare global {
  interface Window {
    __authenticatedUser__?: {
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      institution: string;
    };
  }
}

export const useAuthenticatedUser = () => {
  return {
    user: window.__authenticatedUser__,
  };
};
