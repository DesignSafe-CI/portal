import React from 'react';
export const ProjectCategoryFormHelp: React.FC<{ projectType: string }> = ({
  projectType,
}) => {
  switch (projectType) {
    case 'hybrid_simulation':
      return (
        <div>
          <div>
            <span className="category-blue">Global Model</span> Files describing
            the entire structure, loading protocol, and components of the hybrid
            simulation.
          </div>
          <br />
          <div>
            <span className="category-teal">Master Simulation Coordinator</span>{' '}
            Software files that communicate with the simulation and experimental
            substructure simultaneously to give commands and receive feedback
            data.
          </div>
          <div>
            <span className="category-yellow">Coordinator Output</span> Data
            generated by the master simulation coordinator.
          </div>
          <br />
          <div>
            <span className="category-orange">Simulation Substructure</span>{' '}
            Files and/or information describing the planning and design of the
            numerical model.
          </div>
          <div>
            <span className="category-yellow">Simulation Output</span> Data
            generated by the simulation substructure.
          </div>
          <br />
          <div>
            <span className="category-purple">Experimental Substructure</span>{' '}
            Files describing the design and layout of the physical model.
          </div>
          <div>
            <span className="category-yellow">Experimental Output</span> Data
            generated by the experimental substructure.
          </div>
          <br />
          <div>
            <span className="category-light-blue">Analysis</span> Tables,
            graphs, visualizations, Jupyter Notebooks, or other representations
            of the results.
          </div>
          <div>
            <span className="category-gray">Report</span> Written accounts made
            to convey information about an entire project or hybrid simulation.
          </div>
        </div>
      );

    case 'experimental':
      return (
        <div>
          <div>
            <span className="category-blue">Model Configuration</span> Files
            describing the design and layout of what is being tested (some call
            this a specimen).
          </div>
          <div>
            <span className="category-teal">Sensor Information</span> Files
            about the sensor instrumentation used in a model configuration to
            conduct one or more event.
          </div>
          <div>
            <span className="category-yellow">Event</span> Files from unique
            occurrences during which data are generated.
          </div>
          <div>
            <span className="category-light-blue">Analysis</span> Tables,
            graphs, visualizations, Jupyter Notebooks, or other representations
            of the results.
          </div>
          <div>
            <span className="category-gray">Report</span> Written accounts made
            to convey information about an entire project or experiment.
          </div>
        </div>
      );
    case 'simulation':
      return (
        <div>
          <div>
            <span className="category-blue">Simulation Model</span> Information
            and/or files describing the design, geometry, workflow, runtime
            environment and/or code of a simulation. This includes referencing
            research software or a community model and version when applicable.
          </div>
          <div>
            <span className="category-teal">Simulation Input</span> Files and
            references to the files containing the parameters of the simulation.
          </div>
          <div>
            <span className="category-yellow">Simulation Output</span> Files
            containing the results of a simulation.
          </div>
          <div>
            <span className="category-light-blue">Analysis</span> Tables,
            graphs, visualizations, Jupyter Notebooks, or other representations
            of the results.
          </div>
          <div>
            <span className="category-gray">Report</span> Detailed written
            account/s to convey information about the way in which the
            simulation was organized, how to run it, about the file contents and
            the file naming convention used. It could be one or a group of files
            including a readme file and a data dictionary, depending on the
            complexity and components of the simulation.
          </div>
        </div>
      );
    case 'field_recon':
      return (
        <div>
          <div>
            <span className="category-teal">Research Planning Collection</span>{' '}
            Groups files related to planning and logistics, permits,
            administration, design, gathering, institutional review board (IRB),
            and processing, of the data obtained in a particular mission. These
            files help others understand the context of your data.
          </div>
          <div>
            <span className="category-yellow">
              Engineering/Geosciences Collection
            </span>{' '}
            Groups related data from the engineering/geosciences domain.
          </div>
          <div>
            <span className="category-yellow">Social Sciences Collection</span>{' '}
            Groups related data from the social sciences domain.
          </div>
        </div>
      );
  }
};
