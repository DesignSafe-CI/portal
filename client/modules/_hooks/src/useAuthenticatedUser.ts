export type TUser = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  homedir: string;
  isStaff: boolean;
  orcidId?: string;
  setupComplete: boolean;
};

declare global {
  interface Window {
    __authenticatedUser__?: TUser;
    __DEBUG__?: boolean;
  }
}

export const useAuthenticatedUser = () => {
  return {
    user: window.__authenticatedUser__,
  };
};
