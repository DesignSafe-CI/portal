import { render } from '@client/test-fixtures';

import { ReconPortalHeader } from './ReconPortalHeader';

describe('ReconPortalHeader', () => {

  it('should render successfully', () => {
    const { getByText } = render(<ReconPortalHeader />);
    expect(getByText(/Header Placeholder/gi)).toBeTruthy();
  });
});
