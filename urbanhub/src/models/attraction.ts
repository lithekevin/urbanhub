import dayjs from 'dayjs';

export interface Attraction {
    attractionId: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    }
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
}