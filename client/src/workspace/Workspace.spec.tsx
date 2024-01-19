import { render } from '@client/test-fixtures';

import Workspace from './Workspace';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Workspace />);
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(<Workspace />);
    expect(getByText(/Welcome/gi)).toBeTruthy();
  });
});
