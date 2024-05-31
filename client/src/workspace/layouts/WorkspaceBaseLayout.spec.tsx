import { render } from '@client/test-fixtures';

import WorkspaceBaseLayout from './WorkspaceBaseLayout';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WorkspaceBaseLayout />);
    expect(baseElement).toBeTruthy();
  });
});
