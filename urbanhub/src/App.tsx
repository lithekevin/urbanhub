import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import { Row } from "react-bootstrap";
import { Result, Button } from "antd";
import NavigationBar from "./components/NavigationBar";
import MyTrips from "./pages/MyTrips";
import NewTrip from "./pages/NewTrip";
import TripOverview from "./pages/TripOverview";
import FooterComponent from "./components/FooterComponent";
import { LoadScript } from "@react-google-maps/api";
import { Trip } from "./models/trip";
import { addTrip, getAllTrips } from "./firebase/daos/dao-trips";
import cities from "./firebase/cities";
import dayjs from "dayjs";
import { message } from "antd";
import { Attraction } from "./models/attraction";
import { ArrayTypeNode } from "typescript";

function App() {
  return (
    <BrowserRouter>
      <div className="wrapper">
        <NavigationBar />
        <LoadScript
          googleMapsApiKey="AIzaSyDYwrQtanLbPehi6huH0sY0FMnvHo4Tg1w"
          language="en"
        >
          <Main />
        </LoadScript>
        <FooterComponent />
      </div>
    </BrowserRouter>
  );
}

function Main() {
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();

  const handleTripSubmission = (data: {
    destination: string;
    dateRange: string[];
    adults: number;
    kids: number;
    budget: number;
    questions: string[];
    answers: string[];
  }) => {

    const calculateNextTripID = function (trips: Trip[]): string {
      const nextID =
        trips.length > 0
          ? Math.max(...trips.map((trip) => parseInt(trip.id.slice(1)))) + 1
          : 1;

      return "T" + nextID.toString().padStart(3, "0");
    }

    const createEmptyDatesInSchedule = function (startDate: string, endDate: string, schedule: { [date: string]: any[] } ) {
      const tripStartDate = dayjs(startDate, "DD/MM/YYYY");
      const tripEndDate = dayjs(endDate, "DD/MM/YYYY");

      for (let d = tripStartDate; !d.isAfter(tripEndDate); d = d.add(1, "day")) {
        const date = d.format("DD/MM/YYYY");
        schedule[date] = [];
      }
    }

    const initializeAvailableAttractions = function (cityAttractions: any, adults: number, kids: number, budget: number, isFirstCall: boolean) {
      let availableAttractionsToBePicked: Attraction[] = []; // list of attractions that can be picked for the trip creation

      let currentExpenses = 0;
      const nTotPersons = adults + kids;

      for (const attraction of cityAttractions) {
        if (attraction.perPersonCost === 0) {
          availableAttractionsToBePicked.push(attraction);
        }
        else if (
          isFirstCall && (currentExpenses + attraction.perPersonCost * nTotPersons <= budget)
        ) {
          availableAttractionsToBePicked.push(attraction);
          currentExpenses += attraction.perPersonCost * nTotPersons;
        }
      }

      return availableAttractionsToBePicked;
    }

    const fillFirstAttractionPerDay = function (availableAttractionsToBePicked: Attraction[], schedule: { [date: string]: any[] }, date: string) {

      const attractionRandomIndex = Math.floor(Math.random() * availableAttractionsToBePicked.length); // pick a random attraction from the list of available attractions to be picked
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

    }

    const findTheCloserAttraction = function(availableAttractionsToBePicked: Attraction[], tripCity: any, previousAttractionID: string) {

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
            Math.pow(
              attractionLongitude - previousAttractionLongitude,
              2
            )
        );

        if (
          distance < minDistance && previousAttractionID !== attractionOfTheList.id
        ) {
          minDistance = distance;
          closestAttractionIndex = i;
        }
      }

      return closestAttractionIndex

    }

    const computeStartTime = function(previousAttraction: Attraction, nextAttraction: Attraction, endPreviousAttractionMinutes: number) {

      const distanceBetweenAttractions = Math.sqrt(
        Math.pow(nextAttraction.location.latitude - previousAttraction.location.latitude, 2) +
          Math.pow(
            nextAttraction.location.longitude - previousAttraction.location.longitude,
            2
          ) 
      ) * 111 //find the distance in meters between two attractions

      let transportTime;

      if(distanceBetweenAttractions < 2){
        transportTime = distanceBetweenAttractions/84; // in minutes
      }
      else{
        transportTime = distanceBetweenAttractions/834;
      }

      const startTime = endPreviousAttractionMinutes + transportTime

      const startHour = Math.floor(startTime / 60).toString().padStart(2, "0")
      const startMinutes = Math.floor(startTime % 60).toString().padStart(2, "0")

      return startHour + ":" + startMinutes;

    }

    const computeEndTime = function(nextAttraction: Attraction, startDate: string) {

      const startTime = parseInt(startDate.split(":")[0]) * 60 + parseInt(startDate.split(":")[1])

      const endTime = startTime + nextAttraction.estimatedTime

      const endHour = Math.floor(endTime / 60).toString().padStart(2, "0")
      const endMinutes = Math.floor(endTime % 60).toString().padStart(2, "0")

      return endHour + ":" + endMinutes;

    }

    const fillAttractionInSchedule = function (schedule: { [date: string]: any[] }, date: string, availableAttractionsToBePicked: Attraction[], tripCity: any) {

      const previousAttraction = schedule[date][schedule[date].length - 1];

      const previousAttractionID = previousAttraction.id;

      const previousAttractionEndHour = parseInt(
        previousAttraction.endDate.split(":")[0]
      );

      const previousAttractionEndMinute = parseInt(
        previousAttraction.endDate.split(":")[1]
      );

      const previousAttractionEndHourMinutes = previousAttractionEndHour * 60 + previousAttractionEndMinute; //minutes from 00:00 to the end of the previous attraction

      const nextAttractionIndex = findTheCloserAttraction(availableAttractionsToBePicked, tripCity, previousAttractionID);

      const nextAttraction = availableAttractionsToBePicked[nextAttractionIndex];

      let tripAttraction = {
        id: nextAttraction.id,
        startDate: "",
        endDate: "",
      };

      tripAttraction.startDate = computeStartTime(previousAttraction, nextAttraction, previousAttractionEndHourMinutes);
      tripAttraction.endDate = computeEndTime(nextAttraction, tripAttraction.startDate);

      schedule[date].push(tripAttraction);
      availableAttractionsToBePicked.splice(nextAttractionIndex, 1);

    //fare il check per controllare se l'attrazione finisce dopo le 18 in quel caso settare dayCompleted a true
      

    }

    const fillSchedule = function (schedule: { [date: string]: any[] }, tripCity: any) {

      let availableAttractionsToBePicked: Attraction[] = []; // list of attractions that can be picked for the trip creation

      availableAttractionsToBePicked = initializeAvailableAttractions(tripCity!.attractions, data.adults, data.kids, data.budget, true); // fill the list of available attractions to be picked with free attractions and attractions that fit the budget

      for (const date in schedule) {

        let dayCompleted = false;

        while (!dayCompleted) {

          if (availableAttractionsToBePicked.length === 0) { // when the list of available attractions to be picked is empty, initialize it again
            availableAttractionsToBePicked = initializeAvailableAttractions(tripCity!.attractions, data.adults, data.kids, data.budget, false); // fill the list of available attractions to be picked with free attractions
          }

          if (schedule[date].length === 0) { // if the schedule date is empty, add the first attraction in a random way starting from 09:00

            fillFirstAttractionPerDay(availableAttractionsToBePicked, schedule, date);

          } else {
            
            fillAttractionInSchedule(schedule, date, availableAttractionsToBePicked, tripCity);

          }
        }
      }

    }


    getAllTrips()
      .then((trips: Trip[]) => {

        const tripCity = cities.find((city) => city.name === data.destination);  // city object of the city to be visited

        const nextTripID = calculateNextTripID(trips);

        const tripToAdd = {
          id: nextTripID,
          city: data.destination,
          startDate: data.dateRange[0],
          endDate: data.dateRange[1],
          nAdults: data.adults,
          nKids: data.kids,
          budget: data.budget,
          questions: data.questions,
          answers: data.answers,
          schedule: {},
          location: {
            latitude: tripCity ? tripCity.location.latitude : 0,
            longitude: tripCity ? tripCity.location.longitude : 0,
          },
          image: tripCity ? tripCity.image : "",
        };

        const schedule: { [date: string]: any[] } = {}; // object to be copied in the schedule field of the tripToAdd object

        createEmptyDatesInSchedule(data.dateRange[0], data.dateRange[1], schedule); // starting from startDate to endDate, create the dates in between in the schedule object

        fillSchedule(schedule, tripCity); // fill the schedule with the attractions to be visited

        tripToAdd.schedule = schedule;

        addTrip(tripToAdd)
          .then(() => {
            console.log("Trip created successfully");

            navigate("/trips/" + tripToAdd.id);

            messageApi.open({
              type: "success",
              content: "Trip created successfully!",
              duration: 3,
              style: {
                marginTop: "70px",
              },
            });
          })
          .catch((error) => {
            console.log(error);
            messageApi.open({
              type: "error",
              content: "Error while adding trip!",
              duration: 3,
              style: {
                marginTop: "70px",
              },
            });
          });
      })
      .catch((error) => {
        console.log(error);
        messageApi.open({
          type: "error",
          content: "Error while adding trip!",
          duration: 3,
          style: {
            marginTop: "20px",
          },
        });
      });
  };

  return (
    <>
      {contextHolder}
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index path="/" element={<MyTrips />} />
          <Route
            path="/newtrip"
            element={<NewTrip onSubmit={handleTripSubmission} />}
          />
          <Route path="/trips/:tripId" element={<TripOverview />} />
          <Route path="/*" element={<Error />} />
        </Route>
      </Routes>
    </>
  );
}

function PageLayout() {
  return (
    <Row className="w-100 m-0 p-0">
      <Outlet />
    </Row>
  );
}

function Error() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="Sorry, the page you are looking for does not exist."
      subTitle="Please, double check the address."
      extra={
        <Button ghost type="primary" onClick={() => navigate("/")}>
          Back Home
        </Button>
      }
    />
  );
}

export default App;
