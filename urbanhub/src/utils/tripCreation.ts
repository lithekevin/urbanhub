import dayjs from "dayjs";
import { Trip } from "../models/trip";
import { Attraction } from "../models/attraction";

export const calculateNextTripID = function (trips: Trip[]): string {
  const nextID =
    trips.length > 0
      ? Math.max(...trips.map((trip) => parseInt(trip.id.slice(1)))) + 1
      : 1;

  return "T" + nextID.toString().padStart(3, "0");
};

export const createEmptyDatesInSchedule = function (
  startDate: string,
  endDate: string,
  schedule: { [date: string]: any[] }
) {
  const tripStartDate = dayjs(startDate, "DD/MM/YYYY");
  const tripEndDate = dayjs(endDate, "DD/MM/YYYY");

  for (let d = tripStartDate; !d.isAfter(tripEndDate); d = d.add(1, "day")) {
    const date = d.format("DD/MM/YYYY");
    schedule[date] = [];
  }
};

export const initializeAvailableAttractions = function (
  cityAttractions: any,
  adults: number,
  children: number,
  budget: number,
  isFirstCall: boolean
) {
  let availableAttractionsToBePicked: Attraction[] = []; // list of attractions that can be picked for the trip creation

  let currentExpenses = 0;
  const nTotPersons = adults + children;

  for (const attraction of cityAttractions) {
    if (attraction.perPersonCost === 0) {
      availableAttractionsToBePicked.push(attraction);
    } else if (
      isFirstCall &&
      currentExpenses + attraction.perPersonCost * nTotPersons <= budget
    ) {
      availableAttractionsToBePicked.push(attraction);
      currentExpenses += attraction.perPersonCost * nTotPersons;
    }
  }

  return availableAttractionsToBePicked;
};

export const fillFirstAttractionPerDay = function (
  availableAttractionsToBePicked: Attraction[],
  schedule: { [date: string]: any[] },
  date: string
) {
  const attractionRandomIndex = Math.floor(
    Math.random() * availableAttractionsToBePicked.length
  ); // pick a random attraction from the list of available attractions to be picked
  const attraction = availableAttractionsToBePicked[attractionRandomIndex]; // extract it from the list of attractions to be picked

  let tripAttraction = {
    id: attraction.id,
    startDate: "",
    endDate: "",
  };

  const endHour = 9 + Math.floor(attraction.estimatedTime / 60);
  const endHourString = endHour.toString().padStart(2, "0");

  const endMinutes = Math.floor(attraction.estimatedTime % 60);
  const endMinutesString = endMinutes.toString().padStart(2, "0");

  tripAttraction.startDate = "09:00";
  tripAttraction.endDate = endHourString + ":" + endMinutesString;

  schedule[date].push(tripAttraction);

  availableAttractionsToBePicked.splice(attractionRandomIndex, 1); // popping the selected attraction from the available attractions array
};

export const findTheCloserAttraction = function (
  availableAttractionsToBePicked: Attraction[],
  tripCity: any,
  previousAttractionID: string
) {
  let minDistance = Number.MAX_SAFE_INTEGER;

  let closestAttractionIndex = 0;

  for (let i = 0; i < availableAttractionsToBePicked.length; i++) {
    const attractionOfTheList = availableAttractionsToBePicked[i];

    const attractionLatitude = attractionOfTheList.location.latitude;
    const attractionLongitude = attractionOfTheList.location.longitude;

    const previousAttractionLatitude = tripCity!.attractions.find(
      (att: Attraction) => att.id === previousAttractionID
    )!.location.latitude;
    const previousAttractionLongitude = tripCity!.attractions.find(
      (att: Attraction) => att.id === previousAttractionID
    )!.location.longitude;

    const distance = Math.sqrt(
      Math.pow(attractionLatitude - previousAttractionLatitude, 2) +
        Math.pow(attractionLongitude - previousAttractionLongitude, 2)
    );

    if (
      distance < minDistance &&
      previousAttractionID !== attractionOfTheList.id
    ) {
      minDistance = distance;
      closestAttractionIndex = i;
    }
  }

  return closestAttractionIndex;
};

export const computeStartTime = function (
  previousAttraction: Attraction,
  nextAttraction: Attraction,
  endPreviousAttractionMinutes: number
) {
  const distanceBetweenAttractions =
    Math.sqrt(
      Math.pow(
        nextAttraction.location.latitude - previousAttraction.location.latitude,
        2
      ) +
        Math.pow(
          nextAttraction.location.longitude -
            previousAttraction.location.longitude,
          2
        )
    ) * 111; //find the distance in meters between two attractions

  let transportTime;

  if (distanceBetweenAttractions < 2) {
    transportTime = distanceBetweenAttractions / 0.084; // in minutes
  } else {
    transportTime = distanceBetweenAttractions / 0.834;
  }

  const startTime = endPreviousAttractionMinutes + transportTime;

  const startHour = Math.floor(startTime / 60)
    .toString()
    .padStart(2, "0");
  const startMinutes = Math.floor(Math.ceil((startTime % 60) / 5) * 5)
    .toString()
    .padStart(2, "0");

  if (startMinutes === "60") {
    return (parseInt(startHour) + 1).toString().padStart(2, "0") + ":00";
  }

  return startHour + ":" + startMinutes;
};

export const computeEndTime = function (
  nextAttraction: Attraction,
  startDate: string
) {
  const startTime =
    parseInt(startDate.split(":")[0]) * 60 + parseInt(startDate.split(":")[1]);

  const endTime = startTime + nextAttraction.estimatedTime;

  const endHour = Math.floor(endTime / 60)
    .toString()
    .padStart(2, "0");
  const endMinutes = Math.floor(endTime % 60)
    .toString()
    .padStart(2, "0");

  return endHour + ":" + endMinutes;
};

export const endsAfter18 = function (endTime: string) {
  const endHour = parseInt(endTime.split(":")[0]);

  return endHour >= 18;
};

export const fillAttractionInSchedule = function (
  schedule: { [date: string]: any[] },
  date: string,
  availableAttractionsToBePicked: Attraction[],
  tripCity: any
) {
  const previousAttraction = schedule[date][schedule[date].length - 1];

  const previousAttractionID = previousAttraction.id;

  const previousAttractionEndHour = parseInt(
    previousAttraction.endDate.split(":")[0]
  );

  const previousAttractionEndMinute = parseInt(
    previousAttraction.endDate.split(":")[1]
  );

  const previousAttractionEndHourMinutes =
    previousAttractionEndHour * 60 + previousAttractionEndMinute; //minutes from 00:00 to the end of the previous attraction

  let nextAttractionIndex = 0;
  let nextAttraction: Attraction;

  do {
    nextAttractionIndex = findTheCloserAttraction(
      availableAttractionsToBePicked,
      tripCity,
      previousAttractionID
    );
    nextAttraction = availableAttractionsToBePicked.splice(
      nextAttractionIndex,
      1
    )[0];
  } while (
    availableAttractionsToBePicked.length !== 0 &&
    nextAttraction &&
    schedule[date].find((a: Attraction) => a.id === nextAttraction.id)
  );

  let tripAttraction = {
    id: nextAttraction.id,
    startDate: "",
    endDate: "",
  };

  tripAttraction.startDate = computeStartTime(
    tripCity.attractions.find(
      (a: Attraction) => a.id === previousAttraction.id
    ),
    nextAttraction,
    previousAttractionEndHourMinutes
  );

  if(endsAfter18(tripAttraction.startDate)){
    return true;
  }

  tripAttraction.endDate = computeEndTime(
    nextAttraction,
    tripAttraction.startDate
  );

  schedule[date].push(tripAttraction);

  return endsAfter18(tripAttraction.endDate); // check if the attraction ends after 18:00
};

export const computeTripCost = function (
  schedule: { [date: string]: any[] },
  cityAttractions: Attraction[],
  nAdults: number,
  nChildren: number
) {
  let totalCost = 0;

  for (const date in schedule) {
    for (const attraction of schedule[date]) {
      totalCost +=
        cityAttractions.find((att: Attraction) => att.id === attraction.id)!
          .perPersonCost *
        (nAdults + nChildren);
    }
  }

  return totalCost;
};

export const fillSchedule = function (
  schedule: { [date: string]: any[] },
  tripCity: any,
  adults: number,
  children: number,
  budget: number
) {
  let availableAttractionsToBePicked: Attraction[] = []; // list of attractions that can be picked for the trip creation

  const partialTripCost = computeTripCost(
    schedule,
    tripCity.attractions,
    adults,
    children
  );

  availableAttractionsToBePicked = initializeAvailableAttractions(
    tripCity!.attractions,
    adults,
    children,
    budget - partialTripCost,
    true
  ); // fill the list of available attractions to be picked with free attractions and attractions that fit the budget

  for (const date in schedule) {
    let dayCompleted = false;

    while (!dayCompleted) {
      if (availableAttractionsToBePicked.length === 0) {
        // when the list of available attractions to be picked is empty, initialize it again
        availableAttractionsToBePicked = initializeAvailableAttractions(
          tripCity!.attractions,
          adults,
          children,
          budget,
          false
        ); // fill the list of available attractions to be picked with free attractions
      }

      if (schedule[date].length === 0) {
        // if the schedule date is empty, add the first attraction in a random way starting from 09:00

        fillFirstAttractionPerDay(
          availableAttractionsToBePicked,
          schedule,
          date
        );
      } else {
        dayCompleted = fillAttractionInSchedule(
          schedule,
          date,
          availableAttractionsToBePicked,
          tripCity
        );
      }
    }
  }
};
