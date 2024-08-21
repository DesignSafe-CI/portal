import { render } from '@client/test-fixtures';

import { JobStatusNav } from './JobStatusNav';

describe('JobStatusNav', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<JobStatusNav />);
    expect(baseElement).toBeTruthy();
  });

  it('should have nav text', () => {
    const { getByText } = render(<JobStatusNav />);
    expect(getByText(/Job Status/gi)).toBeTruthy();
  });
});
