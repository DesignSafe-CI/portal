export type TSetupStepEvent = {
  step: string;
  username: string;
  state: string;
  time: string;
  message: string;
  data?: {
    setupComplete: boolean;
  } | null;
};

export type TOnboardingStep = {
  step: string;
  displayName: string;
  description: string;
  userConfirm: string;
  staffApprove: string;
  staffDeny: string;
  state?: string | null;
  events: TSetupStepEvent[];
  data?: {
    userlink?: {
      url: string;
      text: string;
    };
  } | null;
  customStatus?: string | null;
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
  total: number;
  totalSteps: number;
};

export type TOnboardingAdminActions =
  | 'staff_approve'
  | 'staff_deny'
  | 'user_confirm'
  | 'complete'
  | 'reset';
