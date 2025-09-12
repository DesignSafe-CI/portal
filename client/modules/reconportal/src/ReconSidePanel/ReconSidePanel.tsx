import React, { useEffect, useState } from 'react';
import {
  Flex,
  Layout,
  LayoutProps,
  Image,
  Input,
  Select,
  Typography,
  List,
  Card,
  Button,
  Tag,
  Divider,
} from 'antd';
import styles from './ReconSidePanel.module.css';
import {
  useGetReconPortalEventTypes,
  useGetReconPortalEvents,
  type ReconPortalEvent,
  type EventTypeResponse,
  useReconEventContext,
  getReconPortalEventIdentifier,
  useAvailableEventYears,
} from '@client/hooks';
import { formatDate } from '@client/workspace';
import { CloseOutlined } from '@ant-design/icons';
import { getReconEventColor } from '../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';

export const ReconSidePanel: React.FC<LayoutProps> = ({
  children,
  ...props
}) => {
  const { Content } = Layout;
  const { Search } = Input;
  const { Text, Link } = Typography;

  const {
    selectedReconPortalEventIdentifier,
    setSelectedReconPortalEventIdentifier,
    filteredReconPortalEvents,
    setFilteredReconPortalEvents,
  } = useReconEventContext();

  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null
  );
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  const { data: eventTypes = [] } = useGetReconPortalEventTypes();
  const { data: events = [] } = useGetReconPortalEvents();

  const availableYears = useAvailableEventYears(events, selectedEventType);

  // When event type changes, ensure selected year is still valid; reset if not
  useEffect(() => {
    if (selectedYear && !availableYears.includes(selectedYear)) {
      // clear selected year as no longer makes sense
      setSelectedYear(null);
    }
  }, [selectedEventType, availableYears]);

  useEffect(() => {
    if (events.length > 0) {
      setFilteredReconPortalEvents(events);
    }
  }, [events]);

  const onSearch = (value: string) => {
    setSearchText(value);
    filterEvents(value, selectedEventType, selectedYear);
  };

  const handleEventTypeChange = (value: string) => {
    setSelectedEventType(value);
    filterEvents(searchText, value, selectedYear);
  };

  const handleYearChange = (year: string | null) => {
    setSelectedYear(year);
    filterEvents(searchText, selectedEventType, year);
  };

  const filterEvents = (
    search: string,
    eventType: string | null,
    year: string | null
  ) => {
    let filtered = [...events];

    if (search) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.location_description
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (eventType) {
      filtered = filtered.filter((event) => event.event_type === eventType);
    }

    if (year) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.event_date);
        return eventDate.getFullYear().toString() === year;
      });
    }

    setFilteredReconPortalEvents(filtered);
  };

  const handleEventClick = (event: ReconPortalEvent) => {
    setSelectedReconPortalEventIdentifier(getReconPortalEventIdentifier(event));
  };

  const handleBackClick = () => {
    setSelectedReconPortalEventIdentifier(null);
  };

  const renderEventCard = (event: ReconPortalEvent) => {
    const title = event.title;
    const description = event.location_description;
    const date = event.event_date;
    const eventType = event.event_type;

    return (
      <div className={styles.eventContainer}>
        <Card
          className={styles.eventCard}
          onClick={() => handleEventClick(event)}
          hoverable
        >
          <div className={styles.eventTitle}>{title}</div>
          <div className={styles.eventLocation}>{description}</div>
          <Flex justify="space-between" align="center">
            <Text className={styles.eventDate}>
              {formatDate(new Date(date))}
            </Text>
            <Tag
              color={getReconEventColor(event)}
              style={{
                fontWeight: 600,
                fontSize: 14,
                textTransform: 'capitalize',
              }}
            >
              {eventType}
            </Tag>
          </Flex>
        </Card>
      </div>
    );
  };

  const renderEventDetail = (event: ReconPortalEvent) => {
    const title = event.title;
    const description = event.location_description;
    const date = event.event_date;
    const eventType = event.event_type;
    const eventTypeColor = getReconEventColor(event);
    const datasets = event.datasets || [];
    return (
      <div className={styles.eventDetail}>
        <Card variant="borderless" className={styles.eventDetailCard}>
          <Divider style={{ margin: '0px' }} />
          <Flex className={styles.eventDetailTitleRow}>
            <div>
              <FontAwesomeIcon
                icon={faLocationDot}
                size="2x"
                color={eventTypeColor}
                style={{ marginRight: '8px' }}
              />
            </div>
            <div>{title}</div>
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              onClick={handleBackClick}
            />
          </Flex>
          <Divider style={{ margin: '0px 0px 8px 0px' }} />
          <div className={styles.eventDetailField}>
            <span className={styles.eventDetailLabel}>Location: </span>
            <span className={styles.eventDetailValue}>{description}</span>
          </div>
          <div className={styles.eventDetailField}>
            <span className={styles.eventDetailLabel}>Hazard Date: </span>
            <span className={styles.eventDetailValue}>
              {formatDate(new Date(date))}
            </span>
          </div>
          <div className={styles.eventDetailField}>
            <span className={styles.eventDetailLabel}>Hazard Type: </span>
            <Tag color={eventTypeColor} className={styles.eventDetailTag}>
              {eventType}
            </Tag>
          </div>
        </Card>
        <Divider style={{ margin: '0px 0px 8px 0px' }} />
        <div className={styles.reconDataTitle}>
          <span>Reconaissance Data</span>
        </div>
        <Flex
          vertical
          align="center"
          gap={8}
          className={styles.reconDataSection}
        >
          {datasets.length > 0 ? (
            datasets.map((ds: { title: string; url: string }, idx: number) => (
              <a
                key={idx}
                href={ds.url.replace(/([^:]\/)\/+/g, '$1')}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.reconDataLink}
              >
                {ds.title}
              </a>
            ))
          ) : (
            <span>No datasets available</span>
          )}
        </Flex>
      </div>
    );
  };

  const selectedEvent = selectedReconPortalEventIdentifier
    ? events.find(
        (event) =>
          getReconPortalEventIdentifier(event) ===
          selectedReconPortalEventIdentifier
      )
    : null;

  return (
    <Layout {...props}>
      <Flex vertical style={{ height: '100%' }}>
        <div className={styles.stickyHeader}>
          <Flex
            align="center"
            justify="center"
            className={styles.header}
            gap={20}
          >
            <Image
              src="/static/images/reconPortalIcon.png"
              preview={false}
              style={{ width: '48px', height: '48px' }}
            />
            <h1 style={{ fontSize: '32px', margin: 0 }}>Recon Portal</h1>
          </Flex>
        </div>

        <div className={styles.scrollableList}>
          {!selectedEvent ? (
            <>
              <div className={styles.filtersSection}>
                <Flex vertical gap={8}>
                  <Text
                    style={{
                      textAlign: 'left',
                      fontSize: '14px',
                      color: '#666',
                    }}
                  >
                    Explore natural hazard datasets from DesignSafe, Open
                    Topography, and other sources
                  </Text>

                  <Text
                    style={{
                      textAlign: 'left',
                      fontSize: '14px',
                      width: '100%',
                    }}
                  >
                    <Link href="/user-guide/tools/recon/">
                      Learn how to contribute your datasets
                    </Link>
                  </Text>
                </Flex>

                <div style={{ marginTop: '16px', width: '100%' }}>
                  <Search
                    placeholder="Search by keyword"
                    allowClear
                    enterButton="Search"
                    size="large"
                    onSearch={onSearch}
                  />

                  <Flex
                    gap={16}
                    justify="space-between"
                    style={{ width: '100%', marginTop: '16px' }}
                  >
                    <Select
                      placeholder="Select Event Type"
                      style={{ flex: 1 }}
                      onChange={handleEventTypeChange}
                      value={selectedEventType}
                      allowClear
                    >
                      {eventTypes.map((eventType: EventTypeResponse) => (
                        <Select.Option
                          key={eventType.name}
                          value={eventType.name}
                        >
                          {eventType.display_name}
                        </Select.Option>
                      ))}
                    </Select>

                    <Select
                      placeholder="Select Year"
                      style={{ flex: 1 }}
                      onChange={handleYearChange}
                      value={selectedYear}
                      allowClear
                    >
                      {availableYears.map((year) => (
                        <Select.Option key={year} value={year}>
                          {year}
                        </Select.Option>
                      ))}
                    </Select>
                  </Flex>
                </div>
              </div>

              <div className={styles.eventsScrollableArea}>
                <List
                  dataSource={filteredReconPortalEvents}
                  renderItem={renderEventCard}
                  locale={{
                    emptyText: 'No events match your selected filters',
                  }}
                  className={styles.eventList}
                  itemLayout="vertical"
                  split={false}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          ) : (
            <div className={styles.eventsScrollableArea}>
              {renderEventDetail(selectedEvent)}
            </div>
          )}
        </div>
      </Flex>
      <Content>{children}</Content>
    </Layout>
  );
};
