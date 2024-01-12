import { CollapseProps, Timeline, Collapse, Row, Col, Button, Space, Input, Modal, message, DatePicker, TimePicker, Form, Select, AutoComplete} from 'antd';
import { GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Container } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { getTripById, editAttraction, deleteAttraction, addAttractionToTrip } from "../firebase/daos/dao-trips";
import { useParams } from 'react-router-dom';
import cities from "../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import { EditTwoTone, DeleteTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import colors from "../style/colors";
import GoogleMapsComponent from "../components/GoogleMapsComponent";


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
  const [messageApi, contextHolder] = message.useMessage();
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const { tripId } = useParams();
  const [editing, setEditing] = useState<boolean>(true); 
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
  
  const [formAdding] = Form.useForm();
  const [formEditing] = Form.useForm();
  const [editingAttraction, setEditingAttraction] = useState<boolean>(false);
  

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
              travelMode: google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                setDirections(result);
                 // Extract distances between waypoints
                if (result?.routes && result?.routes.length > 0 && result?.routes[0].legs) {
                  const distances = result?.routes[0].legs.map(leg => leg?.distance?.text);
                  setAttractionDistances(distances);
                  console.log(distances);
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
  }, [dirty, activeKey]);

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
    formEditing.setFieldsValue({
      attraction: attraction.name,
      date: dayjs(attraction.startDate, 'DD/MM/YYYY'),
      startTime: dayjs(attraction.startDate, 'HH:mm'),
      endTime: dayjs(attraction.endDate, 'HH:mm')
    });
    setEditingAttraction(true);
    setIsFormVisible(true);
  };

  const openForm = () => {
    setEditingAttraction(false);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingAttraction(false);
    formAdding.resetFields();
    formEditing.resetFields();
  };

  const onFinish = (day: dayjs.Dayjs,values: any) => {
    const attraction = {
      id: values.attraction,
      startDate: values.startTime.format('HH:mm'),
      endDate: values.endTime.format('HH:mm'),
    };

    if(editingAttraction){
      if(tripId)
        editAttraction(tripId, day, values.date.format('DD/MM/YYYY'), attraction);
    }

    else{
      if(tripId)
        addAttractionToTrip(tripId, values.date.format('DD/MM/YYYY'), attraction);
    }

    setDirty(true);

    setEditingAttraction(false);
    setIsFormVisible(false);

  };

  const renderAttractionForm = (day: dayjs.Dayjs) => {
    const form = editingAttraction ? formEditing : formAdding;
    const formName = editingAttraction ? 'edit_attraction_form' : 'add_attraction_form';
  
    return (
      <>
        <Modal title={editingAttraction ? "Edit Attraction" : "Add Attraction"} open={isFormVisible} onCancel={closeForm} footer={null}>
          <Form form={form} name={formName} onFinish={(values) => onFinish(day, values)}>
            <Form.Item name="attraction" label="Attraction">
              <AutoComplete
                options={cities.find(city => city.name === trip?.city)?.attractions.map(attraction => ({ label: attraction.name, value: attraction.id}))}
                placeholder="Type an attraction"
                filterOption={(inputValue, option) =>
                  option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
              />
            </Form.Item>
            <Form.Item name="date" label="Date" initialValue={!editingAttraction ? day : undefined}>
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
        dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
        label: `${attraction.startDate.format("HH:mm")} - ${attraction.endDate.format("HH:mm")}`,
        children: (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto',  alignItems: 'left' }}>
            <span>{attraction.name}</span>
            {editing && (
              <Button style={{border: 'none', marginTop: '-5px'}} onClick={() => handleEditClick(attraction)}>
                <EditTwoTone/>
              </Button>
            )}
            {editing && (
              <Button style={{border: 'none', marginTop: '-5px'}} onClick={() => handleDeleteClick(attraction)}>
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
        color: 'gray',
        label: ``, 
        children: (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', marginBottom: '10px' }}>
          <span>{distance}</span>
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
        <Button type="primary" onClick={openForm}>
          Add Attraction
        </Button>
      </center>
      {renderAttractionForm(day)}
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
          <div style={{ flex: '0 0 33.3%', height: '100%', width: '100%' }}>
          <Sidebar
              loadingState={{ value: loading, setter: setLoading }}
              errorState={{ value: error, setter: setError }}
              tripState={{ value: trip, setter: setTrip }}
              activeKeyState={{value: activeKey, setter: setActiveKey}}
              dailyActivities={dailyActivities}
              activeAttractionDistances={attractionDistances}
            />
          </div>
          <div style={{ flex: '0 0 66.6%', height: '100%' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <GoogleMapsComponent 
                  activeKeyState={{value: activeKey, setter: setActiveKey}}
                  cityPositionState={{value: cityPosition, setter: setCityPosition}}
                  directionsState={{value: directions, setter: setDirections}}
                  defaultCenter={defaultCenter}
                />
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