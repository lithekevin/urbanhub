import dayjs from 'dayjs';
import { Attraction } from './attraction';

export interface Trip {
    id: string;
    city: string;
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
    answers: string[];
    schedule: Map<dayjs.Dayjs, Attraction[]>;
    location: {
        latitude: number;
        longitude: number;
    }
    
}

