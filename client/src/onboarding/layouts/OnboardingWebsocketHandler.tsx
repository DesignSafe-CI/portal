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

function updateUserFromEvent(user: TOnboardingUser, event: TSetupStepEvent) {
  const result = { ...user };

  if (result.username === event.username) {
    if (event.step === 'portal.apps.onboarding.execute.execute_setup_steps') {
      result.setupComplete = !!event.data?.setupComplete;
    }
    const foundStep = result.steps.find((step) => step.step === event.step);
    if (foundStep) {
      foundStep.events.unshift(event);
      foundStep.state = event.state;
    }
  }
  return result;
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
