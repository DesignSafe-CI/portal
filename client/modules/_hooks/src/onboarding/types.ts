export type TSetupStepEvent = {
  step: string;
  username: string;
  state: string;
  time: string;
  message: string;
  data?: {
    setupComplete: boolean;
  };
};

export type TOnboardingStep = {
  step: string;
  displayName: string;
  description: string;
  userConfirm: string;
  staffApprove: string;
  staffDeny: string;
  state?: string;
  events: TSetupStepEvent[];
  data?: {
    userlink?: {
      url: string;
      text: string;
    };
  };
  customStatus?: string;
};

export type TOnboardingUser = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: string;
  setupComplete: boolean;
  steps: TOnboardingStep[];
};

export type TOnboardingAdminList = {
  users: TOnboardingUser[];
  offset: number;
  limit: number;
  total: number;
};
