import dayjs from 'dayjs';

export interface Attraction {
    id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    }
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
}