import { useEffect, useState } from "react";
import { Alert, Card, Container, Spinner, Row, Col } from "react-bootstrap";
import { Typography, Dropdown, Menu, Button, Modal, message } from "antd"
import { MoreOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { deleteTrip, getAllTrips } from "../firebase/daos/dao-trips";
import { Trip } from "../models/trip";
import { Link } from "react-router-dom";
import { MenuInfo } from "rc-menu/lib/interface";
import colors from "../style/colors";
import dayjs from "dayjs";
import cities from "../firebase/cities";

const { Title } = Typography;
const defaultImageURL = "https://images.unsplash.com/photo-1422393462206-207b0fbd8d6b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function MyTrips() {

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // load trips from firebase

    async function loadTrips() {
      setLoading(true);
      getAllTrips().then((DBtrips) => {

        let processedTrips: Trip[] = DBtrips.map((trip) => {
          let processedTrip: Trip = trip;
          processedTrip.image = cities.find((city) => city.name === trip.city)?.image || defaultImageURL;
          return processedTrip;
        }
        );

        setTrips(processedTrips);
      }).catch((error) => {
        console.log(error);
        setError(true);
      });
      setLoading(false);
    }

    loadTrips();

  }, []);

  const handleDelete = (trip: Trip) => {
    // Display a custom confirmation dialog
    Modal.confirm({
      title: 'Delete Trip',
      content: (
        <div>
          <p>Are you sure you want to delete this trip?</p>
          <p>
            <strong>Destination:</strong> {trip.city}<br />
            <strong>Start Date:</strong> {trip.startDate.format('DD/MM/YYYY')}<br />
            <strong>End Date:</strong> {trip.endDate.format('DD/MM/YYYY')}<br />
          </p>
        </div>
      ),
      centered: true,      
      onOk: async () => {
        // Implement your logic to delete the trip with the given ID

        try{

          await deleteTrip(trip.id);

          messageApi.open({
            type: "success",
            content: "Trip deleted successfully!",
            duration: 3,
            style: {
              marginTop: '70px',
            },
          });

        } catch (error) {
          console.log(error);
          messageApi.open({
            type: "error",
            content: "Error while deleting trip!",
            duration: 3,
            style: {
              marginTop: '70px',
            },
          });
        }

        console.log(`Deleting trip:
          City: ${trip.city}
          Start Date: ${trip.startDate.format('DD/MM/YYYY')}
          End Date: ${trip.endDate.format('DD/MM/YYYY')}
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

  const menu = (trip: Trip) => (
    <Menu items={[
      {
        key: 'delete',
        label: (
          <>
            <DeleteOutlined style={{marginRight: '2px'}}/>
            Delete
          </>
        ),
        onClick: (info: MenuInfo) => {
          info.domEvent.preventDefault();
          info.domEvent.stopPropagation();
          handleDelete(trip);
        }
      },
      {
        key: 'edit',
        label: (
          <>
            <EditOutlined style={{marginRight: '2px'}}/>
            Edit
          </>
        ),
        onClick: (info: MenuInfo) => {
          info.domEvent.preventDefault();
          info.domEvent.stopPropagation();
          console.log("Edit trip with id: " + trip.id);
        }
      }
    ]} />
  );

  return (
    <>
    <Container className="d-flex flex-column align-items-center content-padding-top">
      {contextHolder}

      <Container fluid className="position-relative d-flex flex-column align-items-center">
        <Title className="text-center" level={1}>MY TRIPS</Title>
      </Container>

      {
        (loading) && 
        <div className="d-flex flex-column justify-content-center align-items-center">
          <Spinner animation="border" role="status" className="mb-4" />
          <Title level={2}>Loading...</Title>
        </div>
      }

      {
        error &&
        <Col xs={11} md={9} lg={5}>
        <Alert variant="danger">
            <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
            <p>
              You got an error while loading your trips.
            </p>
            <span>
              Please refresh the page.
            </span>         
        </Alert>
        </Col>
      
      }

      <Row className="d-flex flex-row justify-content-center w-100 mt-5 px-5">
        {
          trips.map((trip, index) => {
            return (
              <Col key={trip.id} xs={11} md={5} lg={3} className="mb-4">
                <Link to={`/trips/${trip.id}`} className="text-decoration-none">
                  <Card key={trip.id} className="text-center tripCard" style={{backgroundColor: colors.whiteBackgroundColor}}>
                      <div className="city-image-container">
                        
                        <img src={trip.image} alt={`City: ${trip.city}`} className="city-image" />
                        <div className="gradient-overlay"></div>
                        <div className="custom-dropdown">
                        <Dropdown dropdownRender={() => menu(trip)}  trigger={['click']} placement="bottomRight" arrow={{pointAtCenter: true}}>
                          <Button
                            type="text"
                            icon={<MoreOutlined style={{ fontSize: '24px', color: 'white' }} />}
                            style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%'}}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          />
                        </Dropdown>
                        </div>
                      
                      </div>
                      <Card.Body>
                        <Card.Title style={{position: "relative", top: -40, fontSize: 30}}>{trip.city}</Card.Title>
                        <Card.Text>
                          {trip.startDate.format('DD/MM/YYYY')} - {trip.endDate.format('DD/MM/YYYY')}
                        </Card.Text>
                      </Card.Body>
                  </Card>
                </Link>
                {
                  dayjs().isAfter(trip.startDate) && dayjs().isBefore(trip.endDate) && 
                  <h5 className="text-start mt-3">ONGOING...</h5>
                }
              </Col>
            );
          })
        }
      </Row>
     
      <Button 
        size="large" 
        type="primary"
        style={{ 
          backgroundColor: colors.hardBackgroundColor,
          color: colors.whiteBackgroundColor,
          marginTop: '30px',
          paddingBottom: '38px',
          textAlign: 'center',
          fontSize: '20px',
        }}
        href="/newTrip"
      >
        <span>
          <PlusOutlined style={{ marginRight: '8px' }} /> New Trip
        </span>
      </Button>
        
    </Container>
    </>
  );
}

export default MyTrips;