import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { Trip } from "../../models/trip";

// Get the firestore db instance
const db = getFirestore(app);

// Get the reference to the collection (table) trips

const tripsCollection = collection(db, "trips");

// Read example
export const getTrips = async (): Promise<Trip[]> => {
  try {
    // use getDocs to create an array of documents
    const documents : Trip[] = (await getDocs(tripsCollection)).docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
    
    return documents;

  } catch (error) {
    console.error("Error during the reading of trips data:", error);
    throw error;
  }
};


