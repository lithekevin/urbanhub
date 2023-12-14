import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { Trip } from "../../models/trip";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Attraction } from "../../models/attraction";

dayjs.extend(customParseFormat)

// Get the firestore db instance
const db = getFirestore(app);

// Get the reference to the collection (table) trips

const tripsCollection = collection(db, "trips");

// Read example
export const getTrips = async (): Promise<Trip[]> => {
  try {
    
    const documents : Trip[] = (await getDocs(tripsCollection)).docs.map(doc => {
      const data = doc.data();
      let trip = {
        id: doc.id,
        city: data.city,
        startDate: dayjs(data.startDate, 'DD/MM/YYYY'),
        endDate: dayjs(data.endDate, 'DD/MM/YYYY'),
        answers: data.answers,
        schedule: new Map<dayjs.Dayjs, Attraction[]>(),
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
      } as Trip;

      const sortedEntries = Object.entries(data.schedule).map(([date, attractions]) => ({
        date: dayjs(date, 'DD/MM/YYYY'),
        attractions: attractions as Attraction[],
      }));

      sortedEntries.sort((a, b) => a.date.isAfter(b.date) ? 1 : -1);

      sortedEntries.forEach((entry) => {
        trip.schedule.set(entry.date, entry.attractions);
      });

      return trip;

    });
    
    return documents;

  } catch (error) {
    console.error("Error during the reading of trips data:", error);
    throw error;
  }
};


