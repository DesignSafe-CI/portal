import { useContext } from 'react';
import { sensitiveDataContext } from './sensitiveDataContext';
import { Radio } from 'antd';

const FieldReconOverview1 = (
  <div className="overview-body">
    <h3>Field Research</h3>
    <hr />
    <p>
      Field research projects allow engineers and social scientists to curate
      and publish together or independently.
    </p>
    <p>
      Curation is important so your data can be
      <strong>organized</strong>, <strong>discovered</strong>, and{' '}
      <strong>understood</strong>
      for years to come.
    </p>
    <p>The four components of curating field research projects:</p>
    <div style={{ marginLeft: '18px' }}>
      <p>
        <strong>Missions</strong>
        <br />
        Missions group collections of data representing different visits to a
        site, field teams, field experiments, or research topics (e.g.,
        liquefaction, structural performance, wave inundation, etc.). Some
        researchers refer to missions using terms such as “time 1”, “wave 1”,
        etc.
      </p>
      <p>
        <strong>Collections</strong>
        <br />
        Collections group files together based on a shared purpose in a mission.
      </p>
      <p>
        <strong>Relating Data</strong>
        <br />
        Relating data organizes missions and their respective collections.
      </p>
      <p>
        <strong>File Tags</strong>
        <br />
        File tags are agreed upon terms that the community contributes for
        describing files and directories.
      </p>
    </div>
    <br />
    <p>
      For further help with curation, DesignSafe has the following resources:
    </p>
    <ul>
      <li>
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
          Data publication guidelines
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
    </ul>
  </div>
);

const FieldReconOverview2 = (
  <div className="overview-body">
    <h3>Missions</h3>
    <hr />
    <p>
      Missions group collections of data representing different visits to a
      site, field teams, field experiments, or research topics (e.g.,
      liquefaction, structural performance, wave inundation, etc.). Some
      researchers refer to missions using terms such as “time 1”, “wave 1”, etc.
    </p>
    <ul>
      <li>A mission is a self-contained component within a project.</li>
      <li>
        You can publish subsequent missions over the lifespan of the project.
      </li>
      <li>Each mission receives its own DOI.</li>
      <li>Missions are all related under a single project.</li>
    </ul>
    <br />
    <h3>Research Planning Collections</h3>
    <hr />
    <p>
      Research planning collections group files related to planning and
      logistics, permits, administration, design, gathering, institutional
      review board (IRB), and processing, of the data obtained in a particular
      mission. These files help others understand the context of your data.
    </p>
    <ul>
      <li>
        Users find these files very helpful for understanding projects and
        planning new ones.
      </li>
      <li>
        File types: Consent forms, data management plans, IRB applications,
        letters of support, planning documents, permits, protocols, quality
        assurance plans, reports, reflexivity reports (also called reflections
        or best practices), and team trainings.
      </li>
    </ul>
  </div>
);

const FieldReconNotifyStep = () => {
  const { sensitiveDataOption, setSensitiveDataOption } =
    useContext(sensitiveDataContext);
  return (
    <section>
      <h3>
        Will you or other team members upload protected data to this project?
      </h3>
      <Radio.Group
        value={sensitiveDataOption}
        onChange={(e) =>
          setSensitiveDataOption && setSensitiveDataOption(e.target.value)
        }
      >
        <Radio value={0}>
          No, we will upload only non-confidential and/or non-personal
          information:
        </Radio>
        <ul>
          <li style={{ fontSize: '14px' }}>
            The data has been de-identified and/or there is no Personally
            Identifiable Information (PII), or you received approval to publish
            PII from the research subjects.
          </li>
          <li style={{ fontSize: '14px' }}>
            For an example of the type of data that fits category and has been
            published on DesignSafe, see: https://doi.org/10.17603/e9wq-gz57
          </li>
        </ul>
        <hr style={{ fontSize: '14px' }} />
        <Radio value={1}>
          Yes, we will upload sensitive personal information
        </Radio>
        <ul>
          <li style={{ fontSize: '14px' }}>
            Includes any of these types of confidential information that may
            pose a risk if disclosed to non-authorized individuals.
          </li>
        </ul>
        <hr style={{ fontSize: '14px' }} />
        <Radio value={2}>
          Yes, we will upload very sensitive confidential information
        </Radio>
        <ul>
          <li style={{ fontSize: '14px' }}>
            Examples include any type of confidential information that would
            cause harm to individuals if not accessed only by authorized
            individuals. For example, medical diagnoses records, very sensitive
            financial records, criminal records, data involved in issues of
            national security, etc.
          </li>
        </ul>
      </Radio.Group>
    </section>
  );
};

const FieldReconOverview3 = (
  <div className="overview-body">
    <h3>Engineering/Geosciences Collections</h3>
    <hr />
    <p>
      Engineering/geosciences collections group related data from the
      engineering/geosciences domain.
    </p>
    <ul>
      <li>
        File types: 3D models, audio, building codes, data processing methods,
        images, lidar, point clouds, notes, scans, tracks, videos, reports, and
        virtual reconnaissance.
      </li>
    </ul>
    <br />
    <h3>Social Sciences Collections</h3>
    <hr />
    <p>
      Social sciences collections group related data from the social sciences
      domain.
    </p>
    <ul>
      <li>
        File types: audio, data documentation, images, instruments, raw data,
        reports, transcripts, and variables.
      </li>
    </ul>
  </div>
);

const FieldReconOverview4 = (
  <div className="overview-body">
    <h3>Documents Collections</h3>
    <hr />
    <p>
      Documents collections include instruments, protocols, and different
      reports (virtual reconnaissance, field assessment, preliminary virtual
      assessment, etc). These collections are published separately, each with
      their own DOI.
    </p>
    <ul>
      <li>
        Use this collection to publish files outside the mission, especially for
        planning and reporting files that encompass the entire project. You can
        publish more than one documents collections over time.
      </li>
    </ul>
    <br />
    <h3>Relating Data</h3>
    <hr />
    <p>Relating data organizes missions and their respective collections.</p>
    <ul>
      <li>
        Organize the missions and collections such that another user can easily
        understand the project.
      </li>
      <li>
        If a collection is across multiple missions (example: a survey
        instrument or other planning files), you can put the same collection in
        multiple missions.
      </li>
    </ul>
  </div>
);

const FieldReconOverview5 = (
  <div className="overview-body">
    <h3>File Tags</h3>
    <hr />
    <p>
      File tags are agreed upon terms that the community contributes for
      describing files and directories.
    </p>
    <ul>
      <li>
        The option to tag a file appears after you’ve put files in collections.
      </li>
      <li>
        The tags available for a file depend on the collection you have put the
        file into.
      </li>
      <li>
        If you can’t find a tag that describes your file, select ‘other’ to type
        in a custom tag.
      </li>
      <li>You can add multiple tags to one file.</li>
      <li>
        The natural hazards community has contributed to creating the
        agreed-upon terms.
      </li>
      <li>
        Using agreed-upon terms helps other researchers refine their search and
        discover specific files in your publication.
      </li>
      <li>These tags are optional, but strongly recommended.</li>
    </ul>
  </div>
);

const FieldReconOverview6 = (
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

export const fieldReconSteps = [
  { key: '1', content: FieldReconOverview1 },
  { key: '2', content: FieldReconOverview2 },
  { key: '3', content: FieldReconOverview3 },
  { key: '4', content: FieldReconOverview4 },
  { key: '5', content: FieldReconOverview5 },
  { key: '6', content: FieldReconOverview6 },
  { key: '7', content: <FieldReconNotifyStep /> },
];
