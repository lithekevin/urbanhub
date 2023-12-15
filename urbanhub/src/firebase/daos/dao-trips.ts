import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';

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
            location: {
                latitude: 41.390205,
                longitude: 2.154007
            },
        },

        {
            id: "T002",
            city: "London",
            startDate: "04/11/2024",
            endDate: "07/11/2024",
            location: {
                latitude: 51.509865,
                longitude: -0.118092
            },
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

