import { FC, useEffect, useState } from "react";
import { Card, Row, Col  } from "react-bootstrap";
import { Typography, Dropdown, Menu, Button, Modal, message, Skeleton, Image, Empty, Divider, Spin, Alert } from "antd";
import { MoreOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { deleteTrip, getAllTrips } from "../firebase/daos/dao-trips";
import { Trip } from "../models/trip";
import { Link } from "react-router-dom";
import { MenuInfo } from "rc-menu/lib/interface";
import colors from "../style/colors";
import dayjs from "dayjs";
import cities from "../firebase/cities";

const { Title, Paragraph } = Typography;
const defaultImageURL = "https://images.unsplash.com/photo-1422393462206-207b0fbd8d6b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const [messageApi, contextHolder] = message.useMessage();

  const [enlargedCard, setEnlargedCard] = useState<string | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // load trips from firebase
    async function loadTrips() {
      setLoading(true);
      getAllTrips()
        .then((DBtrips) => {
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
        })
        .catch((error) => {
          console.log(error);
          setError(true);
          setLoading(false);
        });
    }

    loadTrips();
  }, []);

  const handleDelete = (trip: Trip) => {
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
        // Implement your logic to delete the trip with the given ID

        try {
          await deleteTrip(trip.id);
          messageApi.open({
            type: "success",
            content: "Trip deleted successfully!",
            duration: 3,
            style: {
              marginTop: "70px",
            },
          });
        } catch (error) {
          console.log(error);
          messageApi.open({
            type: "error",
            content: "Error while deleting trip!",
            duration: 3,
            style: {
              marginTop: "70px",
            },
          });
        }

        console.log(`Deleting trip:
          City: ${trip.city}
          Start Date: ${trip.startDate.format("DD/MM/YYYY")}
          End Date: ${trip.endDate.format("DD/MM/YYYY")}
          ID: ${trip.id}
        `);

        // Update your state or perform any necessary actions to remove the trip
        setTrips((prevTrips) => prevTrips.filter((t) => t.id !== trip.id));
      },
      onCancel: () => {
        // Handle cancel if needed
      },
    });
  };

  const handleMenuHover = (trip: Trip) => {
    setEnlargedCard(trip.id);
  };

  const menu = (trip: Trip) => (
    <Menu
      items={[
        {
          key: "delete",
          label: (
            <>
              <DeleteOutlined style={{ marginRight: "2px" }} />
              Delete
            </>
          ),
          onMouseEnter: () => handleMenuHover(trip),
          onClick: (info: MenuInfo) => {
            info.domEvent.preventDefault();
            info.domEvent.stopPropagation();
            handleDelete(trip);
          },
        },
        {
          key: "edit",
          label: (
            <>
              <EditOutlined style={{ marginRight: "2px" }} />
              Edit
            </>
          ),
          onMouseEnter: () => handleMenuHover(trip),
          onClick: (info: MenuInfo) => {
            info.domEvent.preventDefault();
            info.domEvent.stopPropagation();
            console.log("Edit trip with id: " + trip.id);
          },
        },
      ]}
    />
  );

  return (
    <>
      {loading && (
        <Spin tip="Loading" size="large" fullscreen>
        <div> Loading </div>
        </Spin>
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
          style={{width: 'fit-content', margin: 'auto', marginTop: '20px'}}
        />
      </Col>
      )}

      {contextHolder}

      <Divider>
        <Title level={1} style={{ marginBottom: '5px' }}>
          MY TRIPS
        </Title>
        <AddTripButton/>
      </Divider>
      
      {!loading && !error && (
        <>
          <Divider orientation="left">
            <Title level={3}>
              Ongoing trips
            </Title>
          </Divider>
    
          <Row className="d-flex flex-row justify-content-center">
            {trips.filter(
              (t) =>
                t.startDate.isBefore(dayjs()) && t.endDate.isAfter(dayjs())
            ).length === 0
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You are not currently on any trip"/>
              : trips
                  .filter(
                    (t) =>
                      t.startDate.isBefore(dayjs()) &&
                      t.endDate.isAfter(dayjs())
                  )
                  .map((trip, index) => {
                    return (
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
                    );
                  })}
          </Row>

          <Divider orientation="left">
            <Title level={3}>
              Future trips
            </Title>
          </Divider>

          <Row className="d-flex flex-row justify-content-center">
            {trips.filter((t) => t.startDate.isAfter(dayjs())).length === 0
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You don't have any trip planned for the future"/>
              : trips
                  .filter((t) => t.startDate.isAfter(dayjs()))
                  .map((trip, index) => {
                    return (
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
                    );
                  })}
          </Row>

          <Divider orientation="left">
            <Title level={3}>
              Past trips
            </Title>
          </Divider>

          <Row className="d-flex flex-row justify-content-center">
            {trips.filter((t) => t.endDate.isBefore(dayjs())).length === 0
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You don't have any past trip"/>
              : trips
                  .filter((t) => t.endDate.isBefore(dayjs()))
                  .map((trip, index) => {
                    return (
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
                    );
                  })}
          </Row>
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
  const {
    trip,
    menu,
    enlargedCard,
    setEnlargedCard,
    isMenuOpen,
    setIsMenuOpen,
    handleMenuHover,
  } = props;

  useEffect(() => {
    if (!isMenuOpen) {
      setEnlargedCard(null);
    }
  }, [isMenuOpen, setEnlargedCard]);

  return (
    <Col key={trip.id} xs={11} md={5} lg={3} className="mb-4">
      <Link to={`/trips/${trip.id}`} className="text-decoration-none">
        <Card
          key={trip.id}
          className={`text-center tripCard ${
            enlargedCard === trip.id ? "enlarged" : ""
          } ${isMenuOpen ? "enlarged-card" : ""}`}
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
              style={{ position: "relative", top: -40, fontSize: 30 }}
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
        marginTop: "10px",
        paddingBottom: "38px",
        textAlign: "center",
        fontSize: "20px",
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
