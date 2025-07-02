import { render } from '@client/test-fixtures';

import { ReconPortal } from './ReconPortal';
import { ReconEventProvider } from '@client/hooks';

describe('ReconPortal', () => {
  it('should render successfully', () => {
    const { getByText } = render(
      <ReconEventProvider>
        <ReconPortal />
      </ReconEventProvider>
    );
    expect(getByText(/Leaflet/gi)).toBeTruthy();
  });
});
