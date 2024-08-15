const SimulationOverview1 = (
  <div>
    <p>
      DesignSafe offers an interactive interface to curate and publish data with
      other project members. Curation is important so your data can be
      organized, discovered, and understood for years to come.
    </p>
    <p>The four components of curation:</p>
    <div style={{ marginLeft: '18px' }}>
      <div>
        <strong>Simulations</strong> contain all the files you want to publish
        under a single DOI.
      </div>
      <div>
        <strong>Categories</strong> group files together based on shared purpose
        in an simulation.
      </div>
      <div>
        <strong>Tree Diagrams</strong> relate categories to each other and to an
        simulation.
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
          aria-describedby="msg-open-ext-site-new-window"
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
  </div>
);

const SimulationOverview2 = (
  <div>
    <p>
      <strong>Simulations</strong> contain all the files you want to publish
      under a single DOI.
    </p>
    <img
      src="/static/images/simSimulation.png"
      alt='screenshot of preview of published imulation "Simulation | Typhoon Haiyanin the Philippines and Similar Synthetic Storms"'
      style={{ width: '100%', paddingBottom: '20px' }}
    />
    <p>
      Add another simulation <strong>only if</strong>:
    </p>
    <ul>
      <li>The simulation type changes</li>
      <li>The authors change</li>
      <li>You want a different DOI</li>
    </ul>
    <p>
      Do not add another simulation <strong>if</strong>:
    </p>
    <ul>
      <li>
        You are simulating multiple models and the information above stays the
        same
      </li>
    </ul>

    <p></p>
  </div>
);

const SimulationOverview3 = (
  <div>
    <strong>Categories</strong> group files together based on a shared purpose
    in an simulation.
    <p>
      You can add five category types, each with a custom title and description:
    </p>
    <div>
      <span className="category-blue">Model</span>: Files and/or information
      describing the design, geometry, and/or code of a simulation.
    </div>
    <div>
      <span className="category-teal">Input</span>: Files containing the
      parameters of the simulation.
    </div>
    <div>
      <span className="category-yellow">Output</span>: Files containing the
      results of a simulation.
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
      src="/static/images/simCategory.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt='screenshot of interface with cursor over "Select a Category" form field'
    />
    <ul>
      <li>A file or a directory can belong to one or more categories.</li>
      <li>Every file in a directory inherits the directory's category.</li>
    </ul>
  </div>
);

const SimulationOverview4 = (
  <div>
    <p>
      DesignSafe uses a flexible data model to organize your porject in
      different ways. Think about how you will organize your project now, at the
      beginning of the curation process. Use a <strong>Tree Diagram</strong> to
      relate categories to each other and to a simulation. If you have trouble
      organizing your project, attend{' '}
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
      src="/static/images/simRelateData.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt="hierarchy diagram of required and optional aspects of an simulation project"
    />
    <div style={{ width: '100%', textAlign: 'center', paddingBottom: '20px' }}>
      <a href="/static/images/simRelateData.png" download="tree_diagram.png">
        <i role="none" className="fa fa-download"></i>{' '}
        <strong>Download Diagram</strong>
      </a>
    </div>
  </div>
);

const SimulationOverview5 = (
  <div>
    <p>
      <strong>File Tags</strong> are custom or agreed-upon terms from the
      community for describing files or directories. Using agreed-upon tags
      helps other researchers refine their search and discovered specific files
      in your publication. The natural hazards community has contributed to
      creating the agreed-upon terms.
    </p>
    <img
      src="/static/images/simFileTag.png"
      style={{ width: '100%', paddingBottom: '20px' }}
      alt='screenshot of interface with cursor over "Select Output File Tag" form field'
    />
    <br />
    <li>
      The agreed-upon tags available for selection depend on the categories you
      have selected.
    </li>
    <li>
      If you can't find a tag that describes your file, select other to type in
      a short tag.
    </li>
    <li>These tags are optional, but recommended.</li>
  </div>
);

const SimulationOverview6 = (
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

export const SimulationSteps = [
  { key: '1', content: SimulationOverview1 },
  { key: '2', content: SimulationOverview2 },
  { key: '3', content: SimulationOverview3 },
  { key: '4', content: SimulationOverview4 },
  { key: '5', content: SimulationOverview5 },
  { key: '5', content: SimulationOverview6 },
];
