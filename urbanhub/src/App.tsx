import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import { Row } from 'react-bootstrap';
import Homepage from './pages/Homepage';
import { setDefaultTrips } from './firebase/daos/dao-trips';
import MyTrips from './pages/MyTrips';
import NewTrip from './pages/NewTrip';
import TripOverview from './pages/TripOverview';

setDefaultTrips();

function App() {
  return (
    <BrowserRouter>
      <Main/>
    </BrowserRouter>
  );
}

function Main() {
  return (
    <Routes>
      <Route path="/" element={<PageLayout/>}>
        <Route index path='/' element={<Homepage/>}/>
        <Route path='/mytrips' element={<MyTrips/>}/>
        <Route path='/newtrip' element={<NewTrip/>}/>
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
