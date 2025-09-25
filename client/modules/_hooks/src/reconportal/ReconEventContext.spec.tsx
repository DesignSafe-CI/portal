import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useReconEventContext, ReconEventProvider } from '@client/hooks';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/test?eventId=test-event']}>
    <Routes>
      <Route
        path="/test"
        element={<ReconEventProvider>{children}</ReconEventProvider>}
      />
    </Routes>
  </MemoryRouter>
);

test('hook reads and updates eventId', () => {
  const { result } = renderHook(() => useReconEventContext(), {
    wrapper,
  });

  expect(result.current.selectedReconPortalEventIdentifier).toBe('test-event');

  act(() => {
    result.current.setSelectedReconPortalEventIdentifier('updated-event');
  });

  expect(result.current.selectedReconPortalEventIdentifier).toBe(
    'updated-event'
  );

  act(() => {
    result.current.setSelectedReconPortalEventIdentifier(null);
  });

  expect(result.current.selectedReconPortalEventIdentifier).toBe(null);
});
