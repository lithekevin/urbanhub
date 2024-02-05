import { PiUserCircleFill } from "react-icons/pi";
import { Col, Flex, Image, Layout, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Title, Text } = Typography;

function NavigationBar() {
  return (
    <Header className="header-style">
    <Row justify="space-between" align="middle" style={{ width: "100%" }}>
      <Col>
        <Link to="/" style={{ textDecoration: 'none', color: 'black', display: "flex", alignItems: "center" }}>
          <Image src="/smart-city.png" alt="logo" style={{ width: '50px', marginRight: '10px' }} preview={false}/>
          <Title level={1} className="projectName" style={{ marginBottom: 0 }}>UrbanHub</Title>
        </Link>
      </Col>
      <Col>
        <div className="d-flex align-items-center">
          <PiUserCircleFill style={{ fontSize: '35px', color: "black", marginRight: '10px' }} />
          <Text className="userInfo" style={{ marginBottom: 0}}>Mario Rossi</Text>
        </div>
      </Col>
    </Row>
  </Header>
);
}

export default NavigationBar;