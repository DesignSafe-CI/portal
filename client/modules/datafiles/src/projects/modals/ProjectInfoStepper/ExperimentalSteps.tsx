const ExperimentOverview1 = (
  <div>
    <p>
      DesignSafe offers an interactive interface to curate and publish data with
      other project members. Curation is important so your data can be
      organized, discovered, and understood for years to come.
    </p>
    <p>The four components of curation:</p>
    <div style={{ marginLeft: '18px' }}>
      <div>
        <strong>Experiments</strong> contain all the files you want to publish
        under a single DOI.
      </div>
      <div>
        <strong>Categories</strong> group files together based on shared purpose
        in an experiment.
      </div>
      <div>
        <strong>Related Data</strong> shows the relationship within categories
        and to an experiment.
      </div>
      <div>
        <strong>File Tags</strong> are agreed upon terms from the community for
        individual files.
      </div>
    </div>
    <p></p>
    <p>
      For further help with curation, DesignSafe has the following resources:
    </p>
    <ul>
      <li>
        {' '}
        <a
          href="/rw/user-guides/data-curation-publication/"
          target="_blank"
          aria-describedby="msg-open-new-window"
        >
          Data Curation and Publication user guide
        </a>
      </li>
      <li>
        {' '}
        <a
          href="/rw/user-guides/data-publication-guidelines/"
          target="_blank"
          aria-describedby="msg-open-new-window"
        >
          Data Publication Guidelines
        </a>
      </li>
      <li>
        {' '}
        <a
          href="https://www.youtube.com/playlist?list=PL2GxvrdFrBlkwHBgQ47pZO-77ZLrJKYHV"
          target="_blank"
          rel="noreferrer"
          aria-describedby="msg-open-new-window"
        >
          YouTube video instruction series
        </a>
      </li>
      <li>
        {' '}
        <a
          href="/facilities/virtual-office-hours/"
          target="_blank"
          aria-describedby="msg-open-new-window"
        >
          Curation office hours
        </a>
      </li>
      <li>
        {' '}
        <a
          href="/learning-center/training/"
          target="_blank"
          aria-describedby="msg-open-new-window"
        >
          Webinars
        </a>
      </li>
    </ul>
    <p></p>
  </div>
);

const ExperimentOverview2 = (
  <div>
    <p>
      <strong>Experiments</strong> contain all the files you want to publish
      under a single DOI.
    </p>
    <img
      src="/static/images/expExperiment.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt='screenshot of preview of published experiment "Experiment | Impacts on Vertical Cylinders"'
    />
    <p>
      Add another experiment <strong>only if</strong>:
    </p>
    <ul>
      <li>
        The experimental facility, experiment type, or equipment type change
      </li>
      <li>The dates of the experiment change</li>
      <li>The authors change</li>
      <li>You want a different DOI</li>
    </ul>
    Do not add another experiment <strong>if</strong>:
    <ul>
      <li>
        You are testing multiple model configurations and the information above
        stays the same
      </li>
    </ul>
    <p></p>
  </div>
);

const ExperimentOverview3 = (
  <div>
    <strong>Categories</strong> group files together based on a shared purpose
    in an experiment.
    <p>
      You can add five category types, each with a custom title and description:
    </p>
    <div>
      <span className="category-blue">Model Configuration</span>: Files
      describing the design and layout of what is being tested (some call this a
      specimen).
    </div>
    <div>
      <span className="category-teal">Sensor Information</span>: Files about the
      sensor instrumentation used in a model configuration to conduct one or
      more event.
    </div>
    <div>
      <span className="category-yellow">Event</span>: Files from unique
      occurrences during which data are generated.
    </div>
    <div>
      <span className="category-light-blue">Analysis</span>: Tables, graphs,
      visualizations, Jupyter Notebooks, or other representations of the
      results.
    </div>
    <div>
      <span className="category-gray">Report</span>: Written accounts made to
      convey information about an entire project or experiment.
    </div>
    <p></p>
    <img
      src="/static/images/expCategory.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt='screenshot of interface with cursor over "Select a Category" form field'
    />
    <li>A file or a directory can belong to one or more categories.</li>
    <li>Every file in a directory inherits the directory's category.</li>
  </div>
);

const ExperimentOverview4 = (
  <div>
    <p>
      DesignSafe uses a flexible data model to organize your porject in
      different ways. Think about how you will organize your project now, at the
      beginning of the curation process. Use a{' '}
      <strong>Related Data Diagram</strong> to visually show relationships
      within categories and to an experiment. If you have trouble organizing
      your project, attend{' '}
      <a
        href="/facilities/virtual-office-hours/"
        target="_blank"
        aria-describedby="msg-open-new-window"
      >
        Curation office hours
      </a>{' '}
      at the beginning of the curation process. You can <a>download</a> and
      print this diagram to sketch and organize your work.
    </p>
    <img
      src="/static/images/expRelateData.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt="hierarchy diagram of required and optional aspects of an experimental project"
    />
    <div style={{ width: '100%', textAlign: 'center', paddingBottom: '20px' }}>
      <a href="/static/images/expRelateData.png" download="tree_diagram.png">
        <i role="none" className="fa fa-download"></i>{' '}
        <strong>Download Diagram</strong>
      </a>
    </div>
  </div>
);

const ExperimentOverview5 = (
  <div>
    <p>
      <strong>File Tags</strong> are custom or agreed-upon terms from the
      community for describing files or directories. Using agreed-upon tags
      helps other researchers refine their search and discovered specific files
      in your publication. The natural hazards community has contributed to
      creating the agreed-upon terms.
    </p>
    <img
      src="/static/images/expFileTag.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt='screenshot of interface with cursor over "Select Event File Tags" form field'
    />
    <ul>
      <li>
        The agreed-upon tags available for selection depend on the categories
        you have selected.
      </li>
      <li>
        If you can't find a tag that describes your file, select other to type
        in a short tag.
      </li>
      <li>These tags are optional, but recommended.</li>
    </ul>
  </div>
);

const ExperimentOverview6 = (
  <div className="overview-body">
    <h3>Best Practices</h3>
    <hr />
    <ul>
      <li>
        Publish data files in a format that is interoperable and open. Example:
        CSV instead of SAS files
      </li>
      <li>
        Before publishing raw data that has not been processed, consider why it
        is necessary. If so, explain how others can use the raw data.
      </li>
      <li>
        Be selective with any images you choose. Use file tags to describe them.
        Make sure they have a purpose or a function.
      </li>
      <li>
        Do not publish ZIP files. ZIP files prevent others from viewing and
        understanding your data.
      </li>
      <li>
        Use applicable software to review for any errors in your data before you
        publish.
      </li>
      <li>
        Avoid publishing data within folders. Instead, provide a direct view to
        the data within collections so others can understand your project at a
        glance.
      </li>
    </ul>
  </div>
);

export const experimentSteps = [
  { key: '1', content: ExperimentOverview1 },
  { key: '2', content: ExperimentOverview2 },
  { key: '3', content: ExperimentOverview3 },
  { key: '4', content: ExperimentOverview4 },
  { key: '5', content: ExperimentOverview5 },
  { key: '5', content: ExperimentOverview6 },
];
