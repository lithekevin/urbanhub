import { Layout, Row, Col } from 'antd';

const { Footer } = Layout;  

function FooterComponent() {
    return (
        <Footer className='footer-style'>
        <Row justify="space-between">
          <Col xs={24} sm={24} md={11}>
            <p>Course: Human Computer Interaction - Politecnico di Torino</p>
            <p>Academic year: 2023/2024</p>
          </Col>
          <Col xs={24} sm={24} md={11}>
            <p>Students: Alessandro Bianco, Elia Ferraro, Kevin Gjeka, Sylvie Molinatto</p>
            <p>Professors: Luigi De Russis, Tommaso Calò, Alberto Monge Roffarello</p>
          </Col>
        </Row>
        <Row justify="center" style={{background: 'black', padding: 0, color: 'white'}}>
        <Col>
          <p>All rights reserved &copy; 2023</p>
        </Col>
      </Row>
      </Footer>
    );
}

export default FooterComponent;