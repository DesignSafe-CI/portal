import { TFileListing } from '@client/hooks';
import { OpenInJupyterButton } from './OpenInJupyterButton';
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

const notebookInPublished = {
  system: 'designsafe.storage.published',
  type: 'file',
  format: 'raw',
  mimeType: null,
  path: '/published-data/PRJ-2890/Experiment--wall-of-wind-validation-and-calibration-tests-september-2020/data/Analysis--jupyter-notebook-wow-sep-2020/data/Performance_Analysis_2020.ipynb',
  name: 'Performance_Analysis_2020.ipynb',
  length: 77,
  lastModified: '2024-02-19T20:28:03Z',
  _links: {
    self: {
      href: 'tapis://designsafe.storage.published/published-data/PRJ-2890/Experiment--wall-of-wind-validation-and-calibration-tests-september-2020/data/Analysis--jupyter-notebook-wow-sep-2020/data/Performance_Analysis_2020.ipynb',
    },
  },
  isPreviewable: true,
} as TFileListing;

describe('OpenInJupyterButton', () => {
  it('render Jupyter link for notebook in Community Data', () => {
    render(<OpenInJupyterButton file={notebookInCommunity} />);
    expect(screen.getByRole('link').getAttribute('href')).toEqual(
      'https://jupyter.designsafe-ci.org/user-redirect/lab/tree/CommunityData/%2FJupyter%20Notebooks%20for%20Civil%20Engineering%20Courses%2FUniv%20of%20Texas%20_%20FiniteElementAnalyses%20in%20GeotechnicalEngineering%2Fnotebooks%2F02-elastic_bar_linear_fem.ipynb'
    );
  });

  it('render Jupyter link for notebook in Published Data', () => {
    render(<OpenInJupyterButton file={notebookInPublished} />);
    expect(screen.getByRole('link').getAttribute('href')).toEqual(
      'https://jupyter.designsafe-ci.org/user-redirect/lab/tree/NHERI-Published/%2FPRJ-2890%2FExperiment--wall-of-wind-validation-and-calibration-tests-september-2020%2Fdata%2FAnalysis--jupyter-notebook-wow-sep-2020%2Fdata%2FPerformance_Analysis_2020.ipynb'
    );
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
