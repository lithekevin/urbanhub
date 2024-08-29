import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { FaChild, FaChildDress, FaPerson, FaPersonDress, FaWallet } from "react-icons/fa6";
import { TbCoinEuroFilled } from "react-icons/tb";
import { Button, Col, Divider, Dropdown, Form, Image, Menu, Modal, Popover, Row, Spin, Tooltip, Typography, } from "antd";
import { ArrowLeftOutlined, DeleteTwoTone, EditTwoTone, MenuOutlined } from "@ant-design/icons";
import { deleteTrip, getTripById } from "../firebase/daos/dao-trips";
import { Attraction } from "../models/attraction";
import { TripAttraction } from "../models/tripAttraction";
import { Trip } from "../models/trip";
import AttractionForm from "../components/TripOverview/AttractionForm";
import { Chatbot } from "../components/TripOverview/ChatbotComponent";
import { TypingText } from "../components/TripOverview/ChatbotComponent";
import EditTripSettings from "../components/TripOverview/EditTripSettings";
import GoogleMapsComponent from "../components/TripOverview/GoogleMapsComponent";
import Sidebar from "../components/TripOverview/Sidebar";
import cities from "../firebase/cities";
import colors from "../style/colors";
import axios from "axios";
import dayjs from "dayjs";

const { Paragraph, Title, Text } = Typography;

const defaultAttractionImageUrl =
  "https://images.unsplash.com/photo-1416397202228-6b2eb5b3bb26?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function TripOverview(props: any) {
  const [menuOpen, setIsMenuOpen] = useState(false);
  const defaultCenter = {
    lat: 48.7758,
    lng: 9.1829,
  };

  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [dirty, setDirty] = useState<boolean>(true);
  const [dirty2, setDirty2] = useState<boolean>(false);
  const [messageApi, contextHolder] = [props.messageApi, props.contextHolder];
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const { tripId } = useParams();
  const [editing, setEdit] = useState<boolean>(location.state && location.state.mode === true);
  const [cityPosition, setCityPosition] = useState({
    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [travelModel, setTravelModel] = useState("WALKING");

  const [attractionCardHoveredID, setAttractionCardHoveredID] = useState<
    string | null
  >(null);

  //used for path between attractions
  var origin: any = null;
  var destination: any = null;
  var waypt: any[] = [];
  const [directions, setDirections] = useState<any>({
    geocoded_waypoints: [],
    routes: [],
    status: "ZERO_RESULTS",
  });
  const [attractionDistances, setAttractionDistances] = useState<any>([]);

  const [form] = Form.useForm();
  const [form1] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingAttraction, setEditingAttraction] =
    useState<TripAttraction | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    string | null
  >(null);
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs | null>(null);
  const zoomLevel = selectedAttractionId !== null ? 15 : 12;
  const selAttraction: Attraction | null | undefined =
    selectedAttractionId !== null
      ? cities
        .find((city) => city.name === trip?.city)
        ?.attractions.find(
          (attraction) => attraction.id === selectedAttractionId
        )
      : null;
  const [selectedMarker, setSelectedMarker] = useState<Attraction | null>(null);

  //Used for undo button and message in chatbot
  const [undoVisibility, setUndoVisibility] = useState(false);
  const [messageAI, setMessageAI] = useState(
    "Is there anything I can do for you?"
  );
  const [totalCost, setTotalCost] = useState(0);
  const [validSelection, setValidSelection] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(
    null
  );
  const [modifiedByChatbot, setModifiedByChatbot] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  //ActiveKey is update opening the current day for ingoing trips
  useEffect(() => {
    if(!modifiedByChatbot){
      const currentDay = dayjs().startOf("day");
      var closestIndex = null;

      let index = -1;

      // Iterate through the schedule
      trip?.schedule.forEach((attractions, scheduledDay) => {
        index++;

        // Check if the current day matches any scheduled day
        if (dayjs(scheduledDay).startOf("day").isSame(currentDay)) {
          closestIndex = index;
        }
      });

      if (closestIndex !== null) {
        setActiveKey([closestIndex]);
      } else {
        setActiveKey([]);
      }
    }
    
  }, [trip]);

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

              const index = tripData.questions.findIndex((question) =>
                question.includes("transportation")
              );
              if (index !== -1) {
                if (tripData.answers.length > 0)
                  tripData.answers[index].includes("car") ||
                    tripData.answers[index].includes("driv") ||
                    tripData.answers[index].includes("public")
                    ? setTravelModel("DRIVING")
                    : setTravelModel("WALKING");
              }
            }
            let sum = 0;
            tripData.schedule.forEach((dayAttractions) => {
              dayAttractions.forEach((attraction) => {
                sum += attraction.perPersonCost;
              });
            });
            setTotalCost(sum * (tripData.nAdults + tripData.nChildren));
          } else {
            console.log(`Trip with ID ${tripId} not found.`);
          }
        }
      } catch (error) {
        console.error("Error loading trip details:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadTripDetails();
  }, [dirty]);

  useEffect(() => {
    const directionsService = new google.maps.DirectionsService();

    if (activeKey.length === 0) {
      setDirections({
        geocoded_waypoints: [],
        routes: [],
        status: "ZERO_RESULTS",
      });
      setAttractionDistances([]);
    } else {
      //iterate throught all attractions of a day
      renderMarkerForDay(
        dayjs(dayLabels[parseInt(activeKey[0], 10)], "DD/MM/YYYY")
      ).map((attraction, index) => {
        if (index === 0) {
          //update first element
          origin = {
            lat: attraction.location.latitude,
            lng: attraction.location.longitude,
          };
          destination = null;
          waypt = [];
          return null;
        } else if (
          index ===
          renderMarkerForDay(
            dayjs(dayLabels[parseInt(activeKey[0], 10)], "DD/MM/YYYY")
          ).length -
          1
        ) {
          //update last element and caluclate route for the day
          destination = {
            lat: attraction.location.latitude,
            lng: attraction.location.longitude,
          };

          directionsService.route(
            {
              origin: origin,
              destination: destination,
              waypoints: waypt,
              travelMode:
                travelModel === "WALKING"
                  ? google.maps.TravelMode.WALKING
                  : google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                setDirections(result);
                // Extract distances between waypoints
                if (
                  result?.routes &&
                  result?.routes.length > 0 &&
                  result?.routes[0].legs
                ) {
                  const distances = result?.routes[0].legs.map(
                    (leg) => leg?.distance?.text
                  );
                  setAttractionDistances(distances);
                }
              } else {
                console.error(`error fetching directions ${result}`);
                setAttractionDistances([]);
              }
            }
          );
          return null;
        } else {
          //update middle elements
          waypt.push({
            location: {
              lat: attraction.location.latitude,
              lng: attraction.location.longitude,
            },
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
      const response = await axios.get(
        "https://api.unsplash.com/search/photos",
        {
          params: {
            query,
            per_page: 1,
          },
          headers: {
            Authorization: `Client-ID 4rjvZvwzFuPY3uX3WAnf2Qb8eWkwvDys-sdsyvDdai0`,
          },
        }
      );

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
      if (selectedAttractionId !== null && selAttraction) {
        bounds.extend({
          lat: selAttraction.location.latitude,
          lng: selAttraction.location.longitude,
        });
        bounds.extend({
          lat: selAttraction.location.latitude + 0.001,
          lng: selAttraction.location.longitude,
        });
        bounds.extend({
          lat: selAttraction.location.latitude - 0.001,
          lng: selAttraction.location.longitude,
        });
        bounds.extend({
          lat: selAttraction.location.latitude,
          lng: selAttraction.location.longitude + 0.001,
        });
        bounds.extend({
          lat: selAttraction.location.latitude,
          lng: selAttraction.location.longitude - 0.001,
        });
      } else {
        cities
          .find((city) => city.name === trip?.city)
          ?.attractions.map((attraction: Attraction, index: number) => {
            bounds.extend({
              lat: attraction.location.latitude,
              lng: attraction.location.longitude,
            });
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

  const dayLabels: Array<string> = Array.from(trip?.schedule.keys() || []).map(
    (day) => day.format("DD/MM/YYYY")
  );
  const renderMarkerForDay = (day: dayjs.Dayjs) => {
    let attractionsForDay: TripAttraction[] = [];
    // Find the closest matching key
    let closestKey: dayjs.Dayjs | null = null;
    let minDifference: number | null = null;

    trip?.schedule.forEach((attractions, key) => {
      const difference = Math.abs(day.diff(key, "days"));
      if (minDifference === null || difference < minDifference) {
        minDifference = difference;
        closestKey = key;
      }
    });

    if (closestKey !== null) {
      attractionsForDay = trip?.schedule.get(closestKey) || [];
    }
    return attractionsForDay;
  };

  const [isHovered, setIsHovered] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false); 

  const handlePopoverVisibleChange = (visible: boolean) => {
    setShowChatbot(visible); // Set the visibility of the chatbot based on popover visibility

    // Prevent scrolling when the popover is open
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setMessageAI("Is there anything I can do for you?");
    }
  };

  const handleOpenModal = () => {
    form1.setFieldsValue({
      nAdults: trip?.nAdults,
      nChildren: trip?.nChildren,
      budget: trip?.budget,
      dateRange: [trip?.startDate, trip?.endDate],
    });
    setDirty2(true);
    setVisible(true);
  };

  function handleDeleteTrip() {
    Modal.confirm({
      title: "Delete Trip",
      content: (
        <div>
          <p>Are you sure you want to delete this trip?</p>
          <p>
            <strong>Destination:</strong> {trip?.city}
            <br />
            <strong>Start Date:</strong> {trip?.startDate.format("DD/MM/YYYY")}
            <br />
            <strong>End Date:</strong> {trip?.endDate.format("DD/MM/YYYY")}
            <br />
          </p>
        </div>
      ),
      centered: true,
      onOk: async () => {
        try {
          if (tripId) {
            await deleteTrip(tripId);
            navigate("/", { state: { mode: true } });

          }
        } catch (error) {
          console.error("Error deleting trip:", error);
          // Show error message
          messageApi.open({
            type: "error",
            content: "Error while deleting trip!",
            duration: 3,
            style: {
              marginTop: "70px",
            },
          });
        }
      },
      okText: "Yes, delete it",
      cancelText: "No, Cancel",
      okButtonProps: { danger: true },
    });
  }

  const [showTooltip, setShowTooltip] = useState(false);

  //Imposta lo stato del tooltip su true quando il componente viene montato
  useEffect(() => {
    setShowTooltip(true);

    // Imposta un timeout per nascondere il tooltip dopo 10 secondi
    const timeout = setTimeout(() => {
      setShowTooltip(false);
    }, 10000); // 10 secondi in millisecondi

    // Cancella il timeout quando il componente viene smontato o quando lo stato del tooltip cambia
    return () => clearTimeout(timeout);
  }, []);
 
  const tripMenu = () => { 
    return (
      <Menu
        items={[
          editing ? // Render the "Edit trip settings" button only if editing is true
            {
              key: "edit",
              label: <Text>Edit Trip Settings</Text>,
              icon: <EditTwoTone style={{ fontSize: '15px'}}/>,
              onClick: handleOpenModal,
            }
            : null, // If editing is false, render null
          tripId ? // Render the "Delete trip" button only if tripId is defined
          {
            key: "delete",
            label: <Text>Delete Trip</Text>,
            icon: <DeleteTwoTone twoToneColor={colors.deleteButtonColor} style={{ fontSize: '15px'}}/>,
            onClick: handleDeleteTrip,
          }: null, // If tripId is not defined, render null
        ]}
      />
    );
  };

  return (
    <>
      {(loading || imageLoading) && (
        <Spin size="large" fullscreen/>
      )}

      {/*contextHolder*/}

      <Row 
        align="middle"
        style={{ paddingTop: '15px' }}>
        {/* Arrow on the left */}
        <Col xs={2} sm={2} md={4} lg={4} xl={4} xxl={4} style={{ paddingLeft: '1%' }}>
          <div onClick={() => navigate(-1)} className="back-link" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeftOutlined
              className="float-left"
              style={{ marginRight: '4px', fontSize: '25px' }}
            /> <Text>Back</Text>
          </div>
        </Col>
        <Col xs={5} sm={5} md={4} lg={4} xl={4} xxl={4}>
          <span className="span-container">
            <FaPersonDress style={{ color: "grey" }} size={30} />
            <FaPerson style={{ color: "grey" }} size={30} />
            <Text> Adults: {trip?.nAdults} </Text>
          </span>
        </Col>
        <Col xs={5} sm={5} md={4} lg={4} xl={4} xxl={4}>
          <span className="span-container">
            <FaChildDress style={{ color: "grey" }} size={25} />
            <FaChild style={{ color: "grey" }} size={25} />
            <Text> Children: {trip?.nChildren} </Text>
          </span>
        </Col>
        <Col xs={5} sm={5} md={4} lg={4} xl={4} xxl={4}>
          <span className="span-container">
            <FaWallet style={{ color: "grey", marginRight: '6px' }} size={24} />
            <Text> Budget: {trip?.budget} € </Text>
          </span>
        </Col>
        <Col xs={5} sm={5} md={4} lg={4} xl={4} xxl={4}>
          <span className="span-container">
            {trip && totalCost > trip.budget ? (
              <>
                <TbCoinEuroFilled style={{ color: "red", marginRight: '4px' }} size={24} />
                <Tooltip
                  title={
                    <Paragraph
                      style={{ textAlign: "center", color: "white", margin: "0" }}
                    >
                      The initial budget you set has been exceeded by{" "}
                      {totalCost - trip.budget} €
                    </Paragraph>
                  }
                  placement="bottom"
                >
                  <Text style={{ color: "red" }}>
                    {" "}
                    Total Cost: {totalCost}
                    {" €"}{" "}
                  </Text>
                </Tooltip>
              </>
            ) : (
              <>
                <TbCoinEuroFilled style={{ color: "grey", marginRight: '4px' }} size={24} />
                <Text> Total Cost: {totalCost} €
                </Text>
              </>
            )}
          </span>
        </Col>
        <Col xs={2} sm={2} md={4} lg={4} xl={4} xxl={4} style={{ textAlign: 'end', paddingRight: '1%' }}>
          <Dropdown 
            dropdownRender={() => tripMenu()} 
            placement="bottomRight" 
            arrow={{ pointAtCenter: false }} 
            trigger={["click"]}
            onOpenChange={(visible) => {
              setIsMenuOpen(visible);
            }}
          >
            <Button
              icon={<MenuOutlined />}
              size="middle"
              className={`enterEditModeButton ${menuOpen ? "menu-open" : ""}`} 
              type="text"
              style={{
                backgroundColor: 'white',
                color: colors.hardBackgroundColor,
                borderColor: colors.hardBackgroundColor,
                textAlign: "center",
                fontSize: '15px',
                marginRight: '5px'
              }}
            > Edit Trip </Button>
          </Dropdown>
        </Col>
      </Row>

      <Divider style={{ marginTop: "10px" }} />

      <Title level={2} style={{ textAlign: "center" }}>
        TRIP OVERVIEW
      </Title>

      <div className="main-div">
        <Container className="container custom-container d-flex align-items-stretch height-full">
          <div className="sidebar-space">
            <Sidebar
              activeKeyState={{ value: activeKey, setter: setActiveKey }}
              attractionDistances={attractionDistances}
              dayLabels={dayLabels}
              editing={{ value: editing, setter: setEdit }}
              errorState={{ value: error, setter: setError }}
              form={form}
              loadingState={{ value: loading, setter: setLoading }}
              messageApi={messageApi}
              contextHolder={contextHolder}
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
              attractionCardHoveredID={{
                value: attractionCardHoveredID,
                setter: setAttractionCardHoveredID,
              }}
              modifiedByChatbot={{value: modifiedByChatbot, setter: setModifiedByChatbot}}
            />
          </div>
          <div className="body-space">
            <Container
              fluid
              className="position-relative d-flex flex-column align-items-center"
              style={{ height: "100%", marginTop: '43px' }}
            >
              <div className="map-space">
                <GoogleMapsComponent
                  activeKeyState={{ value: activeKey, setter: setActiveKey }}
                  cityPositionState={{
                    value: cityPosition,
                    setter: setCityPosition,
                  }}
                  defaultCenter={defaultCenter}
                  directionsState={{
                    value: directions,
                    setter: setDirections,
                  }}
                  tripState={{ value: trip, setter: setTrip }}
                  attractionCardHoveredID={{
                    value: attractionCardHoveredID,
                    setter: setAttractionCardHoveredID,
                  }}
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
            messageApi={messageApi}
            contextHolder={contextHolder}
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
            modifiedByChatbot={{value: modifiedByChatbot, setter: setModifiedByChatbot}}
          />
          <EditTripSettings
            form1={form1}
            visible={visible}
            setVisible={setVisible}
            trip={trip}
            setDirty={setDirty}
            dirty2={dirty2}
            setDirty2={setDirty2}
          />
        </Container>
        {editing && (
          <Popover
            content={
              <Chatbot
                tripState={{ value: trip, setter: setTrip }}
                dirtyState={{ value: dirty, setter: setDirty }}
                undoState={{ value: undoVisibility, setter: setUndoVisibility }}
                messageAIState={{
                  value: messageAI,
                  setter: setMessageAI
                }}
                tripId={tripId}
                messageApi={messageApi}
                modifiedByChatbot={{value: modifiedByChatbot, setter: setModifiedByChatbot}}
              />
            }
            trigger="click"
            open={showChatbot}
            onOpenChange={handlePopoverVisibleChange}
            placement="right"
            arrow={{ pointAtCenter: true }}
            overlayStyle={{ width: "85vw", marginLeft: "20px", boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)", borderRadius: '4%' }}
          >
            <Tooltip
              title={<Text style={{ color: 'white' }}><TypingText text="Click me! I can help you modify the trip." reloadText={0} /></Text>}
              placement="top"
              open={showTooltip}
              overlayStyle={{ width: '100px', height: 'auto' }}
            >
              <Button
                type="text"
                className="chatbot-button"
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  position: "fixed",
                  right: "3.5%",
                  zIndex: 999,
                  backgroundColor: 'white',
                  bottom: `30px`,
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.7)",
                  transform: `scale(${isHovered ? 1.1 : 1})`,
                  transition: "box-shadow transform 0.3s ease",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderColor: '#00AA70'
                }}
                onMouseEnter={() => {
                  setIsHovered(true);
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setIsHovered(false)
                  setShowTooltip(false);
                }}
              >
                <Image
                  src="https://imgur.com/tRPWpWV.png"
                  alt="UrbanHub assistant"
                  preview={false}
                  height={"auto"}
                  style={{ width: '60px', height: '60px' }}
                />
              </Button>
            </Tooltip>
          </Popover>
        )}
      </div>
    </>
  );
}

export default TripOverview;
