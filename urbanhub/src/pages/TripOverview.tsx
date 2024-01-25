import { CollapseProps, Timeline, Collapse, Button, Modal, message, DatePicker, TimePicker, Form, AutoComplete, Card, Space, Divider, Tag, Tooltip} from 'antd';
import { Col, Container, Row } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { getTripById, editAttraction, deleteAttraction, addAttractionToTrip } from "../firebase/daos/dao-trips";
import { useParams } from 'react-router-dom';
import cities from "../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import { EditTwoTone, DeleteTwoTone, EuroCircleOutlined,CloseSquareFilled   } from '@ant-design/icons';
import colors from "../style/colors";
import GoogleMapsComponent from "../components/TripOverview/GoogleMapsComponent";
import Chatbot from '../components/TripOverview/ChatbotComponent';
import { TbCar, TbCoinEuro, TbMoodKid, TbUser, TbWalk,  } from "react-icons/tb";
import moment from 'moment';


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
  const [travelModel, setTravelModel] = useState('WALKING');
  
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
  const [totalCost, setTotalCost] = useState(0);
  const [validSelection, setValidSelection] = useState(false);


  //Chatbot - Footer interaction
  const [footerVisible, setFooterVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  // Add an effect to detect when the footer becomes visible
  useEffect(() => {
    // Function to calculate the visible height of the footer
    const getVisibleFooterHeight = () => {
      const footer = document.querySelector('.footer-style');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        if (footerRect.top >= 0 && footerRect.bottom <= window.innerHeight) {
          return footerRect.height;
        } else {
          return window.innerHeight - footerRect.top; // Footer is partially visible
        }
      }
      return 0; // Footer not found
    };
  
    // Update the state when the footer visibility changes
    const handleScroll = () => {
      const footer = document.querySelector('.footer-style');
      if (footer) {
        const footerBounds = footer.getBoundingClientRect();
        // Check if any part of the footer is visible in the viewport
        const isVisible = footerBounds.top < window.innerHeight && footerBounds.bottom >= 0;
        if (isVisible) {
          const footerHeight = getVisibleFooterHeight();
          setFooterHeight(footerHeight);
          setFooterVisible(true);
        }else{
          setFooterVisible(false);
        }
      }
    };
  
    // Listen for scroll events to detect footer visibility changes
    window.addEventListener('scroll', handleScroll);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);  

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

              const index = tripData.questions.findIndex(question => question.includes("transportation"));
              if(index != -1){
                tripData.answers[index].includes("car") || tripData.answers[index].includes("driv") || tripData.answers[index].includes("public") ? setTravelModel("DRIVING") : setTravelModel("WALKING");
              }

            }
            let sum = 0;
            tripData.schedule.forEach((dayAttractions) => {
            dayAttractions.forEach((attraction) => {
              sum += attraction.perPersonCost;
              });
            });
            setTotalCost(sum * (tripData.nAdults + tripData.nKids));
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
              travelMode: travelModel === "WALKING" ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,         
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
        <Modal title={editingAttraction ? "Edit Attraction" : "Add Attraction"} open={isFormVisible} onCancel={closeForm} footer={null} centered>
          <Form form={form} name={"formName"} onFinish={(values) => onFinish(values)}>
          <Form.Item name="attraction" label="Attraction" style={{paddingTop: '10px'}} rules={[{ required: true, message: 'Please input the attraction!' }]}>
            <AutoComplete
              options={cities.find(city => city.name === trip?.city)?.attractions.map(attraction => ({ value: attraction.name}))}
              placeholder="Type an attraction"
              style={{width: '100%'}}
              allowClear={{ clearIcon: <CloseSquareFilled /> }}
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              onSelect={(value) => {
                const selectedAttraction = cities.find(city => city.name === trip?.city)?.attractions.find(attraction => attraction.name === value);
                if(selectedAttraction) {
                  setSelectedAttractionId(selectedAttraction.id);
                  setValidSelection(true);
                }
              }}
              onBlur={() => {
                if (!validSelection) {
                  form.setFieldsValue({ attraction: '' });
                }
                setValidSelection(false);
              }}
              
            />
          </Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Please choose the date!' }]}>
              <DatePicker format="DD/MM/YYYY" disabledDate={(current) => current && current < moment().startOf('day')} style={{width: '100%'}}/>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Form.Item label = "Start Time " name="startTime" style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginRight: '16px' }} rules={[{ required: true, message: 'Please choose the start time!' }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
              <Form.Item label= "End Time " name="endTime" style={{ display: 'inline-block', width: 'calc(50% - 8px)' }} rules={[{ required: true, message: 'Please choose the end time!' }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
            </Form.Item>
            <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={closeForm} style={{ marginRight: '10px' }}>
                  Cancel
                </Button>
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
          label: `${attraction.startDate.format("HH:mm")} - ${attraction.endDate.format("HH:mm")}`,
          children: (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gridTemplateRows: 'auto auto', alignItems: 'start', width: '100%' }}>
              <span style={{ gridColumn: '1', gridRow: '1', paddingBottom: '5px'}}>{attraction.name}</span>
              <Tag icon={<EuroCircleOutlined />}color="green" style={{ gridColumn: '1', gridRow: '2', display: 'inline-block', maxWidth: '55px' }}> {attraction.perPersonCost ? attraction.perPersonCost * (trip!.nAdults + trip!.nKids) : "free"}</Tag>
              {editing && (
                <Button style={{border: 'none', marginTop: '-8px', gridColumn: '2', gridRow: '1 / span 2'}} onClick={() => handleEditClick(attraction)}>
                  <EditTwoTone/>
                </Button>
              )}
              {editing && (
                <Button style={{border: 'none', marginTop: '-8px', gridColumn: '3', gridRow: '1 / span 2'}} onClick={() => handleDeleteClick(attraction)}>
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

        let distanceInMeter = 0;

        if(distance){
          if(distance.includes("km")){
            distanceInMeter = parseFloat(distance.split(" ")[0]) * 1000;
          }
          else{
            distanceInMeter = parseFloat(distance.split(" ")[0]);
          }
        }

        

        items.push({
          color: 'trasparent',
          children: (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px' }}>{travelModel === "DRIVING" ? <TbCar className='fs-5 me-2' /> : (distanceInMeter > 2000 ? <TbCar className='fs-5 me-2'/> : <TbWalk className='fs-5 me-2' /> )}{distance}</span>
            </div>
          ),
        });
      }
      

      return items;
    });

    return (
      <>
        <div style={{  }}>
          <Timeline mode="left" items={timelineItems}  />
        </div>
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
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: '10px', width: '40%', margin: '0 auto' }}>
        <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}><TbUser style={{ marginRight: '5px' }} /> Adults : {trip?.nAdults}</span>
        <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}><TbMoodKid style={{ marginRight: '5px' }} /> Kids : {trip?.nKids}</span>
        <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center', color: (trip && totalCost > trip.budget) ? 'red' : 'inherit' }}>
          <TbCoinEuro style={{ marginRight: '5px' }} />  
          Total Cost : {(trip && totalCost > trip.budget) ? <Tooltip title="You have surpassed your budget">{totalCost}</Tooltip> : totalCost}
        </span>
      </div>
      <div>
        <Divider/>
      </div>
      <h1 className="text-center">Trip Overview</h1>
      <div style={{ minHeight: 'calc(100vh - 30px)', position: 'relative', marginTop: '20px' }}>
        <Container className="d-flex align-items-stretch" style={{ height: '100%' }}>
          <div style={{ flex: '0 0 50%', height: '100%', width: '100%'}}>
          <Sidebar
              loadingState={{ value: loading, setter: setLoading }}
              errorState={{ value: error, setter: setError }}
              tripState={{ value: trip, setter: setTrip }}
              activeKeyState={{value: activeKey, setter: setActiveKey}}
              dailyActivities={dailyActivities}
              activeAttractionDistances={attractionDistances}
            />
          </div>
          <div style={{ flex: '0 0 50%', height: '100%', paddingTop: '70px' }}>
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
          {renderAttractionForm()}
        </Container>
      </div>
      <div style={{ width: '100%', textAlign: 'center', position: 'fixed', bottom: footerVisible ? footerHeight + 'px' : 0 }}>
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
  const { loadingState, errorState, tripState, activeKeyState, dailyActivities} = props; 

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
                
              </Row>
            </Container>
          </div>
          <div style={{ overflow: 'auto', maxHeight: '50vh' }}>
            <Collapse size="large" items={dailyActivities}  accordion={true} activeKey={activeKeyState.value} onChange={(keys) => activeKeyState.setter(keys)}/>
          </div>
        </>
      )}
    </>
  );
}

export default TripOverview;