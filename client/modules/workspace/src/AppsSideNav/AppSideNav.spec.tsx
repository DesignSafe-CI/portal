import { render } from '@client/test-fixtures';

import { AppsSideNav } from './AppsSideNav';

describe('AppsSideNav', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AppsSideNav />);
    expect(baseElement).toBeTruthy();
  });

  it('should have nav text', () => {
    const { getAllByText } = render(<AppsSideNav />);
    expect(getAllByText(/Applications:/gi)).toBeTruthy();
  });
});
