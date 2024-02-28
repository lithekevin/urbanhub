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
import { message } from "antd";
import {
  calculateNextTripID,
  createEmptyDatesInSchedule,
  fillSchedule,
} from "./utils/tripCreation";

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
        <div style={{paddingBottom: '50px'}}></div>
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
    children: number;
    budget: number;
    questions: string[];
    answers: string[];
  }) => {
    getAllTrips()
      .then((trips: Trip[]) => {
        const tripCity = cities.find((city) => city.name === data.destination); // city object of the city to be visited

        const nextTripID = calculateNextTripID(trips);

        let answers = new Array(9).fill(''); // array to be copied in the answers field of the tripToAdd object
        for (let i = 0; i < data.answers.length; i++) {
          if(data.answers[i]){
            answers[i] = data.answers[i];
          }
          else{
            answers[i] = '';
          }
        }

        const tripToAdd = {
          id: nextTripID,
          city: data.destination,
          startDate: data.dateRange[0],
          endDate: data.dateRange[1],
          nAdults: data.adults,
          nChildren: data.children,
          budget: data.budget,
          questions: data.questions,
          answers: answers,
          schedule: {},
          location: {
            latitude: tripCity ? tripCity.location.latitude : 0,
            longitude: tripCity ? tripCity.location.longitude : 0,
          },
          image: tripCity ? tripCity.image : "",
        };

        const schedule: { [date: string]: any[] } = {}; // object to be copied in the schedule field of the tripToAdd object

        createEmptyDatesInSchedule(
          data.dateRange[0],
          data.dateRange[1],
          schedule
        ); // starting from startDate to endDate, create the dates in between in the schedule object

        fillSchedule(schedule, tripCity, data.adults, data.children, data.budget); // fill the schedule with the attractions to be visited

        tripToAdd.schedule = schedule;

        addTrip(tripToAdd)
          .then(() => {
            console.log("Trip created successfully");
            navigate("/trips/" + tripToAdd.id,  { state: { mode: true }});
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
          <Route index path="/" element={<MyTrips messageApi={messageApi} contextHolder={contextHolder}/>} />
          <Route path="/newtrip"element={<NewTrip onSubmit={handleTripSubmission} />}/>
          <Route path="/trips/:tripId" element={<TripOverview messageApi={messageApi} contextHolder={contextHolder}/>} />
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
