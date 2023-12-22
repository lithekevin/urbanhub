import { PiUserCircleFill } from "react-icons/pi";
import { Layout, Row, Col } from 'antd';

const { Header } = Layout;

function NavigationBar() {
  return (
    <Header className="header-style">
      <Row justify="space-between" align="middle">
        <Col>
          <div className="d-flex align-items-center">
            <img src="/smart-city.png" alt="logo" width="50" height="50" className="d-inline-block align-top"/>
            <span className="projectName">UrbanHub</span>
          </div>
        </Col>
        <Col>
          <div className="d-flex align-items-center">
            <PiUserCircleFill style={{ fontSize: '35px', color: "black" }} />
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