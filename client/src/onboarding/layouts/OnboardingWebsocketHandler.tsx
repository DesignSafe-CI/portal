import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import {
  TSetupStepEvent,
  TOnboardingUser,
  TOnboardingAdminList,
} from '@client/hooks';

function updateAdminUsersFromEvent(
  oldData: TOnboardingAdminList,
  event: TSetupStepEvent
) {
  return {
    ...oldData,
    users: oldData.users.map((user) =>
      user.username === event.username
        ? { ...updateUserFromEvent(user, event) }
        : user
    ),
  };
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
    queryClient.setQueriesData(
      { queryKey: ['onboarding', 'adminList'], exact: false },
      (oldData) =>
        (oldData as TOnboardingAdminList)?.users
          ? updateAdminUsersFromEvent(oldData as TOnboardingAdminList, event)
          : oldData
    );
    queryClient.setQueryData(
      ['onboarding', 'user', event.username],
      (oldData: TOnboardingUser) =>
        oldData ? updateUserFromEvent(oldData, event) : oldData
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
