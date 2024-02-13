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
import { Attraction } from "../../models/attraction";
import {
  computeTripCost,
  fillSchedule,
  initializeAvailableAttractions,
} from "../../utils/tripCreation";

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
      nChildren: 0,
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
      nChildren: 1,
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
        nChildren: doc.data().nChildren,
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
        nChildren: docData.nChildren,
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

export const addAttractionToTrip = async (
  tripId: string,
  day: string,
  newAttraction: any
) => {
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

      

      const newStartDate = dayjs(newAttraction.startDate, 'HH:mm');
      const newEndDate = dayjs(newAttraction.endDate, 'HH:mm');
      const tripCityAttractions = cities.find((c) => c.name === tripData.city)!.attractions;

      let attractionsToBeRemoved: string[] = [];

      for(let i = 0; i < tripData.schedule[formattedDay].length; i++){
        const attraction = tripData.schedule[formattedDay][i];

        const attStartDate = dayjs(attraction.startDate, 'HH:mm');
        const attEndDate = dayjs(attraction.endDate, 'HH:mm');

        const distanceBetweenAttractions =
        Math.sqrt(
          Math.pow(
            tripCityAttractions.find((a) => a.id === newAttraction.id)!.location.latitude - tripCityAttractions.find((a) => a.id === attraction.id)!.location.latitude,
            2
          ) +
            Math.pow(
              tripCityAttractions.find((a) => a.id === newAttraction.id)!.location.longitude -
                tripCityAttractions.find((a) => a.id === attraction.id)!.location.longitude,
              2
            )
        ) * 111; //find the distance in meters between two attractions

        let transportTime;

        if (distanceBetweenAttractions < 2) {
          transportTime = distanceBetweenAttractions / 0.084; // in minutes
        } else {
          transportTime = distanceBetweenAttractions / 0.834;
        }

        if(attStartDate.isBefore(newStartDate) && !attEndDate.isBefore(newStartDate)){
          let resultDate = dayjs(newStartDate).subtract(transportTime, 'm');
          const minutes = resultDate.minute();
          const roundedMinutes = Math.floor(minutes / 5) * 5;
          resultDate = resultDate.minute(roundedMinutes).second(0);
          const prevEndDateToBeModified = resultDate.format('HH:mm');
          tripData.schedule[formattedDay][i].endDate = prevEndDateToBeModified;
        }
        else if(!attStartDate.isBefore(newStartDate) && !attEndDate.isAfter(newEndDate)){
          attractionsToBeRemoved.push(attraction.id);
        }
        else if(newStartDate.isBefore(attStartDate) && !newEndDate.isBefore(attStartDate)){
          let resultDate = dayjs(newEndDate).add(transportTime, 'm');
          const minutes = resultDate.minute();
          const roundedMinutes = Math.ceil(minutes / 5) * 5;
          resultDate = resultDate.minute(roundedMinutes).second(0);
          const succStartDateToBeModified = resultDate.format('HH:mm');
          tripData.schedule[formattedDay][i].startDate = succStartDateToBeModified;
        }

      }

      tripData.schedule[formattedDay] = tripData.schedule[formattedDay].filter((attraction: { id: string }) => !attractionsToBeRemoved.includes(attraction.id));

      // Add the new attraction to the day
      tripData.schedule[formattedDay].push(newAttraction);

      // Update the trip document with the new schedule
      await updateDoc(tripRef, { schedule: tripData.schedule });

      console.log("Attraction added successfully!");
    }
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const editAttraction = async (
  tripId: string,
  originalAttractionId: string,
  originalDay: dayjs.Dayjs,
  newDay: string,
  updatedAttraction: any
) => {
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
      const attractionIndex = tripData.schedule[formattedOriginalDay].findIndex(
        (attraction: { id: string }) => attraction.id === originalAttractionId
      );

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

      
      const newStartDate = dayjs(updatedAttraction.startDate, 'HH:mm');
      const newEndDate = dayjs(updatedAttraction.endDate, 'HH:mm');
      const tripCityAttractions = cities.find((c) => c.name === tripData.city)!.attractions;
      let attractionsToBeRemoved: string[] = [];

      for(let i = 0; i < tripData.schedule[formattedNewDay].length; i++){
        const attraction = tripData.schedule[formattedNewDay][i];

        const attStartDate = dayjs(attraction.startDate, 'HH:mm');
        const attEndDate = dayjs(attraction.endDate, 'HH:mm');

        const distanceBetweenAttractions =
        Math.sqrt(
          Math.pow(
            tripCityAttractions.find((a) => a.id === updatedAttraction.id)!.location.latitude - tripCityAttractions.find((a) => a.id === attraction.id)!.location.latitude,
            2
          ) +
            Math.pow(
              tripCityAttractions.find((a) => a.id === updatedAttraction.id)!.location.longitude -
                tripCityAttractions.find((a) => a.id === attraction.id)!.location.longitude,
              2
            )
        ) * 111; //find the distance in meters between two attractions

        let transportTime;

        if (distanceBetweenAttractions < 2) {
          transportTime = distanceBetweenAttractions / 0.084; // in minutes
        } else {
          transportTime = distanceBetweenAttractions / 0.834;
        }

        if(attStartDate.isBefore(newStartDate) && !attEndDate.isBefore(newStartDate)){
          let resultDate = dayjs(newStartDate).subtract(transportTime, 'm');
          const minutes = resultDate.minute();
          const roundedMinutes = Math.floor(minutes / 5) * 5;
          resultDate = resultDate.minute(roundedMinutes).second(0);
          const prevEndDateToBeModified = resultDate.format('HH:mm');
          tripData.schedule[formattedNewDay][i].endDate = prevEndDateToBeModified;
        }
        else if(!attStartDate.isBefore(newStartDate) && !attEndDate.isAfter(newEndDate)){
          attractionsToBeRemoved.push(attraction.id);
        }
        else if(newStartDate.isBefore(attStartDate) && !newEndDate.isBefore(attStartDate)){
          let resultDate = dayjs(newEndDate).add(transportTime, 'm');
          const minutes = resultDate.minute();
          const roundedMinutes = Math.ceil(minutes / 5) * 5;
          resultDate = resultDate.minute(roundedMinutes).second(0);
          const succStartDateToBeModified = resultDate.format('HH:mm');
          tripData.schedule[formattedNewDay][i].startDate = succStartDateToBeModified;
        }

      }

      tripData.schedule[formattedNewDay] = tripData.schedule[formattedNewDay].filter((attraction: { id: string }) => !attractionsToBeRemoved.includes(attraction.id));


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

export const editSettings = async (
  tripId: string | undefined,
  updatedFields: Partial<Trip> | null
): Promise<boolean> => {
  try {
    if (!tripId || !updatedFields) {
      throw new Error("Invalid tripId or updatedFields object");
    }

    const docRef = doc(tripsCollection, tripId);

    // Retrieve the existing document to get the current state
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("No such document!");
      return false;
    }

    const existingData = docSnap.data();

    const tripCity = cities.find((city) => city.name === existingData.city);

    // Extract the schedule from the existing document
    const existingSchedule = existingData?.schedule || {};

    // Merge the existing schedule with the updated schedule
    const mergedFields = { ...existingData, ...updatedFields };

    // Convert the trip.schedule Map to a plain object for Firestore
    const updatedSchedule = Array.from(
      mergedFields.schedule?.entries() || []
    ).reduce((acc, [date, attractions]) => {
      const formattedDate = date.format("DD/MM/YYYY");
      acc[formattedDate] = attractions.map((attraction) => ({
        id: attraction.id,
        startDate: attraction.startDate.format("HH:mm"),
        endDate: attraction.endDate.format("HH:mm"),
      }));
      return acc;
    }, {} as Record<string, any>);

    // Merge the existing schedule with the updated schedule
    let mergedSchedule = { ...existingSchedule, ...updatedSchedule };

    // Remove days from the schedule that are not in the new date range
    const newStartDate = dayjs(mergedFields.startDate, "DD/MM/YYYY");
    const newEndDate = dayjs(mergedFields.endDate, "DD/MM/YYYY");

    for (const date in mergedSchedule) {
      const currentDate = dayjs(date, "DD/MM/YYYY");
      if (
        currentDate.isBefore(newStartDate) ||
        currentDate.isAfter(newEndDate)
      ) {
        delete mergedSchedule[date];
      }
    }

    if (
      updatedFields.nAdults! + updatedFields.nChildren! >
        existingData.nAdults! + existingData.nChildren! ||
      updatedFields.budget! < existingData.budget!
    ) {
      // Reduce the cost of the trip by removing attractions and replacing them with free ones
      mergedSchedule = reduceCostsOfTrip(
        mergedFields,
        mergedSchedule,
        tripCity!
      );
    } else if (
      updatedFields.nAdults! + updatedFields.nChildren! <
        existingData.nAdults! + existingData.nChildren! ||
      updatedFields.budget! > existingData.budget!
    ) {
      //Increasing the cost of trip by removing duplicated free attractions and replacing them with paid ones
      mergedSchedule = increaseCostsOfTrip(
        mergedFields,
        mergedSchedule,
        tripCity!
      );
    }

    // Add missing days to the schedule and assign random trips
    for (let d = newStartDate; !d.isAfter(newEndDate); d = d.add(1, "day")) {
      const date = d.format("DD/MM/YYYY");
      if (!mergedSchedule[date]) {
        mergedSchedule[date] = [];
      }
    }

    fillSchedule(
      mergedSchedule,
      tripCity,
      mergedFields.nAdults!,
      mergedFields.nChildren!,
      mergedFields.budget!
    );

    // Update the document with the new fields and schedule
    await updateDoc(docRef, { ...mergedFields, schedule: mergedSchedule });

    console.log("Settings successfully updated!");

    return true;
  } catch (error) {
    console.error("Error editing settings: ", error);
    throw error;
  }
};

const reduceCostsOfTrip = (
  trip: Partial<Trip>,
  schedule: Record<string, any>,
  city: any
) => {
  let currentExpenses = 0;
  let availableAttractionsToBePicked = [...city.attractions];
  let newSchedule: any = {};
  let orderedSchedule: Record<string, any> = {};
  Object.keys(schedule)
    .sort(
      (a, b) => dayjs(a, "DD/MM/YYYY").unix() - dayjs(b, "DD/MM/YYYY").unix()
    )
    .forEach((key) => (orderedSchedule[key] = schedule[key]));

  for (const date in orderedSchedule) {
    const attractionsOfTheDay = orderedSchedule[date];
    newSchedule[date] = [];
    for (const attraction of attractionsOfTheDay) {
      const attractionDetails = availableAttractionsToBePicked.find(
        (a) => a.id === attraction.id
      );
      const attractionCost =
        (attractionDetails?.perPersonCost || 0) * (trip.nAdults! + trip.nChildren!);
      currentExpenses += attractionCost;

      if (currentExpenses <= trip.budget!) {
        newSchedule[date].push(attraction);
      } else {
        break;
      }
    }
  }

  fillSchedule(newSchedule, city, trip.nAdults!, trip.nChildren!, trip.budget!);

  return newSchedule;
};

const increaseCostsOfTrip = (
  trip: Partial<Trip>,
  schedule: Record<string, any>,
  city: any
) => {
  let availablePaidAttractionsToBePicked = initializeAvailableAttractions(
    city.attractions,
    trip.nAdults!,
    trip.nChildren!,
    trip.budget! -
      computeTripCost(schedule, city.attractions, trip.nAdults!, trip.nChildren!),
    true
  ).filter((att) => att.perPersonCost !== 0);
  let alreadyUsedAttractions: any = [];
  let newSchedule: any = {};
  let orderedSchedule: Record<string, any> = {};
  Object.keys(schedule)
    .sort(
      (a, b) => dayjs(a, "DD/MM/YYYY").unix() - dayjs(b, "DD/MM/YYYY").unix()
    )
    .forEach((key) => (orderedSchedule[key] = schedule[key]));

  // Creare un array di tutti gli ID delle attrazioni in orderedSchedule
  let attractionIdsInSchedule: any = [];
  for (const date in orderedSchedule) {
    for (const attraction of orderedSchedule[date]) {
      attractionIdsInSchedule.push(attraction.id);
    }
  }

  // Ordinare availablePaidAttractionsToBePicked in modo che le attrazioni non presenti in orderedSchedule vengano prima
  availablePaidAttractionsToBePicked.sort((a, b) => {
    const aIsInSchedule = attractionIdsInSchedule.includes(a.id);
    const bIsInSchedule = attractionIdsInSchedule.includes(b.id);

    if (aIsInSchedule && !bIsInSchedule) {
      return 1;
    } else if (!aIsInSchedule && bIsInSchedule) {
      return -1;
    } else {
      return 0;
    }
  });

  for (const date in orderedSchedule) {
    const attractionsOfTheDay = orderedSchedule[date];
    newSchedule[date] = [];

    for (const attraction of attractionsOfTheDay) {
      const attractionDetails = city.attractions.find(
        (att: Attraction) => att.id === attraction.id
      );
      if (attractionDetails.perPersonCost === 0) {
        if (availablePaidAttractionsToBePicked.length !== 0) {
          if (alreadyUsedAttractions.includes(attractionDetails.id)) {
            const attractionRandomIndex = Math.floor(
              Math.random() * availablePaidAttractionsToBePicked.length
            );
            const attractionToBeAdded = {
              id: availablePaidAttractionsToBePicked[attractionRandomIndex].id,
              startDate: attraction.startDate,
              endDate: attraction.endDate,
            };

            newSchedule[date].push(attractionToBeAdded);
            availablePaidAttractionsToBePicked.splice(attractionRandomIndex, 1);
          } else {
            newSchedule[date].push(attraction);
            alreadyUsedAttractions.push(attraction.id);
          }
        } else {
          newSchedule[date].push(attraction);
        }
      } else {
        newSchedule[date].push(attraction);
      }
    }
  }

  return newSchedule;
};

const handleRandomTripsForDay = (
  attractions: Attraction[],
  budget: number
): { id: string; startDate: string; endDate: string }[] => {
  const nAttractions = Math.floor(Math.random() * 3) + 5;
  const scheduleForDay: { id: string; startDate: string; endDate: string }[] =
    [];
  const attractionsCopy = [...attractions]; // Create a copy
  let currentExpenses = 0;

  for (let i = 0; i < nAttractions; i++) {
    if (attractionsCopy.length === 0) {
      // Reset attractions if empty (consider attractions with perPersonCost === 0)
      attractionsCopy.push(
        ...attractions.filter((attraction) => attraction.perPersonCost === 0)
      );
    }

    const index = Math.floor(Math.random() * attractionsCopy.length);
    const selectedAttraction = attractionsCopy[index];

    // Calculate start and end hours for the selected attraction
    const startHour: number =
      i === 0 ? 8 : parseInt(scheduleForDay[i - 1].endDate.split(":")[0]); // Start at 8 AM for the first attraction, else endHour of the previous attraction
    const endHour: number =
      startHour + Math.floor(selectedAttraction.estimatedTime / 60);

    // Check if the trip exceeds the budget
    const tripCost = selectedAttraction.perPersonCost * (1 + 0.5); // Assuming 1 adult
    if (currentExpenses + tripCost > budget) {
      // Reuse old attractions
      attractionsCopy.push(
        ...scheduleForDay.map(
          (attraction) => attractions.find((a) => a.id === attraction.id)!
        )
      );
      continue; // Retry with the same index
    }

    const tripAttraction = {
      id: selectedAttraction.id,
      startDate: startHour.toString().padStart(2, "0") + ":00",
      endDate: endHour.toString().padStart(2, "0") + ":00",
    };

    scheduleForDay.push(tripAttraction);

    // Update current expenses
    currentExpenses += tripCost;

    attractionsCopy.splice(index, 1);
  }

  return scheduleForDay;
};

export const editTrip = async (
  tripId: string | undefined,
  trip: Trip | null
) => {
  try {
    if (!tripId || !trip) {
      throw new Error("Invalid tripId or trip object");
    }

    const docRef = doc(tripsCollection, tripId);

    // Retrieve the existing document to get the current state
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("No such document!");
      return null;
    }

    // Extract the schedule from the existing document
    const existingSchedule = docSnap.data()?.schedule || {};

    // Convert the trip.schedule Map to a plain object for Firestore
    // Convert the trip.schedule Map to a plain object for Firestore
    const updatedSchedule = Array.from(trip.schedule.entries()).reduce(
      (acc, [date, attractions]) => {
        const formattedDate = date.format("DD/MM/YYYY");
        acc[formattedDate] = attractions.map((attraction) => ({
          id: attraction.id,
          startDate: attraction.startDate.format("HH:mm"),
          endDate: attraction.endDate.format("HH:mm"),
        }));
        return acc;
      },
      {} as Record<string, any> // Explicitly define the type of the accumulator
    );

    // Merge the existing schedule with the updated schedule
    const mergedSchedule = { ...existingSchedule, ...updatedSchedule };

    // Update the document with the new schedule
    await updateDoc(docRef, { schedule: mergedSchedule });

    console.log("Trip successfully updated!");
  } catch (error) {
    console.error("Error editing trip: ", error);
    throw error;
  }
};

export const deleteAttraction = async (
  id: string,
  date: dayjs.Dayjs,
  attractionId: string
) => {
  try {
    const docRef = doc(tripsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const tripData = docSnap.data();

      // Find the schedule for the specified date
      const scheduleForDate = tripData.schedule[date.format("DD/MM/YYYY")];

      if (scheduleForDate) {
        // Filter out the attraction to be deleted
        const updatedSchedule = scheduleForDate.filter(
          (attraction: TripAttraction) => attraction.id !== attractionId
        );

        // Update the schedule in the database
        await setDoc(docRef, {
          ...tripData,
          schedule: {
            ...tripData.schedule,
            [date.format("DD/MM/YYYY")]: updatedSchedule,
          },
        });
        console.log("Attraction deleted successfully!");
      }
    }
  } catch (error) {
    console.error("Error deleting attraction: ", error);
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
