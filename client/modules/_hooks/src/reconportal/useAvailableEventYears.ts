import { useMemo } from 'react';
import type { ReconPortalEvent } from '@client/hooks';

/**
 * Returns a list of available years from events, filtered by event type if provided.
 */
export function useAvailableEventYears(
  events: ReconPortalEvent[],
  selectedEventType: string | null
): string[] {
  return useMemo(() => {
    const relevantEvents = selectedEventType
      ? events.filter((e) => e.event_type === selectedEventType)
      : events;

    const years = Array.from(
      new Set(
        relevantEvents.map((e) =>
          new Date(e.event_date).getFullYear().toString()
        )
      )
    ).sort((a, b) => Number(b) - Number(a));

    return years;
  }, [events, selectedEventType]);
}
