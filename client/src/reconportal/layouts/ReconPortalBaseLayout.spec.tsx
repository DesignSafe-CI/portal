import { render } from '@client/test-fixtures';
import ReconPortalBaseLayout from './ReconPortalBaseLayout';
import { vi } from 'vitest';

vi.mock('@client/reconportal', () => ({
  ReconSidePanel: () => (
    <div data-testid="mocked-recon-side-panel">Mocked ReconSidePanel</div>
  ),
  LeafletMap: () => (
    <div data-testid="mocked-leaflet-map">Mocked LeafletMap</div>
  ),
}));

describe('ReconPortal', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ReconPortalBaseLayout />);
    expect(baseElement).toBeTruthy();
  });
});
