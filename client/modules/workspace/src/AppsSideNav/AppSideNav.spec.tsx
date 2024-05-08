import { render, appsListingJson } from '@client/test-fixtures';

import { AppsSideNav } from './AppsSideNav';

describe('AppsSideNav', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <AppsSideNav categories={appsListingJson.categories} />
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have nav text', () => {
    const { getAllByText } = render(
      <AppsSideNav categories={appsListingJson.categories} />
    );
    expect(getAllByText(/Applications:/gi)).toBeTruthy();
  });
});
