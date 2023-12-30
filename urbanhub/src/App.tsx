import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import { Row } from 'react-bootstrap';
import NavigationBar from './components/NavigationBar';
import { setDefaultTrips } from './firebase/daos/dao-trips';
import MyTrips from './pages/MyTrips';
import NewTrip from './pages/NewTrip';
import TripOverview from './pages/TripOverview';
import FooterComponent from './components/FooterComponent';
import { LoadScript } from '@react-google-maps/api';

setDefaultTrips();

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

  const handleTripSubmission = (data: {
    destination: string;
    dateRange: [string, string];
    adults: number;
    kids: number;
    budget: number;
    questions: string[];
    answers: string[];
  }) => {
    // Handle the submission logic here
    console.log(data);
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
