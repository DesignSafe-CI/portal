import { render } from '@client/test-fixtures';
import Workspace from './workspace';

describe('Workspace', () => {
  it('should render successfully', async () => {
    const { baseElement, findByText } = render(<Workspace />);
    expect(baseElement).toBeTruthy();
    expect(await findByText(/openfoam/)).toBeTruthy();
  });
});
