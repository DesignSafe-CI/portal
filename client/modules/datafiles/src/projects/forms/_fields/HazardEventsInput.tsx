import { Button, Form, Input } from 'antd';
import React from 'react';
import { DateInput } from './DateInput';

export const HazardEventsInput: React.FC<{ name: string }> = ({ name }) => {
  return (
    <Form.List name={name} initialValue={[]}>
      {(fields, { add, remove }) => (
        <>
          {[
            ...(fields.length === 0 ? [{ key: -1, name: -1 }] : []), //Pad the fields when empty to display a placeholder.
            ...fields,
          ].map(({ key, name }, i) => {
            const showPlaceholder = fields.length === 0;
            return (
              <React.Fragment key={key}>
                {i !== 0 && (
                  <div
                    style={{
                      borderBottom: '1px solid #ccc',
                      marginBottom: '16px',
                    }}
                  ></div>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="flex-1">
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Form.Item
                        rules={[{ required: !showPlaceholder }]}
                        label="Event Name"
                        name={
                          !showPlaceholder ? [name, 'eventName'] : undefined
                        }
                        className="flex-2"
                      >
                        <Input disabled={showPlaceholder} />
                      </Form.Item>
                      <Form.Item
                        rules={[
                          {
                            required: !showPlaceholder,
                            message: 'Please enter a valid start date.',
                          },
                        ]}
                        label={<span>Start Date</span>}
                        name={
                          !showPlaceholder ? [name, 'eventStart'] : undefined
                        }
                        className="flex-1"
                      >
                        <DateInput
                          format="MM/DD/YYYY"
                          placeholder="mm/dd/yyyy"
                          disabled={showPlaceholder}
                        />
                      </Form.Item>
                      <Form.Item
                        label="End Date"
                        name={!showPlaceholder ? [name, 'eventEnd'] : undefined}
                        className="flex-1"
                      >
                        <DateInput
                          format="MM/DD/YYYY"
                          placeholder="mm/dd/yyyy"
                          disabled={showPlaceholder}
                        />
                      </Form.Item>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }} key={key}>
                      <Form.Item
                        rules={[{ required: !showPlaceholder }]}
                        label="Location"
                        name={!showPlaceholder ? [name, 'location'] : undefined}
                        className="flex-2"
                      >
                        <Input disabled={fields.length === 0} />
                      </Form.Item>
                      <Form.Item
                        rules={[{ required: !showPlaceholder }]}
                        label="Latitude"
                        name={
                          fields.length > 0 ? [name, 'latitude'] : undefined
                        }
                        className="flex-1"
                      >
                        <Input type="number" disabled={showPlaceholder} />
                      </Form.Item>
                      <Form.Item
                        rules={[{ required: fields.length > 0 }]}
                        label="Longitude"
                        name={
                          !showPlaceholder ? [name, 'longitude'] : undefined
                        }
                        className="flex-1"
                      >
                        <Input type="number" disabled={showPlaceholder} />
                      </Form.Item>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    danger
                    style={{ height: 'fit-content', alignSelf: 'center' }}
                    hidden={showPlaceholder}
                    onClick={() => remove(name)}
                    aria-label="Remove Guest Member"
                  >
                    <i role="none" className="fa fa-times"></i>
                  </Button>
                </div>
              </React.Fragment>
            );
          })}
          <Button type="default" onClick={() => add()} block icon={'+'}>
            Add Natural Hazard Event
          </Button>
        </>
      )}
    </Form.List>
  );
};
