import React, { FC, useEffect, useState } from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { Typography, Button, Modal, Skeleton, Image, Empty, Spin, Alert, Tabs, Flex, ConfigProvider, Dropdown, Menu } from "antd";
import { PlusOutlined, DeleteTwoTone, MoreOutlined } from "@ant-design/icons";
import { deleteTrip, getAllTrips } from "../firebase/daos/dao-trips";
import { Trip } from "../models/trip";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MenuInfo } from "rc-menu/lib/interface";
import colors from "../style/colors";
import dayjs from "dayjs";
import cities from "../firebase/cities";

const { Text, Title, Paragraph } = Typography;
const defaultImageURL = "https://images.unsplash.com/photo-1422393462206-207b0fbd8d6b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function MyTrips(props: any) {
  const navigate = useNavigate();
  const location = useLocation();

  const [message] = useState<boolean>(location.state && location.state.mode === true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("2"); // Default to "2" (Ongoing trips)

  const [messageApi, contextHolder] = [props.messageApi, props.contextHolder];
  const [enlargedCard, setEnlargedCard] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load trips from firebase
    async function loadTrips() {
      setLoading(true);
      try {
        const DBtrips = await getAllTrips();
        let processedTrips: Trip[] = DBtrips.map((trip) => {
          let processedTrip: Trip = trip;
          processedTrip.image =
            cities.find((city) => city.name === trip.city)?.image ??
            defaultImageURL;
          return processedTrip;
        }).sort((a, b) => {
          return dayjs(a.startDate).isAfter(dayjs(b.startDate)) ? 1 : -1;
        });

        setTrips(processedTrips);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setError(true);
        setLoading(false);
      }
    }

    loadTrips();
  }, []);

  useEffect(() => {
    if (location.state && location.state.mode) {
      messageApi.open({
        type: "success",
        content: "Trip deleted successfully!",
        duration: 3,
        style: {
          marginTop: "70px",
        },
      });
    }
  }, [location]);



  useEffect(() => {
    // Retrieve the active tab from URL parameters when the component mounts or updates
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleDelete = async (trip: Trip) => {
    setEnlargedCard(trip.id);
    // Display a custom confirmation dialog
    Modal.confirm({
      title: "Delete Trip",
      content: (
        <div>
          <p>Are you sure you want to delete this trip?</p>
          <p>
            <strong>Destination:</strong> {trip.city}
            <br />
            <strong>Start Date:</strong> {trip.startDate.format("DD/MM/YYYY")}
            <br />
            <strong>End Date:</strong> {trip.endDate.format("DD/MM/YYYY")}
            <br />
          </p>
        </div>
      ),
      centered: true,
      onOk: async () => {
        try {
          await deleteTrip(trip.id);
          messageApi.success("Trip deleted successfully!");
        } catch (error) {
          console.log(error);
          messageApi.error("Error while deleting trip!");
        }

        // Update your state or perform any necessary actions to remove the trip
        setTrips((prevTrips) => prevTrips.filter((t) => t.id !== trip.id));
        setEnlargedCard(null);
      },
      onCancel: () => {
        // Handle cancel if needed
        setEnlargedCard(null);
      },
      okText: "Yes, delete it",
      cancelText: "No, Cancel",
      okButtonProps: { danger: true },
    });
  };

  const handleMenuHover = (trip: Trip) => {
    setEnlargedCard(trip.id);
  };

  const menu = (trip: Trip) => {
    return (
      <Menu
        items={[
          {
            key: "delete",
            icon: <DeleteTwoTone twoToneColor={colors.deleteButtonColor} style={{ fontSize: '15px'}}/>,
            label: <Text>Delete Trip</Text>,
            onMouseEnter: () => handleMenuHover(trip),
            onClick: (info: MenuInfo) => {
              info.domEvent.preventDefault();
              info.domEvent.stopPropagation();
              handleDelete(trip);
            }
          }
        ]}
      />
    );
  };

  return (
    <>
      {loading && (
        <Spin size="large" fullscreen/>
      )}

      {error && (
        <Col>
          <Alert
            message={
              <Title level={3}>
                Oh snap! You got an error!
              </Title>
            }
            showIcon
            description={
              <>
                <Paragraph> Error while loading trips. </Paragraph>
                <Paragraph> Please refresh the page. </Paragraph>
              </>
            }
            type="error"
            style={{ width: 'fit-content', margin: 'auto', marginTop: '20px' }}
          />
        </Col>
      )}

      {contextHolder}

      <Flex align="middle" justify="space-around" className="mt-4">
        <Title level={2} style={{ marginBottom: '0' }}>MY TRIPS</Title>
        <AddTripButton />
      </Flex>

      {!loading && !error && (
        <>
          <ConfigProvider
            theme={{
              components: {
                Tabs: {
                  inkBarColor: "var(--hard-background-color)"
                },
              },
            }}
          >
            <Tabs
              className="custom-tabs mt-4"
              activeKey={activeTab}
              onChange={(key) => {
                // Update the URL when the active tab changes
                navigate(`.?tab=${key}`);
                setActiveTab(key);
              }}
              centered
              items={new Array(3).fill(null).map((_, i) => {
                const id = String(i + 1);
                const tabLabel = id === '1' ? 'Past Trips' : id === '2' ? 'Ongoing trips' : 'Future trips';
                return {
                  label: <Flex align="middle" justify="center" style={{ width: '130px' }}><Text style={{ fontSize: '18px' }}>{tabLabel}</Text></Flex>,
                  key: id,
                  children: (
                    <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
                      <Row className="d-flex flex-row justify-content-center">
                        {id === '2' && trips.filter((t) => t.startDate.isBefore(dayjs()) && t.endDate.isAfter(dayjs())).length === 0 ? (
                          <div className="empty-container">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You are not currently on any trip" />
                          </div>
                        ) : id === '2' ? (
                          trips.filter((t) => t.startDate.isBefore(dayjs()) && t.endDate.isAfter(dayjs())).map((trip, index) => (
                            <TripCard
                              key={trip.id}
                              trip={trip}
                              menu={menu}
                              enlargedCard={enlargedCard}
                              setEnlargedCard={setEnlargedCard}
                              isMenuOpen={isMenuOpen}
                              setIsMenuOpen={setIsMenuOpen}
                              handleMenuHover={handleMenuHover}
                            />
                          ))
                        ) : id === '3' && trips.filter((t) => t.startDate.isAfter(dayjs())).length === 0 ? (
                          <div className="empty-container">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You don't have any trip planned for the future" />
                          </div>
                        ) : id === '3' ? (
                          trips.filter((t) => t.startDate.isAfter(dayjs())).map((trip, index) => (
                            <TripCard
                              key={trip.id}
                              trip={trip}
                              menu={menu}
                              enlargedCard={enlargedCard}
                              setEnlargedCard={setEnlargedCard}
                              isMenuOpen={isMenuOpen}
                              setIsMenuOpen={setIsMenuOpen}
                              handleMenuHover={handleMenuHover}
                            />
                          ))
                        ) : id === '1' && trips.filter((t) => t.endDate.isBefore(dayjs())).length === 0 ? (
                          <div className="empty-container">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You don't have any past trip" />
                          </div>
                        ) : (
                          trips.filter((t) => t.endDate.isBefore(dayjs())).map((trip, index) => (
                            <TripCard
                              key={trip.id}
                              trip={trip}
                              menu={menu}
                              enlargedCard={enlargedCard}
                              setEnlargedCard={setEnlargedCard}
                              isMenuOpen={isMenuOpen}
                              setIsMenuOpen={setIsMenuOpen}
                              handleMenuHover={handleMenuHover}
                            />
                          ))
                        )}
                      </Row>
                    </Container>
                  ),
                };
              })}
            />
          </ConfigProvider>
        </>
      )}
    </>
  );
}

function TripCard(props: Readonly<{
  trip: Trip;
  menu: (trip: Trip) => React.ReactNode;
  enlargedCard: string | null;
  setEnlargedCard: React.Dispatch<React.SetStateAction<string | null>>;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleMenuHover: (trip: Trip) => void;
}>) {

  const { trip, menu, enlargedCard, setEnlargedCard, isMenuOpen, setIsMenuOpen, handleMenuHover } = props;

  useEffect(() => {
    if (!isMenuOpen) {
      setEnlargedCard(null);
    }
  }, [isMenuOpen, setEnlargedCard]);

  const isPastTrip = dayjs().isAfter(dayjs(trip.endDate));

  return (
    <Col key={trip.id} xs={7} md={4} lg={3} className="mb-4">
      <Link to={{ pathname: `/trips/${trip.id}` }} state={{ mode: !isPastTrip }} className="text-decoration-none" >
        <Card
          key={trip.id}
          className={`text-center tripCard ${enlargedCard === trip.id ? "enlarged" : ""} ${isMenuOpen ? "enlarged-card" : ""}`}
          style={{ backgroundColor: colors.whiteBackgroundColor }}
        >
          <div className="city-image-container">
            <TripImage src={trip.image} alt={`City: ${trip.city}`} />
            <div className="gradient-overlay-bottom"></div>
            <div className="custom-dropdown">
              <Dropdown
                dropdownRender={() => menu(trip)}
                trigger={["click"]}
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
                onOpenChange={(visible) => {
                  setIsMenuOpen(visible);
                  visible ? handleMenuHover(trip) : setEnlargedCard(null);
                }}
              >
                <Button
                  type="text"
                  icon={
                    <MoreOutlined
                      style={{ fontSize: "24px", color: "white" }}
                    />
                  }
                  style={{
                    background: "rgba(0, 0, 0, 0.7)",
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                />
              </Dropdown>
            </div>
          </div>
          <Card.Body>
            <Card.Title
              style={{ position: "relative", top: -35, fontSize: 26 }}
            >
              {trip.city}
            </Card.Title>
            <Card.Text>
              {trip.startDate.format("DD/MM/YYYY")} -{" "}
              {trip.endDate.format("DD/MM/YYYY")}
            </Card.Text>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
}

function AddTripButton() {
  return (
    <Button
      size="large"
      type="primary"
      className="button-new-trip"
      style={{
        backgroundColor: colors.hardBackgroundColor,
        color: colors.whiteBackgroundColor,
        textAlign: "center",
      }}
      href="/newTrip"
    >
      <span>
        <PlusOutlined style={{ marginRight: "8px" }} /> New Trip
      </span>
    </Button>
  );
}

interface TripImageProps {
  src: string;
  alt: string;
}

const TripImage: FC<TripImageProps> = ({ src, alt }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      {!imageLoaded && (
        <Skeleton.Image style={{ width: "350px", height: "300px" }} />
      )}
      <Image
        src={src}
        alt={alt}
        className="city-image"
        onLoad={() => setImageLoaded(true)}
        style={imageLoaded ? {} : { display: "none" }}
        preview={false}
      />
    </>
  );
};

export default MyTrips;
