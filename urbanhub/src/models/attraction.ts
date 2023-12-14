import dayjs from 'dayjs';

export interface Attraction {
    id: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    }
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
}