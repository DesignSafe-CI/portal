import { render } from '@testing-library/react';

import CommonComponents from './common-components';

describe('CommonComponents', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CommonComponents />);
    expect(baseElement).toBeTruthy();
  });
});
