import { PiUserCircleFill } from "react-icons/pi";
import { Layout, Row, Col, Image } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;

function NavigationBar() {
  return (
    <Header className="header-style">
      <Row justify="space-between" align="middle">
        <Col>
          <div className="d-flex align-items-center">
          <Link to="/" style={{ textDecoration: 'none', color: 'black' }}>
              <Image src="/smart-city.png" alt="logo" style={{ width: '50px', marginBottom: '23px'}} preview={false}/>
              <span className="projectName">UrbanHub</span>
          </Link>
          </div>
        </Col>
        <Col>
          <div className="d-flex align-items-center">
            <PiUserCircleFill style={{ fontSize: '35px', color: "black", marginBottom: '20px' }} />
            <span className="userInfo">
              Mario Rossi
            </span>
          </div>
        </Col>
      </Row>
    </Header>
  );
}

export default NavigationBar;