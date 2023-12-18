import { Button, Container } from "react-bootstrap";
import NavigationBar from "../components/NavigationBar";
import { FaMapMarkedAlt, FaPlaneDeparture } from "react-icons/fa";
import { Link } from "react-router-dom";

function Homepage() {
    return (
      <>
      
      <NavigationBar/>

      <Container className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ position: 'absolute'}}>
      
        <Link to='/newtrip' className="text-decoration-none text-white w-50">
          <Button className="w-100 mb-5 homepageButton">
            <FaPlaneDeparture className="me-2"/>
            Start a new trip
          </Button>
        </Link>

        <Link to='/mytrips' className="text-decoration-none text-white w-50">
          <Button className="w-100 mb-5 homepageButton">
            <FaMapMarkedAlt className="me-2"/>
            See my trips
          </Button>
        </Link>

      </Container>      
      </>
    );
  }


export default Homepage;