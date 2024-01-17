export interface Attraction {
    id: string;
    name: string;
    city: string;
    location: {
        latitude: number;
        longitude: number;
    }
    estimatedTime: number; // in minutes
    perPersonCost: number;
}