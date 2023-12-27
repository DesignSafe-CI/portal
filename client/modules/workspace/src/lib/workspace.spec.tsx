import { render } from '@testing-library/react';

import Workspace from './workspace';

describe('Workspace', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Workspace />);
    expect(baseElement).toBeTruthy();
  });
});
