import { Button, Container } from "react-bootstrap";
import { FaMapMarkedAlt, FaPlaneDeparture } from "react-icons/fa";
import { Link } from "react-router-dom";

function Homepage() {

    return (
      <>
      <div className="homepage vh-100 vw-100 px-0">
      <Container className="d-flex flex-column justify-content-center align-items-center w-100" >
        <h1 className="title"> Inclusive and Effortless Urban Travel </h1>
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
      </div>   
      </>
    );
  }


export default Homepage;