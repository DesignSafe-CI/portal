import { render } from '@client/test-fixtures';

import { ReconPortal } from './ReconPortal';

describe('ReconPortal', () => {
  it('should render successfully', () => {
    const { getByText } = render(<ReconPortal />);
    expect(getByText(/Leaflet/gi)).toBeTruthy();
    expect(getByText(/Placeholder/gi)).toBeTruthy();
  });
});
