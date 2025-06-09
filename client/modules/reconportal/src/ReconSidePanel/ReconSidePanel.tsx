import React, { useEffect, useState } from 'react';
import {
  Flex,
  Layout,
  LayoutProps,
  Image,
  Input,
  Select,
  DatePicker,
  Typography,
  List,
  Card,
  Button,
  Tag,
} from 'antd';
import styles from './ReconSidePanel.module.css';
import {
  useGetReconPortalEventTypes,
  useGetReconPortalEvents,
  type ReconPortalEvents,
  type EventTypeResponse,
  useSelectedReconPortalEvent,
  getReconPortalEventIdentifier,
} from '@client/hooks';
import { formatDate } from '@client/workspace';
import dayjs from 'dayjs';
import { CloseOutlined } from '@ant-design/icons';

const EVENT_TYPE_COLORS = {
  earthquake: '#e46e28',
  flood: '#4285F4',
  tsunami: '#a765fe',
  landslide: '#62a241',
  hurricane: '#d34141',
  tornado: '#9100ff',
};

const markerIconUrls = {
  earthquake:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  flood:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  tsunami:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  landslide:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  hurricane:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  tornado:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
};


export const ReconSidePanel: React.FC<LayoutProps> = ({
  children,
  ...props
}) => {
  const { Content } = Layout;
  const { Search } = Input;
  const { Text, Link } = Typography;

  const {
    selectedReconPortalEventIdentfier,
    setSelectedReconPortalEventIdentifier,
  } = useSelectedReconPortalEvent();

  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null
  );
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<ReconPortalEvents[]>([]);

  const { data: eventTypes = [] } = useGetReconPortalEventTypes();
  const { data: events = [] } = useGetReconPortalEvents();

  useEffect(() => {
    if (events.length > 0) {
      setFilteredEvents(events);
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

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    const year = date ? date.format('YYYY') : null;
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

    setFilteredEvents(filtered);
  };

  const handleEventClick = (event: ReconPortalEvents) => {
    setSelectedReconPortalEventIdentifier(getReconPortalEventIdentifier(event));
  };

  const handleBackClick = () => {
    setSelectedReconPortalEventIdentifier(null);
  };

  const renderEventCard = (event: ReconPortalEvents) => {
    const title = event.title || event.properties?.name || '';
    const description =
      event.location_description || event.properties?.description || '';
    const date = event.event_date || event.properties?.dateCreated || '';
    const eventType = event.event_type || event.properties?.host || '';

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
              color={
                EVENT_TYPE_COLORS[eventType as keyof typeof EVENT_TYPE_COLORS]
              }
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

  const renderEventDetail = (event: ReconPortalEvents) => {
    const title = event.title || event.properties?.name || '';
    const description =
      event.location_description || event.properties?.description || '';
    const date = event.event_date || event.properties?.dateCreated || '';
    const eventType = event.event_type || event.properties?.host || '';
    const eventTypeColor =
      EVENT_TYPE_COLORS[eventType as keyof typeof EVENT_TYPE_COLORS] || '#ccc';
    const datasets = event.datasets || [];
    return (
      <div className={styles.eventDetail}>
        <Card className={styles.eventDetailCard}>
          <Flex className={styles.eventDetailTitleRow}>
            <span>
              <img
                src={markerIconUrls[eventType as keyof typeof markerIconUrls]}
                alt={eventType}
                style={{ width: '24px', height: '36px', marginRight: '8px' }}
              />
              {title}
            </span>
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              onClick={handleBackClick}
            />
          </Flex>
          <Flex vertical className={styles.eventDetailField}>
            <span className={styles.eventDetailLabel}>Location</span>
            <span className={styles.eventDetailValue}>{description}</span>
          </Flex>
          <Flex vertical className={styles.eventDetailField}>
            <span className={styles.eventDetailLabel}>Hazard Date</span>
            <span className={styles.eventDetailValue}>
              {formatDate(new Date(date))}
            </span>
          </Flex>
          <Flex vertical className={styles.eventDetailField} align="flex-start">
            <span className={styles.eventDetailLabel}>Hazard Type</span>
            <Tag color={eventTypeColor} className={styles.eventDetailTag}>
              {eventType}
            </Tag>
          </Flex>
        </Card>
        <div style={{ textAlign: 'center', margin: '24px 0 8px 0' }}>
          <span style={{ fontWeight: 600 }}>Reconaissance Data</span>
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
                href={ds.url}
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

  const selectedEvent = selectedReconPortalEventIdentfier
    ? events.find(
        (event) =>
          getReconPortalEventIdentifier(event) ===
          selectedReconPortalEventIdentfier
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
              src="/static/scripts/rapid/images/logoicon.png"
              preview={false}
              style={{ width: '48px', height: '48px' }}
            />
            <h1 style={{ fontSize: '32px', margin: 0 }}>Recon Portal</h1>
          </Flex>
        </div>

        <div className={styles.scrollableList}>
          {!selectedEvent ? (
            <>
              <div style={{ padding: '16px' }}>
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
              </div>

              <div style={{ padding: '0 16px', width: '100%' }}>
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

                  <DatePicker
                    picker="year"
                    placeholder="Select Year"
                    style={{ flex: 1 }}
                    onChange={handleYearChange}
                    value={selectedYear ? dayjs(selectedYear) : null}
                    allowClear
                  />
                </Flex>
              </div>

              <List
                dataSource={filteredEvents}
                renderItem={renderEventCard}
                locale={{ emptyText: 'No events match your selected filters' }}
                className={styles.eventList}
                itemLayout="vertical"
                split={false}
                style={{ width: '100%' }}
              />
            </>
          ) : (
            <div style={{}}>{renderEventDetail(selectedEvent)}</div>
          )}
        </div>
      </Flex>
      <Content>{children}</Content>
    </Layout>
  );
};
