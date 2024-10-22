export type TUser = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  homedir: string;
};

declare global {
  interface Window {
    __authenticatedUser__?: TUser;
  }
}

export const useAuthenticatedUser = () => {
  return {
    user: window.__authenticatedUser__,
  };
};
