import { render } from '@client/test-fixtures';

import { LeafletMap } from './LeafletMap';

describe('Recon Portal leaflet map', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<LeafletMap />);
    expect(baseElement).toBeTruthy();
  });
});
