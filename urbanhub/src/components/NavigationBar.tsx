import { Navbar, Container, Row } from "react-bootstrap";
import { PiUserCircleFill } from "react-icons/pi";

function NavigationBar() {
  return (
    <Navbar expand="md" id="navbar">
      <Container fluid className="px-md-5">
        <div className="d-flex align-items-center">
          <img src="/smart-city.png" alt="logo" width="50" height="50" className="d-inline-block align-top"/>
          <Navbar.Brand href="/" style={{ fontSize: '30px', marginLeft: '10px' }}>UrbanHub</Navbar.Brand>
        </div>
        <Row className="d-flex flex-row justify-content-center">
          <PiUserCircleFill style={{ fontSize: '35px' }} />
          <Navbar.Text className="text-center" style={{ padding: '0' }}>
            Mario Rossi
          </Navbar.Text>
        </Row>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;