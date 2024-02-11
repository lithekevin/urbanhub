import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Container } from "react-bootstrap";
import { FaChild, FaChildDress, FaPerson, FaPersonDress } from "react-icons/fa6";
import { TbCoinEuroFilled } from 'react-icons/tb';
import { Button, Divider, Flex, Form, Image, message, Popover, Spin, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined, SettingOutlined} from '@ant-design/icons';
import { getTripById } from "../firebase/daos/dao-trips";
import { Attraction } from '../models/attraction';
import { TripAttraction } from '../models/tripAttraction';
import { Trip } from "../models/trip";
import AttractionForm from '../components/TripOverview/AttractionForm';
import Chatbot from '../components/TripOverview/ChatbotComponent';
import EditTripSettings from '../components/TripOverview/EditTripSettings';
import GoogleMapsComponent from "../components/TripOverview/GoogleMapsComponent";
import Sidebar from '../components/TripOverview/Sidebar';
import cities from "../firebase/cities";
import colors from "../style/colors";
import axios from 'axios';
import dayjs from 'dayjs';

const { Paragraph, Title, Text } = Typography;

const defaultAttractionImageUrl = "https://images.unsplash.com/photo-1416397202228-6b2eb5b3bb26?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function TripOverview(props: any) {
  
  const defaultCenter = {
    lat: 48.7758, 
    lng: 9.1829
  };

  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [dirty, setDirty] = useState<boolean>(true);
  const [messageApi] = message.useMessage();
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const { tripId } = useParams();
  const [editing, setEdit] = useState<boolean>(location.state && location.state.mode === "edit"); 
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
  const [form1] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<TripAttraction | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs | null>(null); 
  const zoomLevel = selectedAttractionId !== null ? 15 : 12;
  const selAttraction : Attraction | null | undefined = selectedAttractionId !== null ? cities.find(city => city.name === trip?.city)?.attractions.find( attraction => attraction.id === selectedAttractionId) : null;
  const [selectedMarker, setSelectedMarker] = useState<Attraction | null>(null);

  //Used for undo button and message in chatbot 
  const [undoVisibility, setUndoVisibility] = useState(false);
  const [messageAI, setMessageAI] = useState('Is there anything I can do for you?');  
  const [totalCost, setTotalCost] = useState(0);
  const [validSelection, setValidSelection] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);


  //Chatbot - Footer interaction
  const [footerVisible, setFooterVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  //ActiveKey is update opening the current day for ingoing trips
  useEffect(() => {
    if(!editing){
      const currentDay = dayjs().startOf('day');
      var closestIndex = null;

      let index = -1;

      // Iterate through the schedule
      trip?.schedule.forEach((attractions, scheduledDay) => {
        index++;

        // Check if the current day matches any scheduled day
        if (dayjs(scheduledDay).startOf('day').isSame(currentDay)) {
          closestIndex = index;        
        }
      });

      if(closestIndex !== null){
        setActiveKey([closestIndex]);
      }else{
        setActiveKey([]);
      }
    }
  }, [trip]);

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
              if(index !== -1){
                if(tripData.answers.length>0)
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
  }, [dirty, tripId, trip?.location?.latitude, trip?.location?.longitude]);

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
          return null;
        }
        else if(index === (renderMarkerForDay(dayjs(dayLabels[parseInt(activeKey[0], 10)], 'DD/MM/YYYY')).length - 1)){
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
          return null;
        }
        else{
          //update middle elements
          waypt.push({
            location: { lat: attraction.location.latitude, lng: attraction.location.longitude },
            stopover: true,
          });
          return null;
        }
      });
    }
  }, [trip, activeKey]);

  const fetchImage = async (query: string) => {
    setImageLoading(true);
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: 1,
        },
        headers: {
          Authorization: `Client-ID 4rjvZvwzFuPY3uX3WAnf2Qb8eWkwvDys-sdsyvDdai0`,
        },
      });
  
      if (response.data.results.length > 0) {
        setImageLoading(false);
        return response.data.results[0].urls.regular;
      } else {
        setImageLoading(false);
        return null;
      }
    } catch (error) {
      console.error(error);
      setImageLoading(false);
      return null;
    }
  };
  
  useEffect(() => {
    if (selectedMarker) {
      fetchImage(selectedMarker.name).then(setImageUrl);
    }
  }, [selectedMarker]);

  // Update map bounds whenever markers change
  useEffect(() => {
    if (map) {
      const bounds = new window.google.maps.LatLngBounds();
      if(selectedAttractionId !== null && selAttraction){
        bounds.extend({lat: selAttraction.location.latitude, lng: selAttraction.location.longitude});
        bounds.extend({lat: selAttraction.location.latitude + 0.001, lng: selAttraction.location.longitude});
        bounds.extend({lat: selAttraction.location.latitude - 0.001, lng: selAttraction.location.longitude});
        bounds.extend({lat: selAttraction.location.latitude, lng: selAttraction.location.longitude + 0.001});
        bounds.extend({lat: selAttraction.location.latitude, lng: selAttraction.location.longitude - 0.001});
      }else{
        cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction, index: number) => {
          bounds.extend({lat: attraction.location.latitude, lng: attraction.location.longitude});
          return null;
        });
      }
      setMapBounds(bounds);
    }
  }, [selectedAttractionId, map, selAttraction, trip?.city]);

  // Fit map bounds when bounds change
  useEffect(() => {
    if (mapBounds && map) {
      map.fitBounds(mapBounds);
    }
  }, [mapBounds, map]);

  const dayLabels : Array<string> = Array.from(trip?.schedule.keys() || []).map((day) => day.format('DD/MM/YYYY'));
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

  const [isHovered, setIsHovered] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false); // State variable to control the visibility of the chatbot

  const handlePopoverVisibleChange = (visible: boolean) => {
    setShowChatbot(visible); // Set the visibility of the chatbot based on popover visibility

    // Prevent scrolling when the popover is open
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  const handleOpenModal = () => {
    form1.setFieldsValue({
      nAdults: trip?.nAdults,
      nKids: trip?.nKids,
      budget: trip?.budget,
      dateRange: [trip?.startDate, trip?.endDate],
    });
    setVisible(true);
  };
    
  return (
    <>
      {(loading || imageLoading) && (
        <Spin tip="Loading" size="large" fullscreen>
        <div> Loading </div>
        </Spin>
      )}
      <Flex justify='space-between' align='center' style={{ fontSize: '25px', position: 'relative', paddingLeft: '1%', paddingRight: '20%' }}>
        {/* Arrow on the left */}
        <ArrowLeftOutlined
          className="float-left"
          style={{ fontSize: "26px", marginLeft: "10px" }}
          onClick={() => navigate(-1)}
        />
        <span><FaPersonDress style={{ color: 'grey' }} size={30}/><FaPerson style={{ color: 'grey' }} size={30}/> <Text> Adults : {trip?.nAdults} </Text> </span>
        <span><FaChildDress style={{ color: 'grey' }} size={25}/><FaChild style={{ color: 'grey' }} size={25}/> <Text> Kids : {trip?.nKids} </Text> </span>
        <span>
          {(trip && totalCost > trip.budget) ? 
            <>
              <TbCoinEuroFilled style={{color: 'red'}}/>  
              <Tooltip title={<Paragraph style={{textAlign: 'center', color: 'white', margin: '0'}}>The initial budget you set has been exceeded by {totalCost - trip.budget} €</Paragraph>} placement='bottom'>
                <Text style={{color: 'red'}}> Total Cost : {totalCost}{" €"} </Text> 
              </Tooltip> 
            </> :
            <>
              <TbCoinEuroFilled style={{ color: 'grey'}}/>
              <Text> Total Cost : {totalCost}{" €"} </Text>
            </>
          }
        </span>
        {editing &&(
          <Button size="large" type="primary" className="button-new-trip" style={{ 
            backgroundColor: colors.whiteBackgroundColor, color: 'black', textAlign: "center", position: 'absolute', right: 30 }}
            onClick={() => handleOpenModal()}>
              <span>
                {<SettingOutlined />}
              </span> 
          </Button>
        )}
      </Flex>

      <Divider style={{ marginTop: '10px'}}/>
      
      <Title level={1} style={{ textAlign: 'center' }}>TRIP OVERVIEW</Title>

      <div className='main-div'>
        <Container className="d-flex align-items-stretch height-full" >
          <div className='sidebar-space'>
            <Sidebar
                activeKeyState={{value: activeKey, setter: setActiveKey}}
                attractionDistances={attractionDistances}
                dayLabels={dayLabels}
                editing={{value: editing, setter: setEdit}}
                errorState={{value: error, setter: setError}}
                form={form}
                loadingState={{value: loading, setter: setLoading}}
                messageApi={messageApi}
                setDirty={setDirty}
                setEditingAttraction={setEditingAttraction}
                setIsFormVisible={setIsFormVisible}
                setMessageAI={setMessageAI}
                setSelectedAttractionId={setSelectedAttractionId}
                setSelectedDay={setSelectedDay}
                setUndoVisibility={setUndoVisibility}
                travelModel={travelModel}
                trip={trip}
                tripId={tripId}
                tripState={{ value: trip, setter: setTrip }}     
            />
          </div>
          <div className='body-space'>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div className='map-space'>
                <GoogleMapsComponent 
                  activeKeyState={{value: activeKey, setter: setActiveKey}}
                  cityPositionState={{value: cityPosition, setter: setCityPosition}}
                  defaultCenter={defaultCenter}
                  directionsState={{value: directions, setter: setDirections}}
                  tripState={{ value: trip, setter: setTrip }}
                />
              </div>
            </Container>
          </div>
          <AttractionForm 
            cityPosition={cityPosition}
            defaultAttractionImageUrl={defaultAttractionImageUrl}
            editingAttraction={editingAttraction}
            form={form}
            imageUrl={imageUrl}
            isFormVisible={isFormVisible}
            trip={trip}
            selAttraction={selAttraction}
            selectedAttractionId={selectedAttractionId}
            selectedDay={selectedDay}
            selectedMarker={selectedMarker}
            setDirty={setDirty}
            setEditingAttraction={setEditingAttraction}
            setIsFormVisible={setIsFormVisible}
            setMap={setMap}
            setMessageAI={setMessageAI}
            setSelectedAttractionId={setSelectedAttractionId}
            setSelectedMarker={setSelectedMarker}
            setUndoVisibility={setUndoVisibility}
            setValidSelection={setValidSelection}
            tripId={tripId}
            validSelection={validSelection}
            zoomLevel={zoomLevel}
          />
          <EditTripSettings
            form1={form1}
            visible={visible}
            setVisible={setVisible}
            trip={trip}
            setDirty={setDirty}
          />
        </Container>
      </div>

      {editing && 
        <Popover
          content={
            <Chatbot
              tripState={{ value: trip, setter: setTrip }}
              dirtyState={{ value: dirty, setter: setDirty }}
              undoState={{ value: undoVisibility, setter: setUndoVisibility }}
              messageAIState={{ value: messageAI, setter: setMessageAI, color: 'black' }}
              tripId={tripId}
              messageApi={messageApi}
            />
          }
          trigger="click"
          open={showChatbot}
          onOpenChange={handlePopoverVisibleChange}
          placement='right'
          arrow={{ pointAtCenter: true }}
          overlayStyle={{ maxWidth: '90vw', width: '100%', marginLeft: '20px' }}
        >
          <Button
            style={{
              width: '55px',
              height: '55px',
              borderRadius: '50%',
              position: 'fixed',
              right: '20px', 
              marginLeft: '2%',
              bottom: `${footerVisible ? footerHeight + 20 : 20}px`,
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
              transform: `scale(${isHovered ? 1.1 : 1})`,
              transition: 'box-shadow transform 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Image
              src="https://imgur.com/ijeaJNU.png"
              alt="UrbanHub assistant"
              preview={false}
              height={'auto'}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </Button>
        </Popover>
      }
    </>
  );
};

export default TripOverview;