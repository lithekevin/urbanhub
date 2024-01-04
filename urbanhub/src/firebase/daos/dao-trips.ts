import { getFirestore, collection, setDoc, doc, getDocs } from "firebase/firestore";
import { app } from "../firebaseConfig";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Trip } from "../../models/trip";
import { TripAttraction } from "../../models/tripAttraction";

dayjs.extend(customParseFormat)

// Get the firestore db instance
const db = getFirestore(app);

// Get the reference to the collection (table) trips

const tripsCollection = collection(db, "trips");


// Set default trips in the DB (just to setup, never call this again)

export const setDefaultTrips = async () => {
    const trips = [
        {
            id: "T001",
            city: "Barcelona",
            startDate: "17/08/2024",
            endDate: "19/08/2024",
            nAdults: 2,
            nKids: 0,
            budget: 500,
            questions: ["What are the best museums in Barcelona?", "What are the best restaurants in Barcelona?"],
            answers: ["The Picasso Museum is the best museum in Barcelona", "The best restaurant in Barcelona is Can Paixano"],
            location: {
                latitude: 41.390205,
                longitude: 2.154007
            },
            image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        },

        {
            id: "T002",
            city: "London",
            startDate: "04/11/2024",
            endDate: "07/11/2024",
            nAdults: 3,
            nKids: 1,
            budget: 800,
            questions: ["What are the best museums in London?", "What are the best restaurants in London?"],
            answers: ["The British Museum is the best museum in London", "The best restaurant in London is The Fat Duck"],
            location: {
                latitude: 51.509865,
                longitude: -0.118092
            },
            image: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        }
    ];

    // Loop through the trips and add them to the DB

    try {
        for (const trip of trips) {
            await setDoc(doc(tripsCollection, trip.id), trip);
        }
    } catch (error) {
        console.error("Error adding document: ", error);
    }
}

// Get all trips from the DB

export const getAllTrips = async () => {
    const trips : Trip[] = [];

    try{

        const querySnapshot = await getDocs(tripsCollection);

        querySnapshot.forEach((doc) => {

            // Convert doc data to Trip object

            const trip: Trip = {
                id: doc.id,
                city: doc.data().city,
                startDate: dayjs(doc.data().startDate, "DD/MM/YYYY"),
                endDate: dayjs(doc.data().endDate, "DD/MM/YYYY"),
                nAdults: doc.data().nAdults,
                nKids: doc.data().nKids,
                budget: doc.data().budget,
                questions: doc.data().questions,
                answers: doc.data().answers,
                schedule: new Map<dayjs.Dayjs, TripAttraction[]>(),
                location: {
                    latitude: doc.data().location.latitude,
                    longitude: doc.data().location.longitude
                },
                image: doc.data().image
            }

            trips.push(trip);
        });

        return trips;

    } catch (error) {
        console.error("Error getting documents: ", error);
        throw error;
    }
    
}


// Add a new trip

interface TripAttractionDB {
    id: string;
    city: string;
    startDate: string;
    endDate: string;
    nAdults: number;
    nKids: number;
    budget: number;
    questions: string[];
    answers: string[];
    schedule: { [date: string]: any[] };
    location: {
        latitude: number;
        longitude: number;
    }
    image: string;
}

export const addTrip = async (trip: any) => {
    try {
        await setDoc(doc(tripsCollection, trip.id), trip);
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
}