import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import NavigationBar from "../components/NavigationBar";
import { useEffect, useState } from "react";
import { getAllTrips } from "../firebase/daos/dao-trips";
import { Trip } from "../models/trip";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import dayjs from "dayjs";



function MyTrips() {

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // load trips from firebase

    async function loadTrips() {
      setLoading(true);
      getAllTrips().then((DBtrips) => {
        setTrips(DBtrips);
        console.log(DBtrips);
      }).catch((error) => {
        console.log(error);
        setError(true);
      });
      setLoading(false);
    }

    loadTrips();

  }, []);


  return (<>
    <NavigationBar />

    <Container className="d-flex flex-column align-items-center vh-100 content-padding-top" style={{ position: 'absolute'}}>

    <Container fluid className="position-relative d-flex flex-column align-items-center">

      <div className="position-absolute start-0 top-50 translate-middle-y px-md-5">
        <Link to="/" className="text-decoration-none text-dark">
          <FaArrowLeft size={36} />
        </Link>
      </div>

      <h1 className="text-center">My trips</h1>
    </Container>
      

      {
        (loading || trips.length === 0) && 
        <div className="d-flex flex-column justify-content-center align-items-center" style={{marginTop: "200px"}}>
          <Spinner animation="border" role="status" className="mb-4" />
          <h3>Loading...</h3>
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

      <Row className="d-flex flex-row justify-content-center w-100 mt-5">
        {

          trips.map((trip) => {
            console.log(trip);
            return (
              <Col xs={11} md={5} lg={3} className="mb-4">
                <Link to={`/trips/${trip.id}`} className="text-decoration-none">
                  <Card key={trip.id} className="text-center tripCard" style={{backgroundColor: "#ECF5E4"}}>
                      <div className="city-image-container">
                        <img src={trip.image} alt={`City: ${trip.city}`} className="city-image" />
                        <div className="gradient-overlay"></div>
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


    </Container>
    </>
  );
}

export default MyTrips;