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
    getAllTrips()
      .then((trips: Trip[]) => {
        const tripCity = cities.find((city) => city.name === data.destination);

        const nextID =
          trips.length > 0
            ? Math.max(...trips.map((trip) => parseInt(trip.id.slice(1)))) + 1
            : 1;

        const tripToAdd = {
          id: "T" + nextID.toString().padStart(3, "0"),
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

        const startDate = dayjs(tripToAdd.startDate, "DD/MM/YYYY");
        const endDate = dayjs(tripToAdd.endDate, "DD/MM/YYYY");
        const schedule: { [date: string]: any[] } = {};

        for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
          const date = d.format("DD/MM/YYYY");
          schedule[date] = [];
        }

        let attractions: Attraction[] = [];

        let currentExpenses = 0;

        while(currentExpenses < tripToAdd.budget) {
          const index = Math.floor(Math.random() * tripCity!.attractions.length);
          const attractionCost = tripCity!.attractions[index].perPersonCost * (tripToAdd.nAdults + tripToAdd.nKids);

          if (currentExpenses + attractionCost <= tripToAdd.budget) {
            currentExpenses += attractionCost;
            attractions.push(tripCity!.attractions[index]);
          }
        }

        for (const date in schedule) {
          const nAttractions = Math.floor(Math.random() * 4) + 3;
          let entireDuration = 0;

          for (let i = 0; i < nAttractions; i++) {
            if (attractions.length === 0) {
              while(currentExpenses < tripToAdd.budget) {
                const index = Math.floor(Math.random() * tripCity!.attractions.length);
                const attractionCost = tripCity!.attractions[index].perPersonCost * (tripToAdd.nAdults + tripToAdd.nKids);
      
                if (currentExpenses + attractionCost <= tripToAdd.budget) {
                  currentExpenses += attractionCost;
                  attractions.push(tripCity!.attractions[index]);
                }
              }
            }

            // if the schedule date is empty, add the first attraction in a random way starting from 8:00

            if (schedule[date].length === 0) {
              const index = Math.floor(Math.random() * attractions.length);
              const attractionID = attractions[index].id;

              let tripAttraction = {
                id: attractionID,
                startDate: "",
                endDate: "",
              };

              const startHour = 8;

              const startHourString = startHour.toString().padStart(2, "0");

              const endHour =
                startHour + Math.floor(attractions[index].estimatedTime / 60);

              const endHourString = endHour.toString().padStart(2, "0");

              tripAttraction.startDate = startHourString + ":00";
              tripAttraction.endDate = endHourString + ":00";

              schedule[date].push(tripAttraction);

              entireDuration += attractions[index].estimatedTime;

              attractions.splice(index, 1);
            } else {
              // if the schedule date is not empty, add the attraction picking from the attraction list the one whose latitude and longitude are the closest to the previous attraction trying to ignore the estimated time

              const previousAttraction =
                schedule[date][schedule[date].length - 1];

              const previousAttractionID = previousAttraction.id;

              const previousAttractionDuration = tripCity!.attractions.find(
                (attraction) => attraction.id === previousAttractionID
              )!.estimatedTime;

              const previousAttractionEndHour = parseInt(
                previousAttraction.endDate.split(":")[0]
              );

              const previousAttractionEndMinute = parseInt(
                previousAttraction.endDate.split(":")[1]
              );

              const previousAttractionEndHourMinutes =
                previousAttractionEndHour * 60 + previousAttractionEndMinute;

              const previousAttractionEndHourMinutesString =
                previousAttractionEndHourMinutes.toString().padStart(4, "0");

              const previousAttractionEndHourMinutesNumber = parseInt(
                previousAttractionEndHourMinutesString
              );

              let minDistance = 100000;

              let attractionIndex = 0;

              for (let i = 0; i < attractions.length; i++) {
                const attraction = attractions[i];

                const attractionLatitude = attraction.location.latitude;

                const attractionLongitude = attraction.location.longitude;

                const previousAttractionLatitude = tripCity!.attractions.find(
                  (attraction) => attraction.id === previousAttractionID
                )!.location.latitude;

                const previousAttractionLongitude = tripCity!.attractions.find(
                  (attraction) => attraction.id === previousAttractionID
                )!.location.longitude;

                const distance = Math.sqrt(
                  Math.pow(attractionLatitude - previousAttractionLatitude, 2) +
                    Math.pow(
                      attractionLongitude - previousAttractionLongitude,
                      2
                    )
                );

                if (distance < minDistance) {
                  minDistance = distance;
                  attractionIndex = i;
                }
              }

              const attractionID = attractions[attractionIndex].id;

              let tripAttraction = {
                id: attractionID,
                startDate: "",
                endDate: "",
              };

              const startHour = Math.floor(
                previousAttractionEndHourMinutesNumber / 60
              );

              const startHourString = startHour.toString().padStart(2, "0");

              const endHour =
                startHour +
                Math.floor(attractions[attractionIndex].estimatedTime / 60);

              const endHourString = endHour.toString().padStart(2, "0");

              tripAttraction.startDate = startHourString + ":00";

              tripAttraction.endDate = endHourString + ":00";

              schedule[date].push(tripAttraction);

              entireDuration += attractions[attractionIndex].estimatedTime;

              attractions.splice(attractionIndex, 1);
            }
          }
        }

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
