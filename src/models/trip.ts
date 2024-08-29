import dayjs from 'dayjs';
import { TripAttraction } from './tripAttraction';

export interface Trip {
    id: string;
    city: string;
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
    nAdults: number;
    nChildren: number;
    budget: number;
    questions: string[];
    answers: string[];
    schedule: Map<dayjs.Dayjs, TripAttraction[]>;
    location: {
        latitude: number;
        longitude: number;
    }
    image: string;
    
}

