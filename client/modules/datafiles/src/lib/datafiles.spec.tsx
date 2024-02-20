import { render } from '@testing-library/react';

import Datafiles from './datafiles';

describe('Datafiles', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Datafiles />);
    expect(baseElement).toBeTruthy();
  });
});
