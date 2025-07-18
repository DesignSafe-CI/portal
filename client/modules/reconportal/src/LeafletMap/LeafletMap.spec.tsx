import { render } from '@client/test-fixtures';
import { LeafletMap } from './LeafletMap';
import { ReconEventProvider } from '@client/hooks';

describe('Recon Portal leaflet map', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <ReconEventProvider>
        <LeafletMap />
      </ReconEventProvider>
    );
    expect(baseElement).toBeTruthy();
  });
});
