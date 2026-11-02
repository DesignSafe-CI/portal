import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { useSearchParams } from 'react-router-dom';

export type TNcoSchedItem = {
    dateStart: {
        $date: number;
    };
    dateEnd: {
        $date: number;
    };
    facility: string,
    awardTitle: string,
    awardNumber: string,
    piName: string,
    awardDescription: string,
    directorate: string,
}

export type TNcoSchedListing = {
    response: TNcoSchedItem[];
}

async function getNcoSchedListing({
    searchString,
    signal,
}: {
    searchString: string;
    signal: AbortSignal;
}) {
    const resp = await apiClient.get<TNcoSchedListing>(
        `/nco/api/sched_events${searchString ? '?' + searchString : ''}`,
        {
            signal,
        }
    );
    return resp.data;
}

export function useNcoSchedListing() {
    const [searchParams] = useSearchParams();
    const searchString = searchParams.toString();

    return useQuery({
        queryKey: ['nco', 'listing', 'scheduler', searchString],
        queryFn: ({signal}) =>
            getNcoSchedListing({ searchString, signal }),
    });
}