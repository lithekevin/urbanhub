import { CollapseProps, Timeline, Collapse, Row, Col, Button, Space } from 'antd';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Container } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { Input } from 'antd';
import { getTripById } from "../firebase/daos/dao-trips";
import { useParams } from 'react-router-dom';
//import cities from "../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';


//TODO: RICORDARSI DI METTERE DUE MODALITA' UNA READONLY E UNA EDITABLE

function TripOverview() {

  const containerStyle = {
    width: '100%',
    height: '100%',
  };
  
  const center = {
    lat: -34.397,
    lng: 150.644,
  };
  
  const GoogleMapComponent: React.FC = () => {
    return (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
          <Marker position={center} />
        </GoogleMap>
    );
  };

  return (
    <>
      <h1 className="text-center">TRIP OVERVIEW</h1>
      <div style={{ minHeight: 'calc(100vh - 30px)', position: 'relative' }}>
        <Container className="d-flex align-items-stretch" style={{ height: '100%' }}>
          <div style={{ flex: '0 0 33.3%', height: '100%', width: '100%' }}>
            <Sidebar />
          </div>
          <div style={{ flex: '0 0 66.6%', height: '100%' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <GoogleMapComponent />
              </div>
            </Container>
          </div>
        </Container>
      </div>
      <footer style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center'}}>
        <Footer />
      </footer>
    </>
  );
};
  

function Sidebar() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<boolean>(false);
  const { tripId } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    // load trip details from firebase based on tripId
    async function loadTripDetails() {
      setLoading(true);
      try {
        if (tripId) {
          const tripData = await getTripById(tripId);
          if (tripData) {
            setTrip(tripData);
          } else {
            console.log(`Trip with ID ${tripId} not found.`);
          }
        }
      } catch (error) {
        console.error('Error loading trip details:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadTripDetails();
  }, [tripId]);

  const handleEditClick = (attraction: TripAttraction) => {
    console.log(`Button edit clicked for attraction: ${attraction.name}`);
  };

  const handleDeleteClick = (attraction: TripAttraction) => {
    console.log(`Button delete clicked for attraction: ${attraction.name}`);
  };

  const renderAttractionsForDay = (day: dayjs.Dayjs) => {
    let attractionsForDay: TripAttraction[] = [];
  
    // Find the closest matching key
    let closestKey: dayjs.Dayjs | null = null;
    let minDifference: number | null = null;
  
    trip?.schedule.forEach((attractions, key) => {
      const difference = Math.abs(day.diff(key, 'days'));
  
      if (minDifference === null || difference < minDifference) {
        minDifference = difference;
        closestKey = key;
      }
    });
  
    if (closestKey !== null) {
      attractionsForDay = trip?.schedule.get(closestKey) || [];
    }
  
    const timelineItems = attractionsForDay.map((attraction, index) => ({
      label: `${attraction.startDate.format("HH:mm")} - ${attraction.endDate.format("HH:mm")}`,
      children: (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ marginRight: '10px' }}>{attraction.name}</span>
        {editing && <button onClick={() => handleEditClick(attraction)}><EditOutlined /></button>}
        {editing && <button onClick={() => handleDeleteClick(attraction)}><DeleteOutlined /></button>}
        </div>
      ),
    }));
  
    return (
      <>
        <Timeline mode="left" items={timelineItems} />
      </>
    );
  };

  const dayLabels = Array.from(trip?.schedule.keys() || []).map((day) => day.format('DD/MM/YYYY'));

  const dailyActivities: CollapseProps['items'] = dayLabels.map((dayLabel, index) => ({
    key: `${index}`,
    label: dayLabel,
    children: <div>{renderAttractionsForDay(dayjs(dayLabel, 'DD/MM/YYYY'))}</div>,
  }));

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <p>Error loading trip details</p>}
      {!loading && !error && trip && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-left">
              <h3>{trip.city}</h3>
            </Container>
          </div>
          <div>
            <Collapse size="large" items={dailyActivities} defaultActiveKey={['0']} accordion={true} />
          </div>
        </>
      )}
    </>
  );
}


  function Footer() {
    const [scrollRatio, setScrollRatio] = useState(0);

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    const maxScroll = documentHeight - windowHeight;
    const currentScrollRatio = scrollTop / maxScroll;
    setScrollRatio(currentScrollRatio);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

    const { TextArea } = Input;

    const [message, setMessage] = useState('Is there anything I can do for you?');
    const [undoVisibility, setUndoVisibility] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const updateMessage = (msg: string) => {
      setMessage(msg);
    };

    const handleUndoClick = () => {
      setUndoVisibility(false);
      setMessage('Operation undone, is there anything else I can do for you?');
      setInputValue('');
    };

    const handleSendClick = () => {
      setUndoVisibility(true);
      updateMessage('Here is the proposed solution to your problem');
      setInputValue('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    };

    return (
      <div className="chatbot-style" style={{ transform: `translateY(calc(-${scrollRatio * 100}% - 10px))` }}>
      <Row justify="space-between">
        <Col xs={24} sm={24} md={11}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
            <img src={"/robotassistant.png"} alt="UrbanHub assistant" style={{ width: 'auto', height: '70px', marginRight: '10px' }} />
            <div style={{ flex: '1', position: 'relative', backgroundColor: '#fff', padding: '10px', borderRadius: '10px' }}>
              <div style={{ position: 'absolute', top: '50%', left: '-10px', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '10px solid #fff' }} />
              <p>{message}</p>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={24} md={11}>
          <Space.Compact style={{ width: '100%' }}>
          <TextArea placeholder="Ask something to UrbanHub..." value={inputValue} onChange={handleInputChange} autoSize={{ minRows: 1, maxRows: 3 }} />
            <Button type="primary" onClick={handleSendClick}>Send</Button>
            {undoVisibility && (<Button type="primary" onClick={handleUndoClick}>Undo</Button>)}
          </Space.Compact>
        </Col>
      </Row>
      </div>
  );
  };

export default TripOverview;