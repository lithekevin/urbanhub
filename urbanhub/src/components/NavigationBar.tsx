import { Navbar, Container, Row } from "react-bootstrap";

function NavigationBar() {
    return (
        <Navbar expand="md" id="navbar">
            <Container fluid className="px-md-5">
                <Navbar.Brand href="/" style={{fontSize: '50px'}}>URBANHUB</Navbar.Brand>
                <Navbar.Toggle/>
                <Navbar.Collapse className="justify-content-end">
                    <Row className="d-flex flex-row justify-content-center">
                        <Navbar.Text className="text-center">
                            Mario Rossi
                        </Navbar.Text>
                    </Row>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;