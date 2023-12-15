import dayjs from 'dayjs';
import { Attraction } from './attraction';

export interface TripAttraction extends Attraction {
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
}