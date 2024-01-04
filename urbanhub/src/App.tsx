import { BrowserRouter, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { Row } from 'react-bootstrap';
import NavigationBar from './components/NavigationBar';
import MyTrips from './pages/MyTrips';
import NewTrip from './pages/NewTrip';
import TripOverview from './pages/TripOverview';
import FooterComponent from './components/FooterComponent';
import { LoadScript } from '@react-google-maps/api';
import { Trip } from './models/trip';
import { addTrip, getAllTrips } from './firebase/daos/dao-trips';
import cities from './firebase/cities';
import dayjs from 'dayjs';

function App() {
  return (
    <BrowserRouter>
      <div className='wrapper'>
        <NavigationBar/>
        <LoadScript googleMapsApiKey="AIzaSyDYwrQtanLbPehi6huH0sY0FMnvHo4Tg1w" language="en">
          <Main/>
        </LoadScript>
        <FooterComponent/>
      </div>
    </BrowserRouter>
  );
}

function Main() {

  const navigate = useNavigate();

  const handleTripSubmission = (data: {
    destination: string;
    dateRange: string[];
    adults: number;
    kids: number;
    budget: number;
    questions: string[];
    answers: string[];
  }) => {
    

    getAllTrips().then((trips: Trip[]) => {
      
      const tripCity = cities.find((city) => city.name === data.destination);

      const tripToAdd = {
        id: "T" + (trips.length + 1).toString().padStart(3, "0"),
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
          longitude: tripCity ? tripCity.location.longitude : 0
        },
        image: tripCity ? tripCity.image : ""
      };

      const startDate = dayjs(tripToAdd.startDate, "DD/MM/YYYY");
      const endDate = dayjs(tripToAdd.endDate, "DD/MM/YYYY");
      const schedule: { [date: string]: any[] } = {};



      for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
        const date = d.format("DD/MM/YYYY");
        schedule[date] = [];
      }

      for (const date in schedule) {
        const nAttractions = Math.floor(Math.random() * 4) + 3;
        let entireDuration = 0;
        let attractions = [...tripCity!.attractions]; 

        for (let i = 0; i < nAttractions; i++) {
          if (attractions.length === 0) {
            break; 
          }

          let index = Math.floor(Math.random() * attractions.length);

          if(entireDuration + attractions[index].estimatedTime < 480) {
            const attractionID = attractions[index].id;

            let tripAttraction = { "id": attractionID, "startDate": "", "endDate": "" };

            let startHour = 8;

            if (schedule[date].length > 0) {
              const previousAttraction = schedule[date][schedule[date].length - 1];
              const previousAttractionID = previousAttraction.id;
              const previousAttractionDuration = tripCity!.attractions.find((attraction) => attraction.id === previousAttractionID)!.estimatedTime;
              const previousAttractionEndHour = parseInt(previousAttraction.endDate.split(":")[0]);
              startHour = previousAttractionEndHour + Math.floor(previousAttractionDuration / 60);
            }

            const startHourString = startHour.toString().padStart(2, "0");

            const endHour = startHour + Math.floor(attractions[index].estimatedTime / 60);

            const endHourString = endHour.toString().padStart(2, "0");

            tripAttraction.startDate = startHourString + ":00";
            tripAttraction.endDate = endHourString + ":00";

            schedule[date].push(tripAttraction);      

            entireDuration += attractions[index].estimatedTime;

            attractions.splice(index, 1); 
          }
        }
      }

      tripToAdd.schedule = schedule;

      addTrip(tripToAdd).then(() => {
        console.log("Trip added successfully");

        navigate("/trips/" + tripToAdd.id);

      }).catch((error) => {
        console.log(error);
      });

    }).catch((error) => {
      console.log(error);
    });

  };

  return (
    <Routes>
      <Route path="/" element={<PageLayout/>}>
        <Route index path='/' element={<MyTrips/>}/>
        <Route path='/newtrip' element={<NewTrip onSubmit={handleTripSubmission}/>}/>
        <Route path='/trips/:tripId' element={<TripOverview/>}/>
      </Route>
    </Routes>
  );
}

function PageLayout() {
  return (
    <Row className='w-100 m-0 p-0'>
      <Outlet/>
    </Row>
  );
}

export default App;
