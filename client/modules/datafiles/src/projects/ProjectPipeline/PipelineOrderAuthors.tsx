import { TProjectUser, useProjectDetail } from '@client/hooks';
import { Button } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { usePatchEntityMetadata } from '@client/hooks';

export const PipelineOrderAuthors: React.FC<{
  projectId: string;
  prevStep: () => void;
  nextStep: () => void;
}> = ({ projectId, prevStep, nextStep }) => {
  const { data } = useProjectDetail(projectId ?? '');
  const { mutate } = usePatchEntityMetadata();

  const [searchParams] = useSearchParams();
  const selectedUuids = searchParams.getAll('selected');
  const selectedEntities = data?.entities.filter((e) =>
    selectedUuids.includes(e.uuid)
  );

  const moveUp = (
    entityUuid: string,
    authorList: TProjectUser[],
    index: number
  ) => {
    const tmp = authorList[index];
    const res = [...authorList];
    res[index] = res[index - 1];
    res[index - 1] = tmp;

    mutate({ entityUuid, patchMetadata: { authors: res } });
  };

  const moveDown = (
    entityUuid: string,
    authorList: TProjectUser[],
    index: number
  ) => {
    const tmp = authorList[index];
    const res = [...authorList];
    res[index] = res[index + 1];
    res[index + 1] = tmp;

    mutate({ entityUuid, patchMetadata: { authors: res } });
  };

  if (!data || !projectId || !selectedEntities) return null;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 24,
        }}
      >
        <Button type="link" onClick={() => prevStep()}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Proofread Categories
        </Button>
        <Button
          className="success-button"
          style={{ padding: '0px 40px' }}
          type="primary"
          onClick={nextStep}
        >
          Continue
        </Button>
      </div>
      <section>
        <h3 style={{ textAlign: 'center' }}>
          Order the Authors of your Published Works
        </h3>
        <ul style={{ listStylePosition: 'inside', paddingInlineStart: '0px' }}>
          <li>
            Order the members of your team as you would like them to appear on
            your citation.
          </li>
          <li>When you have finished ordering click the "Save" button.</li>
          <li>
            If you need help, attend{' '}
            <a
              href="/facilities/virtual-office-hours/"
              target="_blank"
              aria-describedby="msg-open-new-window"
            >
              curation office hours
            </a>{' '}
            for help with publishing.
          </li>
        </ul>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        ></div>

        {selectedEntities?.map((entity) => (
          <section
            style={{
              backgroundColor: '#f5f5f5',
              padding: '20px',
              marginBottom: '20px',
            }}
            key={entity.uuid}
          >
            <h3>{entity.value.title} </h3>
            <section>
              <strong>Citation Preview</strong>
              <div className="well" style={{ backgroundColor: 'white' }}>
                {(entity.value.authors ?? [])
                  .map((author, idx) =>
                    idx === 0
                      ? `${author.lname}, ${author.fname[0]}${
                          (entity.value.authors?.length ?? 1) > 1 ? '.' : ''
                        }`
                      : `${author.fname[0]}. ${author.lname}`
                  )
                  .join(', ')}
                . "{entity.value.title}", in{' '}
                <i>{data.baseProject.value.title}</i>. DesignSafe-CI. (DOI will
                appear after publication)
              </div>
            </section>
            <table style={{ marginTop: '10px' }}>
              <tbody>
                {(entity.value.authors ?? []).map((author, idx, arr) => (
                  <tr key={author.email}>
                    <td style={{ verticalAlign: 'middle' }}>
                      {author.lname}, {author.fname}
                    </td>
                    <td>
                      <span> &nbsp;</span>
                      <Button
                        type="text"
                        disabled={idx === 0}
                        onClick={() =>
                          moveUp(entity.uuid, entity.value.authors ?? [], idx)
                        }
                      >
                        <i role="none" className="fa fa-arrow-up">
                          &nbsp;
                        </i>
                      </Button>
                      <Button
                        type="text"
                        disabled={idx === arr.length - 1}
                        onClick={() =>
                          moveDown(entity.uuid, entity.value.authors ?? [], idx)
                        }
                      >
                        <i role="none" className="fa fa-arrow-down">
                          &nbsp;
                        </i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </section>
    </>
  );
};
