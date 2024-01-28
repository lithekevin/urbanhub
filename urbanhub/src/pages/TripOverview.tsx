import { CollapseProps, Timeline, Collapse, Button, Modal, message, DatePicker, TimePicker, Form, 
         AutoComplete, Divider, Tag, Tooltip, Flex, Image, Popover , Typography} from 'antd';
import { Col, Container, Row } from "react-bootstrap";
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import moment from 'moment';
import { EditTwoTone, DeleteTwoTone, EuroCircleOutlined,CloseSquareFilled, EditOutlined   } from '@ant-design/icons';
import { getTripById, editAttraction, deleteAttraction, addAttractionToTrip } from "../firebase/daos/dao-trips";
import cities from "../firebase/cities";
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import colors from "../style/colors";
import GoogleMapsComponent from "../components/TripOverview/GoogleMapsComponent";
import Chatbot from '../components/TripOverview/ChatbotComponent';
import { TbCar, TbCoinEuro, TbMoodKid, TbUser, TbWalk,  } from "react-icons/tb";
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Attraction } from '../models/attraction';
import axios from 'axios';
import { useLocation, useParams } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const defaultAttractionImageUrl = "https://images.unsplash.com/photo-1416397202228-6b2eb5b3bb26?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function TripOverview(props: any) {
  const defaultCenter = {
    lat: 48.7758, 
    lng: 9.1829
  };

  const location = useLocation();

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
        });
      }
      setMapBounds(bounds);
    }
  }, [selectedAttractionId, map]);

  // Fit map bounds when bounds change
  useEffect(() => {
    if (mapBounds && map) {
      map.fitBounds(mapBounds);
    }
  }, [mapBounds, map]);

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
    setSelectedAttractionId(null);
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
        setMessageAI("Attraction edited successfully! Is there anything else I can do for you?");
        setUndoVisibility(false);
      }
      else{
        console.log("error");
      }
    }

    else{
      if(tripId){
        addAttractionToTrip(tripId, values.date.format('DD/MM/YYYY'), attraction);
        setMessageAI("Attraction added successfully! Is there anything else I can do for you?");
        setUndoVisibility(false);
      }
    }

    setDirty(true);
    setEditingAttraction(null);
    setIsFormVisible(false);
    setSelectedAttractionId(null);
  };

  const renderAttractionForm = () => {
  
    return (
      <>
        <Modal open={isFormVisible} onCancel={closeForm} footer={null} centered>
          <Form form={form} name={"formName"} onFinish={(values) => onFinish(values)}>
          <Title level={2} className='step-title'> {editingAttraction ? "Edit Attraction" : "Add Attraction"} </Title>
          <Paragraph className='label'> Attraction: </Paragraph>
          <Form.Item name="attraction" style={{paddingTop: '10px'}} rules={[{ required: true, message: 'Please select one of the attractions in the map, or type the name!' }]}>
            <AutoComplete
              options={cities.find(city => city.name === trip?.city)?.attractions.map(attraction => ({ value: attraction.name}))}
              placeholder="Type an attraction"
              style={{width: '100%'}}
              allowClear={{ clearIcon: <CloseSquareFilled /> }}
              onClear={() => {
                form.setFieldsValue({ attraction: '' });
                setValidSelection(false);
                setSelectedAttractionId(null);
              }}
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
                if (form.getFieldValue('attraction') !== selAttraction?.name) {
                  form.setFieldsValue({ attraction: '' });
                  setValidSelection(false);
                  setSelectedAttractionId(null);
                  form.validateFields(['attraction']);
                }                
              }}
              
            />
          </Form.Item>
          {selectedAttractionId && validSelection && cities.find(city => city.name === trip?.city)!.attractions.find(attraction => attraction.id === selectedAttractionId) && 
          
            <p style={{color: "var(--hard-background-color)"}}>This attraction will add a cost of {cities.find(city => city.name === trip?.city)!.attractions.find(attraction => attraction.id === selectedAttractionId)!.perPersonCost * (trip!.nAdults + trip!.nKids)}{" € to your trip."}</p>

          }
          <Paragraph className='label'> Date: </Paragraph>
            <Form.Item name="date" rules={[{ required: true, message: 'Please choose the date!' }]}>
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
            <Form.Item>
              <Row>
                <Col>
                <GoogleMap clickableIcons={false} mapContainerStyle={{ width: '100%', height: '40vh', margin: 'auto', display: 'block', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={selectedAttractionId === null ? cityPosition : cityPosition } zoom={zoomLevel} onLoad={(map) => {setMap(map)}}>             
                  { !selectedAttractionId && (
                    <>
                    {cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction, index: number) => {
                      return (
                        <Marker key={attraction.id} position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} onMouseOver={() => setSelectedMarker(attraction)} onMouseOut={() => setSelectedMarker(null)}  onClick={() => {
                          setSelectedAttractionId(attraction.id);
                          form.setFieldsValue({ attraction: attraction.name }); // Update the AutoComplete value
                        }}/>
                      );
                    })}
                  </>
                  )}
                  { selectedAttractionId && (<>
                    {cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction) => {
                      if (attraction.id === selectedAttractionId) {
                        return (
                          <Marker key={attraction.id} position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} onMouseOver={() => setSelectedMarker(attraction)} onMouseOut={() => setSelectedMarker(null)}/>
                        );
                      }
                        return null; // Render nothing if the attraction is not the selected one
                      })}
                  </>)}
                  {selectedMarker && (
                    <InfoWindow
                    options={{ pixelOffset: new google.maps.Size(0, -35), disableAutoPan: true }}
                    position={{ lat: selectedMarker.location.latitude, lng: selectedMarker.location.longitude }}
                    onCloseClick={() => {setSelectedMarker(null)}}
                  >
                    <div className="attractionContainer">
                      <img className="attractionImage" src={imageUrl || defaultAttractionImageUrl} alt={selectedMarker.name} />
                      <h6 className="attractionName">{selectedMarker.name}</h6>
                    </div>
                  </InfoWindow>
                  )}
                </GoogleMap>
                </Col>
              </Row>
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
            <Flex key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gridTemplateRows: 'auto auto', alignItems: 'start', width: '100%' }}>
              <Flex style={{ gridColumn: '1', gridRow: '1', paddingBottom: '5px'}}>{attraction.name}</Flex>
              <Tag icon={<EuroCircleOutlined />}color="green" style={{ gridColumn: '1', gridRow: '2', display: 'inline-block', maxWidth: '60px' }}> {attraction.perPersonCost ? attraction.perPersonCost * (trip!.nAdults + trip!.nKids) : "free"}</Tag>
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
            </Flex>
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
            <Flex key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', marginBottom: '10px' }}>
              <Flex style={{ fontSize: '13px' }}>{travelModel === "DRIVING" ? <TbCar className='fs-5 me-2' /> : (distanceInMeter > 2000 ? <TbCar className='fs-5 me-2'/> : <TbWalk className='fs-5 me-2' /> )}{distance}</Flex>
            </Flex>
          ),
        });
      }
      

      return items;
    });

    return (
      <>
        <div>
          <Timeline mode="left" items={timelineItems}  />
        </div>
        <center>
          {editing && (
          
            <Button type="primary" onClick={() => openForm(day)}>
              Add Attraction
            </Button>
          )
          
          }
      
        </center>
      </>
    );
  };

  const dayLabels : Array<string> = Array.from(trip?.schedule.keys() || []).map((day) => day.format('DD/MM/YYYY'));


  const dailyActivities: CollapseProps['items'] = dayLabels.map((dayLabel, index) => ({
    key: `${index}`,
    label: dayLabel,
    children: 
      <div>
        {renderAttractionsForDay(dayjs(dayLabel, 'DD/MM/YYYY'))}
      </div>,
  }));

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

  return (
    <>
      <Flex justify='space-evenly' align='center' style={{ fontSize: '25px'}}>
        <span><TbUser/> <Text> Adults : {trip?.nAdults} </Text> </span>
        <span><TbMoodKid/> <Text> Kids : {trip?.nKids} </Text> </span>
        <span>
        {(trip && totalCost > trip.budget) ? 
        <>
        <Tooltip title={"You have surpassed your budget which you set to " + trip.budget + " €"} placement='bottom'>
          <TbCoinEuro style={{color: 'red'}}/>  
          <Text style={{color: 'red'}}> Total Cost : {totalCost}{" €"} </Text> 
        </Tooltip> 
        </> :
        <>
        <TbCoinEuro/>
          <Text> Total Cost : {totalCost}{" €"} </Text>
        </>
        }
        </span>
      </Flex>
        
      <Divider style={{ marginTop: '10px'}}/>
      
      <Title level={1} style={{ textAlign: 'center' }}>{editing ? "Trip Edit" : "Trip Overview"}</Title>
      
      { !editing &&
        <div className='w-100 d-flex justify-content-end'>
        <Button
        size="middle"
        type="primary"
        className="button-new-trip me-5"
        style={{
          backgroundColor: colors.hardBackgroundColor,
          color: colors.whiteBackgroundColor,
          marginTop: "10px",
          paddingBottom: "38px",
          textAlign: "center",
          fontSize: "20px",
        }}
        onClick={() => {setEdit(true)}}
      >
        <span>
          <EditOutlined style={{ marginRight: "8px" }} /> Edit Trip
        </span>
      </Button>
      </div>}
      <div className='main-div'>
        <Container className="d-flex align-items-stretch height-full" >
          <div className='sidebar-space'>
          <Sidebar
              loadingState={{ value: loading, setter: setLoading }}
              errorState={{ value: error, setter: setError }}
              tripState={{ value: trip, setter: setTrip }}
              activeKeyState={{value: activeKey, setter: setActiveKey}}
              dailyActivities={dailyActivities}
              activeAttractionDistances={attractionDistances}
            />
          </div>
          <div className='body-space'>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div className='map-space'>
                <GoogleMapsComponent 
                  activeKeyState={{value: activeKey, setter: setActiveKey}}
                  cityPositionState={{value: cityPosition, setter: setCityPosition}}
                  directionsState={{value: directions, setter: setDirections}}
                  defaultCenter={defaultCenter}
                  tripState={{ value: trip, setter: setTrip }}
                />
              </div>
            </Container>
          </div>
          {renderAttractionForm()}
        </Container>
      </div>

      {editing && 
        <Popover
        content={
            <Chatbot
                tripState={{ value: trip, setter: setTrip }}
                dirtyState={{ value: dirty, setter: setDirty }}
                undoState={{ value: undoVisibility, setter: setUndoVisibility }}
                messageAIState={{ value: messageAI, setter: setMessageAI }}
                tripId={tripId}
                messageApi={messageApi}
            />
        }
        trigger="click"
        open={showChatbot}
        onOpenChange={handlePopoverVisibleChange}
        placement='right'
        arrow={{ pointAtCenter: true }}
        overlayStyle={{ width: '100%', maxWidth: '1120px' }}
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
      </Popover>}
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
          <div>
            <Container fluid className="position-relative">
              <Row className="align-items-center">
                <Col>
                  <Title level={2} className="text-left">{tripState.value.city}</Title>
                </Col>
                
              </Row>
            </Container>
          </div>
          <div className='sidebar-div'>
            <Collapse size="large" items={dailyActivities}  accordion={true} activeKey={activeKeyState.value} onChange={(keys) => activeKeyState.setter(keys)}/>
          </div>
        </>
      )}
    </>
  );
}

export default TripOverview;