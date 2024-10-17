import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import {
  TSetupStepEvent,
  TOnboardingUser,
  TOnboardingAdminList,
} from '@client/hooks';

function updateAdminUsersFromEvent(
  adminUsers: TOnboardingUser[],
  event: TSetupStepEvent
) {
  const result = [...adminUsers];
  const matchingIndex = adminUsers.findIndex(
    (user) => user.username === event.username
  );
  if (matchingIndex > -1) {
    result[matchingIndex] = updateUserFromEvent(result[matchingIndex], event);
  }
  return result;
}

function updateUserFromEvent(oldData: TOnboardingUser, event: TSetupStepEvent) {
  return {
    ...oldData,
    setupComplete: !!event.data?.setupComplete,
    steps: [
      ...oldData.steps.map((step) => {
        if (step.step === event.step) {
          return {
            ...step,
            state: event.state,
            events: [event, ...step.events],
          };
        }
        return step;
      }),
    ],
  };
}

const OnboardingWebsocketHandler = () => {
  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );
  const queryClient = useQueryClient();
  const processSetupEvent = (event: TSetupStepEvent) => {
    queryClient.setQueryData(
      ['onboarding', 'adminList'],
      (oldData: TOnboardingAdminList) => {
        return oldData?.users
          ? {
              ...oldData,
              users: updateAdminUsersFromEvent(oldData.users, event),
            }
          : oldData;
      }
    );
    queryClient.setQueryData(
      ['onboarding', 'user', event.username],
      (oldData: TOnboardingUser) => updateUserFromEvent(oldData, event)
    );
  };

  useEffect(() => {
    if (lastMessage !== null) {
      const event = JSON.parse(lastMessage.data);
      if ((event.event_type = 'setup_event')) {
        processSetupEvent(event.setup_event);
      }
    }
  }, [lastMessage]);

  return null;
};

export default OnboardingWebsocketHandler;
