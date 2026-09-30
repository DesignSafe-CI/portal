import { TFileListing } from '@client/hooks';
import { OpenInJupyterButton } from './FileListing';
import { screen } from '@testing-library/dom';
import { render } from '@client/test-fixtures';

const notebookInCommunity = {
  system: 'designsafe.storage.community',
  type: 'file',
  format: 'raw',
  mimeType: null,
  path: '/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb',
  name: '02-elastic_bar_linear_fem.ipynb',
  length: 66778,
  lastModified: '2019-05-22T20:09:38Z',
  _links: {
    self: {
      href: 'tapis://designsafe.storage.community/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb',
    },
  },
  isPreviewable: true,
} as TFileListing;

const notebookInPublished = {
  system: 'designsafe.storage.published',
  type: 'file',
  format: 'raw',
  mimeType: null,
  path: '/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb',
  name: '02-elastic_bar_linear_fem.ipynb',
  length: 66778,
  lastModified: '2019-05-22T20:09:38Z',
  _links: {
    self: {
      href: 'tapis://designsafe.storage.community/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb',
    },
  },
  isPreviewable: true,
} as TFileListing;

const notebookInMyData = {
  system: 'designsafe.storage.default',
  type: 'file',
  format: 'raw',
  mimeType: null,
  path: '/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb',
  name: '02-elastic_bar_linear_fem.ipynb',
  length: 66778,
  lastModified: '2019-05-22T20:09:38Z',
  _links: {
    self: {
      href: 'tapis://designsafe.storage.community/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb',
    },
  },
  isPreviewable: true,
} as TFileListing;

const nonNotebookFile = {
  system: 'designsafe.storage.community',
  type: 'file',
  format: 'raw',
  mimeType: null,
  path: '/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear.txt',
  name: '02-elastic_bar_linear.txt',
  length: 66778,
  lastModified: '2019-05-22T20:09:38Z',
  _links: {
    self: {
      href: 'tapis://designsafe.storage.community/Jupyter Notebooks for Civil Engineering Courses/Univ of Texas _ FiniteElementAnalyses in GeotechnicalEngineering/notebooks/02-elastic_bar_linear.txt',
    },
  },
  isPreviewable: true,
} as TFileListing;

const userData = {
  username: 'testuser',
  firstName: 'test',
  lastName: 'user',
  institution: 'inst',
  email: 'test@test.test',
  isStaff: false,
  homedir: '/',
  setupComplete: true,
};

afterEach(() => {
  global.window.__authenticatedUser__ = undefined;
});

describe('OpenInJupyterButton', () => {
  it('render Jupyter link for notebook in Community Data', () => {
    global.window.__authenticatedUser__ = userData;
    render(<OpenInJupyterButton file={notebookInCommunity} />);
    expect(screen.getByRole('link').getAttribute('href')).toEqual(
      'https://jupyter.designsafe-ci.org/user/testuser/lab/tree/CommunityData/Jupyter%20Notebooks%20for%20Civil%20Engineering%20Courses/Univ%20of%20Texas%20_%20FiniteElementAnalyses%20in%20GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb'
    );
  });

  it('render Jupyter link for notebook in Published Data', () => {
    global.window.__authenticatedUser__ = userData;
    render(<OpenInJupyterButton file={notebookInPublished} />);
    expect(screen.getByRole('link').getAttribute('href')).toEqual(
      'https://jupyter.designsafe-ci.org/user/testuser/lab/tree/NHERI-Published/Jupyter%20Notebooks%20for%20Civil%20Engineering%20Courses/Univ%20of%20Texas%20_%20FiniteElementAnalyses%20in%20GeotechnicalEngineering/notebooks/02-elastic_bar_linear_fem.ipynb'
    );
  });

  it('render no link for unauthenticated user', () => {
    global.window.__authenticatedUser__ = undefined;
    render(<OpenInJupyterButton file={notebookInPublished} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('render no link for non-notebook file', () => {
    global.window.__authenticatedUser__ = undefined;
    render(<OpenInJupyterButton file={nonNotebookFile} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('render no link for non-public notebook', () => {
    global.window.__authenticatedUser__ = undefined;
    render(<OpenInJupyterButton file={notebookInMyData} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
