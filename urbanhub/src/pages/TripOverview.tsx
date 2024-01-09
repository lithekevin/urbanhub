import { CollapseProps, Timeline, Collapse, Row, Col, Button, Space, Input} from 'antd';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Container } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { getTripById, editAttraction, deleteAttraction } from "../firebase/daos/dao-trips";
import { useParams } from 'react-router-dom';
//import cities from "../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import { EditTwoTone, DeleteTwoTone } from '@ant-design/icons';
import colors from "../style/colors";
import { Console } from 'console';


//TODO: RICORDARSI DI METTERE DUE MODALITA' UNA READONLY E UNA EDITABLE

function TripOverview() {
  const defaultCenter = {
    lat: 48.7758, 
    lng: 9.1829
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [dirty, setDirty] = useState<boolean>(true);
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const { tripId } = useParams();
  const [editing, setEditing] = useState<boolean>(true); 
  const [cityPosition, setCityPosition] = useState({
    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
  });

  useEffect(() => {
    // load trip details from firebase based on tripId
    async function loadTripDetails() {
      setLoading(true);
      try {
        if (tripId) {
          const tripData = await getTripById(tripId);
          if (tripData) {
            setDirty(false);
            setTrip(tripData);
            console.log(trip?.schedule);
            if (trip?.location?.latitude && trip?.location?.longitude) {
              setCityPosition({
                lat: trip.location.latitude,
                lng: trip.location.longitude,
              });
            }
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
  }, [trip?.location.latitude, trip?.location.longitude, tripId, dirty]);

  const handleEditClick = (attraction: TripAttraction) => {
    console.log(`Button edit clicked for attraction: ${attraction.name}`);
  };

  const handleDeleteClick = async (attraction: TripAttraction) => {
    try {

      if(tripId){
        await deleteAttraction(tripId, attraction.startDate, attraction.id);
        setDirty(true);
      }

    } catch (error) {
      console.error('Error deleting attraction:', error);
    }
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
          {editing && (
            <button style={{background: 'none', border: 'none'}} onClick={() => handleEditClick(attraction)}>
              <EditTwoTone/>
            </button>
          )}
          {editing && (
            <button style={{background: 'none', border: 'none'}} onClick={() => handleDeleteClick(attraction)}>
              <DeleteTwoTone twoToneColor={colors.deleteButtonColor} />
            </button>
          )}
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
      <h1 className="text-center">TRIP OVERVIEW</h1>
      <div style={{ minHeight: 'calc(100vh - 30px)', position: 'relative' }}>
        <Container className="d-flex align-items-stretch" style={{ height: '100%' }}>
          <div style={{ flex: '0 0 33.3%', height: '100%', width: '100%' }}>
          <Sidebar
              tripId={tripId}
              dirtyState={{ value: dirty, setter: setDirty }}
              loadingState={{ value: loading, setter: setLoading }}
              errorState={{ value: error, setter: setError }}
              tripState={{ value: trip, setter: setTrip }}
              activeKeyState={{value: activeKey, setter: setActiveKey}}
              dailyActivities={dailyActivities}
            />
          </div>
          <div style={{ flex: '0 0 66.6%', height: '100%' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <GoogleMap mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={cityPosition} zoom={10} onLoad={(map) => {}}>
                  {(cityPosition.lat !== defaultCenter.lat && cityPosition.lng !== defaultCenter.lng && activeKey.length === 0 && <Marker position={cityPosition} />)}
                  {cityPosition.lat !== defaultCenter.lat && cityPosition.lng !== defaultCenter.lng && activeKey.length > 0 && (
                    <>
                    {trip?.schedule.get(dayjs(String(dailyActivities[parseInt(activeKey[0], 10)]), 'DD/MM/YYYY'))?.forEach((attraction) => {
                      return (
                        <Marker key={attraction.id} position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} />
                      );
                    })}
                  </>
                  )}
                </GoogleMap>
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
  
interface SidebarProps {
  tripId: string | undefined;
  dirtyState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  loadingState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  errorState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  tripState: {
    value: Trip | null;
    setter: React.Dispatch<React.SetStateAction<Trip | null>>;
  };
  activeKeyState: {
    value: string | string[];
    setter: React.Dispatch<React.SetStateAction<string | string[]>>;
  };
  dailyActivities: CollapseProps['items'];
}

function Sidebar(props: SidebarProps) {
  const { tripId, dirtyState, loadingState, errorState, tripState, activeKeyState, dailyActivities } = props; 

  return (
    <>
      {loadingState.value && <p>Loading...</p>}
      {errorState.value && <p>Error loading trip details</p>}
      {!loadingState.value && !errorState.value && tripState.value && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-left">
              <h3>{tripState.value.city}</h3>
            </Container>
          </div>
          <div>
            <Collapse size="large" items={dailyActivities}  accordion={true} activeKey={activeKeyState.value} onChange={(keys) => activeKeyState.setter(keys)}/>
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