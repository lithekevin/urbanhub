import {
  getFirestore,
  collection,
  setDoc,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Trip } from "../../models/trip";
import { TripAttraction } from "../../models/tripAttraction";
import cities from "../cities";

dayjs.extend(customParseFormat);

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
      questions: [
        "What are the best museums in Barcelona?",
        "What are the best restaurants in Barcelona?",
      ],
      answers: [
        "The Picasso Museum is the best museum in Barcelona",
        "The best restaurant in Barcelona is Can Paixano",
      ],
      location: {
        latitude: 41.390205,
        longitude: 2.154007,
      },
      schedule: {},
      image:
        "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },

    {
      id: "T002",
      city: "London",
      startDate: "04/11/2024",
      endDate: "07/11/2024",
      nAdults: 3,
      nKids: 1,
      budget: 800,
      questions: [
        "What are the best museums in London?",
        "What are the best restaurants in London?",
      ],
      answers: [
        "The British Museum is the best museum in London",
        "The best restaurant in London is The Fat Duck",
      ],
      location: {
        latitude: 51.509865,
        longitude: -0.118092,
      },
      schedule: {},
      image:
        "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  // Loop through the trips and add them to the DB

  try {
    for (const trip of trips) {
      await setDoc(doc(tripsCollection, trip.id), trip);
    }
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

// Get all trips from the DB

export const getAllTrips = async () => {
  const trips: Trip[] = [];

  try {
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
          longitude: doc.data().location.longitude,
        },
        image: doc.data().image,
      };

      // iterate through the schedule keys and convert them to dayjs objects

      const scheduleKeys = Object.keys(doc.data().schedule);

      scheduleKeys.sort((a, b) => {
        const dateA = dayjs(a, "DD/MM/YYYY");
        const dateB = dayjs(b, "DD/MM/YYYY");

        if (dateA.isBefore(dateB)) {
          return -1;
        } else if (dateA.isAfter(dateB)) {
          return 1;
        } else {
          return 0;
        }
      });

      scheduleKeys.forEach((key) => {
        const attractions: TripAttraction[] = [];

        const attractionsInfo = cities.find(
          (city) => city.name === doc.data().city
        )?.attractions;

        doc.data().schedule[key].sort((a: any, b: any) => {
          const dateA = dayjs(key + " " + a.startDate, "DD/MM/YYYY HH:mm");
          const dateB = dayjs(key + " " + b.startDate, "DD/MM/YYYY HH:mm");

          if (dateA.isBefore(dateB)) {
            return -1;
          } else if (dateA.isAfter(dateB)) {
            return 1;
          } else {
            return 0;
          }
        });

        doc.data().schedule[key].forEach((attraction: any) => {
          const attractionInfo = attractionsInfo!.find(
            (attractionInfo) => attractionInfo.id === attraction.id
          );

          attractions.push({
            id: attraction.id,
            name: attractionInfo!.name,
            city: attractionInfo!.city,
            location: {
              latitude: attractionInfo!.location.latitude,
              longitude: attractionInfo!.location.longitude,
            },
            estimatedTime: attractionInfo!.estimatedTime,
            perPersonCost: attractionInfo!.perPersonCost,
            startDate: dayjs(
              key + " " + attraction.startDate,
              "DD/MM/YYYY HH:mm"
            ),
            endDate: dayjs(key + " " + attraction.endDate, "DD/MM/YYYY HH:mm"),
          });
        });

        trip.schedule.set(dayjs(key, "DD/MM/YYYY"), attractions);
      });

      trips.push(trip);
    });

    return trips;
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

// Get a trip by id

export const getTripById = async (id: string) => {
  try {
    const docRef = doc(tripsCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("No such document!");
      return null;
    } else {
      const docData = docSnap.data();

      const trip: Trip = {
        id: docSnap.id,
        city: docData.city,
        startDate: dayjs(docData.startDate, "DD/MM/YYYY"),
        endDate: dayjs(docData.endDate, "DD/MM/YYYY"),
        nAdults: docData.nAdults,
        nKids: docData.nKids,
        budget: docData.budget,
        questions: docData.questions,
        answers: docData.answers,
        schedule: new Map<dayjs.Dayjs, TripAttraction[]>(),
        location: {
          latitude: docData.location.latitude,
          longitude: docData.location.longitude,
        },
        image: docData.image,
      };

      // iterate through the schedule keys and convert them to dayjs objects

      const scheduleKeys = Object.keys(docData.schedule);

      scheduleKeys.sort((a, b) => {
        const dateA = dayjs(a, "DD/MM/YYYY");
        const dateB = dayjs(b, "DD/MM/YYYY");

        if (dateA.isBefore(dateB)) {
          return -1;
        } else if (dateA.isAfter(dateB)) {
          return 1;
        } else {
          return 0;
        }
      });

      scheduleKeys.forEach((key) => {
        const attractions: TripAttraction[] = [];

        docData.schedule[key].sort((a: any, b: any) => {
          const dateA = dayjs(key + " " + a.startDate, "DD/MM/YYYY HH:mm");
          const dateB = dayjs(key + " " + b.startDate, "DD/MM/YYYY HH:mm");

          if (dateA.isBefore(dateB)) {
            return -1;
          } else if (dateA.isAfter(dateB)) {
            return 1;
          } else {
            return 0;
          }
        });

        const attractionsInfo = cities.find(
          (city) => city.name === docData.city
        )?.attractions;

        docData.schedule[key].forEach((attraction: any) => {
          const attractionInfo = attractionsInfo!.find(
            (attractionInfo) => attractionInfo.id === attraction.id
          );

          attractions.push({
            id: attraction.id,
            name: attractionInfo!.name,
            city: attractionInfo!.city,
            location: {
              latitude: attractionInfo!.location.latitude,
              longitude: attractionInfo!.location.longitude,
            },
            estimatedTime: attractionInfo!.estimatedTime,
            perPersonCost: attractionInfo!.perPersonCost,
            startDate: dayjs(
              key + " " + attraction.startDate,
              "DD/MM/YYYY HH:mm"
            ),
            endDate: dayjs(key + " " + attraction.endDate, "DD/MM/YYYY HH:mm"),
          });
        });

        trip.schedule.set(dayjs(key, "DD/MM/YYYY"), attractions);
      });

      return trip;
    }
  } catch (error) {
    console.error("Error getting document: ", error);
    throw error;
  }
};

export const addAttractionToTrip = async (tripId: string, day: string, newAttraction: any) => {
  try {
    // Get the trip document
    const tripRef = doc(tripsCollection, tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      console.log("No such document!");
      return null;
    } else {
      // Get the trip data
      const tripData = tripSnap.data();

      // Convert the day to the required format
      const formattedDay = dayjs(day, "DD/MM/YYYY").format("DD/MM/YYYY");

      // Check if the day exists in the schedule
      if (!tripData.schedule[formattedDay]) {
        tripData.schedule[formattedDay] = [];
      }

      // Add the new attraction to the day
      tripData.schedule[formattedDay].push(newAttraction);
      
      console.log(tripData);
      // Update the trip document with the new schedule
      await updateDoc(tripRef, { schedule: tripData.schedule });

      console.log("Attraction added successfully!");
    }
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};


export const editAttraction = async (tripId: string, originalAttractionId : string, originalDay: dayjs.Dayjs, newDay: string, updatedAttraction: any) => {
  try {
    // Get the trip document
    const tripRef = doc(tripsCollection, tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      console.log("No such document!");
      return null;
    } else {
      // Get the trip data
      const tripData = tripSnap.data();

      // Convert the days to the required format
      const formattedOriginalDay = originalDay.format("DD/MM/YYYY");
      const formattedNewDay = dayjs(newDay, "DD/MM/YYYY").format("DD/MM/YYYY");

      // Check if the original day exists in the schedule
      if (!tripData.schedule[formattedOriginalDay]) {
        console.log("No attractions scheduled for this day!");
        return null;
      }

      // Find the attraction to be updated
      const attractionIndex = tripData.schedule[formattedOriginalDay].findIndex((attraction: { id: string }) => attraction.id === originalAttractionId);

      if (attractionIndex === -1) {
        console.log("Attraction not found!");
        return null;
      }

      // Remove the attraction from the original day
      tripData.schedule[formattedOriginalDay].splice(attractionIndex, 1);

      // Check if the new day exists in the schedule
      if (!tripData.schedule[formattedNewDay]) {
        tripData.schedule[formattedNewDay] = [];
      }

      // Add the updated attraction to the new day
      tripData.schedule[formattedNewDay].push(updatedAttraction);

      // Update the trip document with the new schedule
      await updateDoc(tripRef, { schedule: tripData.schedule });

      console.log("Attraction updated successfully!");
    }
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const editTrip = async (tripId: string | undefined, trip: Trip | null) => {
  try {
    // Get the trip document
    const tripRef = doc(tripsCollection, tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      console.log("No such document!");
      return null;
    } else {  
      const tripData = tripSnap.data();
      tripData.schedule.length = 0; //Clear the scehdule

      trip?.schedule.forEach((attractions, date) =>{
        tripData.schedule[date.format("DD/MM/YYYY")] = [];
        attractions.forEach((attraction) => {
          tripData.schedule[date.format("DD/MM/YYYY")].push(attraction);
        });
      });
      // Update the trip document with the new schedule
      await updateDoc(tripRef, { schedule: tripData.schedule });

      console.log("Trip updated successfully!");
    }
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};



export const deleteAttraction = async (id: string, date: dayjs.Dayjs, attractionId: string) => {
  try {
    const docRef = doc(tripsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const tripData = docSnap.data();

      // Find the schedule for the specified date
      const scheduleForDate = tripData.schedule[date.format('DD/MM/YYYY')];

      if (scheduleForDate) {
        // Filter out the attraction to be deleted
        const updatedSchedule = scheduleForDate.filter((attraction: TripAttraction) => attraction.id !== attractionId);

        // Update the schedule in the database
        await setDoc(docRef, { ...tripData, schedule: { ...tripData.schedule, [date.format('DD/MM/YYYY')]: updatedSchedule } });
        console.log("Attraction deleted successfully!");
      }
    }
  } catch (error) {
    console.error('Error deleting attraction: ', error);
    throw error;
  }
};


// Add a new trip

export const addTrip = async (trip: any) => {
  try {
    await setDoc(doc(tripsCollection, trip.id), trip);
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};



// Delete a trip

export const deleteTrip = async (id: string) => {
  try {
    await deleteDoc(doc(tripsCollection, id));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};
