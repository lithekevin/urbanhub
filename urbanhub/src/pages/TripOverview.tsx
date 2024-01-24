import { CollapseProps, Timeline, Collapse, Button, Modal, message, DatePicker, TimePicker, Form, AutoComplete} from 'antd';
import { Col, Container, Row } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { getTripById, editAttraction, deleteAttraction, addAttractionToTrip } from "../firebase/daos/dao-trips";
import { useParams } from 'react-router-dom';
import cities from "../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import { EditTwoTone, DeleteTwoTone, UserOutlined } from '@ant-design/icons';
import colors from "../style/colors";
import GoogleMapsComponent from "../components/TripOverview/GoogleMapsComponent";
import Chatbot from '../components/TripOverview/ChatbotComponent';


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
  const [messageApi] = message.useMessage();
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const { tripId } = useParams();
  const [editing] = useState<boolean>(true); 
  const [cityPosition, setCityPosition] = useState({
    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  //used for path between attractions
  var origin : any = null;
  var destination : any = null;
  var waypt : any[] = [];
  const [directions, setDirections] = useState<any>({
    geocoded_waypoints: [],
    routes: [],
    status: "ZERO_RESULTS",
  });  
  const [attractionDistances, setAttractionDistances] = useState<any>([]);
  
  const [form] = Form.useForm();
  const [editingAttraction, setEditingAttraction] = useState<TripAttraction | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs | null>(null); 

  //Used for undo button and message in chatbot 
  const [undoVisibility, setUndoVisibility] = useState(false);
  const [messageAI, setMessageAI] = useState('Is there anything I can do for you?');  

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
  }, [dirty]);

  useEffect(() => {
    const directionsService = new google.maps.DirectionsService();

    if(activeKey.length === 0){
      setDirections({
        geocoded_waypoints: [],
        routes: [],
        status: "ZERO_RESULTS",
      });
      setAttractionDistances([]);
      }
      else{
      //iterate throught all attractions of a day
      renderMarkerForDay(dayjs(dayLabels[parseInt(activeKey[0], 10)], 'DD/MM/YYYY')).map((attraction, index) => {
        if(index === 0){
          //update first element
          origin = { lat: attraction.location.latitude, lng: attraction.location.longitude };
          destination = null;
          waypt = [];
        }else if(index === (renderMarkerForDay(dayjs(dayLabels[parseInt(activeKey[0], 10)], 'DD/MM/YYYY')).length - 1)){
          //update last element and caluclate route for the day
          destination = { lat: attraction.location.latitude, lng: attraction.location.longitude };

          directionsService.route(
            {
              origin: origin,
              destination: destination,
              waypoints: waypt,
              travelMode: google.maps.TravelMode.DRIVING,         //volendo possiamo cercare di capire dalle risposte se l'utente vuole andare a piedi o in macchina, analizzando la risposta alla domanda dei trasporti nelle preferences
              unitSystem: google.maps.UnitSystem.METRIC,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                setDirections(result);
                 // Extract distances between waypoints
                if (result?.routes && result?.routes.length > 0 && result?.routes[0].legs) {
                  const distances = result?.routes[0].legs.map(leg => leg?.distance?.text);
                  setAttractionDistances(distances);
                }
              } else {
                console.error(`error fetching directions ${result}`);
                setAttractionDistances([]);
              }
            }
          );
        }else{
          //update middle elements
          waypt.push({
            location: { lat: attraction.location.latitude, lng: attraction.location.longitude },
            stopover: true,
          });
        }
      });
    }
  }, [trip, activeKey]);

  const handleDeleteClick = async (attraction: TripAttraction) => {
    // Display a custom confirmation dialog
    Modal.confirm({
      title: 'Delete Attraction',
      content: (
        <div>
          <p>Are you sure you want to delete this attraction?</p>
          <p>
            <strong>Name:</strong> {attraction.name}<br />
            <strong>Date:</strong> {attraction.startDate.format('DD/MM/YYYY')}<br />
          </p>
        </div>
      ),
      centered: true,
      onOk: async () => {
        try {
          if (tripId) {
            await deleteAttraction(tripId, attraction.startDate, attraction.id);
            setDirty(true);
            setMessageAI("Attraction deleted succesully! Is there anything else I can do for you?");
            setUndoVisibility(false);

            // Show success message
            messageApi.open({
              type: 'success',
              content: 'Attraction deleted successfully!',
              duration: 3,
              style: {
                marginTop: '70px',
              },
            });
          }
        } catch (error) {
          console.error('Error deleting attraction:', error);

          // Show error message
          messageApi.open({
            type: 'error',
            content: 'Error while deleting attraction!',
            duration: 3,
            style: {
              marginTop: '70px',
            },
          });
        }
      },

    });
  };

  const handleEditClick = (attraction : TripAttraction) => {
    form.setFieldsValue({
      attraction: attraction.name,
      date: dayjs(attraction.startDate, 'DD/MM/YYYY'),
      startTime: dayjs(attraction.startDate, 'HH:mm'),
      endTime: dayjs(attraction.endDate, 'HH:mm')
    });
    setSelectedAttractionId(attraction.id);
    setSelectedDay(dayjs(attraction.startDate, 'DD/MM/YYYY'))
    setEditingAttraction(attraction);
    setIsFormVisible(true);
  };

  const openForm = (selectedDay: dayjs.Dayjs) => {
    form.resetFields();
    form.setFieldsValue({ date: selectedDay });
    setEditingAttraction(null);
    setIsFormVisible(true);

  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingAttraction(null);
  };

  const onFinish = (values: any) => {
    const attraction = {
      id: selectedAttractionId,
      startDate: values.startTime.format('HH:mm'),
      endDate: values.endTime.format('HH:mm'),
    };

    if(editingAttraction){

      if(tripId&&selectedDay){
        editAttraction(tripId, editingAttraction.id ,selectedDay, values.date.format('DD/MM/YYYY'), attraction);
        setMessageAI("Attraction edited succesully! Is there anything else I can do for you?");
        setUndoVisibility(false);
      }
      else{
        console.log("error");
      }
    }

    else{
      if(tripId){
        addAttractionToTrip(tripId, values.date.format('DD/MM/YYYY'), attraction);
        setMessageAI("Attraction deleted succesully! Is there anything else I can do for you?");
        setUndoVisibility(false);
      }
    }

    setDirty(true);
    setEditingAttraction(null);
    setIsFormVisible(false);

  };

  const renderAttractionForm = () => {
  
    return (
      <>
        <Modal title={editingAttraction ? "Edit Attraction" : "Add Attraction"} open={isFormVisible} onCancel={closeForm} footer={null}>
          <Form form={form} name={"formName"} onFinish={(values) => onFinish(values)}>
          <Form.Item name="attraction" label="Attraction">
            <AutoComplete
              options={cities.find(city => city.name === trip?.city)?.attractions.map(attraction => ({ value: attraction.name}))}
              placeholder="Type an attraction"
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              onSelect={(value) => {
                const selectedAttraction = cities.find(city => city.name === trip?.city)?.attractions.find(attraction => attraction.name === value);
                if(selectedAttraction)
                  setSelectedAttractionId(selectedAttraction.id);
              }}
            />
          </Form.Item>
            <Form.Item name="date" label="Date">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="startTime" label="Start Time">
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="endTime" label="End Time">
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  const renderMarkerForDay = (day: dayjs.Dayjs) => {
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
    return attractionsForDay;
  }
  
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

  const timelineItems = attractionsForDay.flatMap((attraction, index) => {
    const items: any[] = [
      {
        label: `${attraction.startDate.format("HH:mm")} - ${attraction.endDate.format("HH:mm")} | ${attraction.perPersonCost}€`,
        children: (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto',  alignItems: 'baseline' }}>
            <span>{attraction.name}</span>
            {editing && (
              <Button style={{border: 'none', marginTop: '-8px'}} onClick={() => handleEditClick(attraction)}>
                <EditTwoTone/>
              </Button>
            )}
            {editing && (
              <Button style={{border: 'none', marginTop: '-8px'}} onClick={() => handleDeleteClick(attraction)}>
                <DeleteTwoTone twoToneColor={colors.deleteButtonColor} />
              </Button>
            )}
          </div>
        ),
      },
    ];

    // Add distance text between attractions
    if (index < attractionsForDay.length - 1) {
      const distance = attractionDistances[index];
      items.push({
        color: 'white',
        children: (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px' }}>{distance}</span>
          </div>
        ),
      });
    }
    

    return items;
  });

  return (
    <>
      <Timeline mode="left" items={timelineItems} style={{ marginLeft: '-150px' }} />
      <center>
        <Button type="primary" onClick={() => openForm(day)}>
          Add Attraction
        </Button>
      </center>
    </>
  );
};

  const dayLabels = Array.from(trip?.schedule.keys() || []).map((day) => day.format('DD/MM/YYYY'));


  const dailyActivities: CollapseProps['items'] = dayLabels.map((dayLabel, index) => ({
    key: `${index}`,
    label: dayLabel,
    children: 
      <div>
        {renderAttractionsForDay(dayjs(dayLabel, 'DD/MM/YYYY'))}
      </div>,
  }));

  return (
    <>
      <h1 className="text-center">TRIP OVERVIEW</h1>
      <div style={{ minHeight: 'calc(100vh - 30px)', position: 'relative' }}>
        <Container className="d-flex align-items-stretch" style={{ height: '100%' }}>
          <div style={{ flex: '0 0 40%', height: '100%', width: '100%' }}>
          <Sidebar
              loadingState={{ value: loading, setter: setLoading }}
              errorState={{ value: error, setter: setError }}
              tripState={{ value: trip, setter: setTrip }}
              activeKeyState={{value: activeKey, setter: setActiveKey}}
              dailyActivities={dailyActivities}
              activeAttractionDistances={attractionDistances}
            />
          </div>
          <div style={{ flex: '0 0 60%', height: '100%' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <GoogleMapsComponent 
                  activeKeyState={{value: activeKey, setter: setActiveKey}}
                  cityPositionState={{value: cityPosition, setter: setCityPosition}}
                  directionsState={{value: directions, setter: setDirections}}
                  defaultCenter={defaultCenter}
                />
              </div>
            {renderAttractionForm()}
            </Container>
          </div>
        </Container>
      </div>
      <div style={{ position: 'fixed', bottom: 0, width: '100%', background: 'lightblue', padding: '10px', textAlign: 'center' }}>
        <Chatbot tripState={{ value: trip, setter: setTrip }} dirtyState={{ value: dirty, setter: setDirty }} undoState={{ value: undoVisibility, setter: setUndoVisibility }} messageAIState={{ value: messageAI, setter: setMessageAI }} tripId={tripId} messageApi={messageApi}/>
      </div>
    </>
  );
};
  
interface SidebarProps {

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
  activeAttractionDistances: any[];
}

function Sidebar(props: SidebarProps) {
  const { loadingState, errorState, tripState, activeKeyState, dailyActivities, activeAttractionDistances } = props; 

  return (
    <>
      {loadingState.value && <p>Loading...</p>}
      {errorState.value && <p>Error loading trip details</p>}
      {!loadingState.value && !errorState.value && tripState.value && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <Container fluid className="position-relative">
              <Row className="align-items-center">
                <Col>
                  <h3 className="text-left">{tripState.value.city}</h3>
                </Col>
                <Col className="text-right">
                  <div className="d-flex align-items-center justify-content-end">
                    <UserOutlined style={{ fontSize: '24px', marginRight: '5px' }} />
                    <p className="mb-0" style={{ fontSize: '24px' }}>{tripState.value.nAdults + tripState.value.nKids}</p>
                  </div>
                </Col>
              </Row>
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

export default TripOverview;