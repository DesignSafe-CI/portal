import { render, appsListingJson } from '@client/test-fixtures';

import { AppsSideNav } from './AppsSideNav';
import type { TAppCategory } from '@client/hooks';

const categories: TAppCategory[] = appsListingJson.categories.map(
  (category) => ({
    ...category,
    apps: category.apps.map((app) => ({
      ...app,
      bundle_category: category.title,
      bundle_href: '',
      priority: 0,
    })),
  })
);

describe('AppsSideNav', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AppsSideNav categories={categories} />);
    expect(baseElement).toBeTruthy();
  });

  it('should have nav text', () => {
    const { getAllByText } = render(<AppsSideNav categories={categories} />);
    expect(getAllByText(/Applications:/gi)).toBeTruthy();
  });
});
