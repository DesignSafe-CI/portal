import { render } from '@client/test-fixtures';

import WorkspaceBaseLayout from './WorkspaceBaseLayout';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WorkspaceBaseLayout />);
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(<WorkspaceBaseLayout />);
    expect(getByText(/Tools and Applications/gi)).toBeTruthy();
  });
});
