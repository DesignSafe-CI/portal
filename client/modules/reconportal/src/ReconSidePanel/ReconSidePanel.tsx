import React, { useEffect, useState } from 'react';
import { Flex, Layout, LayoutProps, Image, Input, Select, DatePicker, Typography, List, Card } from 'antd';
import styles from './ReconSidePanel.module.css';
import { useGetReconPortalEventTypes, useGetReconPortalEvents, type ReconPortalEvents, type EventTypeResponse } from '@client/hooks';
import { formatDate } from '@client/workspace';
import dayjs from 'dayjs';

const EVENT_TYPE_COLORS = {
  earthquake: '#e46e28',
  flood: '#4285F4',
  tsunami: '#a765fe',
  landslide: '#62a241',
  hurricane: '#d34141',
  tornado: '#9100ff',
};

export const ReconSidePanel: React.FC<LayoutProps> = ({
  children,
  ...props
}) => {
  const { Content } = Layout;
  const { Search } = Input;
  const { Text, Link } = Typography;
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
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

  const handleYearChange = (date: any) => {
    const year = date ? date.format('YYYY') : null;
    setSelectedYear(year);
    filterEvents(searchText, selectedEventType, year);
  };

  const filterEvents = (search: string, eventType: string | null, year: string | null) => {
    let filtered = [...events];

    if (search) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.location_description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (eventType) {
      filtered = filtered.filter(event => event.event_type === eventType);
    }

    if (year) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate.getFullYear().toString() === year;
      });
    }

    setFilteredEvents(filtered);
  };

  const renderEventCard = (event: ReconPortalEvents) => {
    const title = event.title || event.properties?.name || '';
    const description = event.location_description || event.properties?.description || '';
    const date = event.event_date || event.properties?.dateCreated || '';
    const eventType = event.event_type || event.properties?.host || '';

    return (
      <div className={styles.eventContainer}>
        <Card 
          className={styles.eventCard}
          onClick={() => console.log('Event selected:', event)}
          hoverable
        >
          <div className={styles.eventTitle}>{title}</div>
          <div className={styles.eventLocation}>{description}</div>
          <Flex justify="space-between" align="center">
            <Text className={styles.eventDate}>
              {formatDate(new Date(date))}
            </Text>
            <Text className={`${styles.eventType} ${styles[eventType.toLowerCase()]}`}
              style={{ backgroundColor: EVENT_TYPE_COLORS[eventType as keyof typeof EVENT_TYPE_COLORS] }}
            >
              {eventType}
            </Text>
          </Flex>
        </Card>
      </div>
    );
  };

  return (
    <Layout {...props}>
      <Flex vertical style={{ height: '100%' }}>
        <div className={styles.stickyHeader}>
          <Flex align="center" justify="center" className={styles.header} gap={20}>
            <Image 
              src="/static/scripts/rapid/images/logoicon.png" 
              preview={false}
              style={{ width: '48px', height: '48px' }}
            />
            <h1 style={{ fontSize: '32px', margin: 0 }}>Recon Portal</h1>
          </Flex>
        </div>

        <div className={styles.scrollableList}>
          <div style={{ padding: '16px' }}>
            <Flex vertical gap={8}>
              <Text style={{ textAlign: 'left', fontSize: '14px', color: '#666' }}>
                Explore natural hazard datasets from DesignSafe, Open Topography, and other sources
              </Text>

              <Text style={{ textAlign: 'left', fontSize: '14px', width: '100%' }}>
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
            
            <Flex gap={16} justify="space-between" style={{ width: '100%', marginTop: '16px' }}>
              <Select
                placeholder="Select Event Type"
                style={{ flex: 1 }}
                onChange={handleEventTypeChange}
                value={selectedEventType}
                allowClear
              >
                {eventTypes.map((eventType: EventTypeResponse) => (
                  <Select.Option key={eventType.name} value={eventType.name}>
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
        </div>
      </Flex>
      <Content>{children}</Content>
    </Layout>
  );
};
