import { Attraction } from "./attraction";

export interface City {
    name: string;
    location: {
        latitude: number;
        longitude: number;
    };
    image: string;
    attractions: Attraction[];
}
