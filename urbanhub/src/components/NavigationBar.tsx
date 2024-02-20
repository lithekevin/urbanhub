import { PiUserCircleFill } from "react-icons/pi";
import { Col, Image, Layout, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Title, Text } = Typography;

function NavigationBar() {
  return (
    <Header className="header-style">
    <Row justify="space-between" align="middle" style={{ width: "100%" }}>
      <Col>
        <Link to="/" style={{ textDecoration: 'none', color: 'black', display: "flex", alignItems: "center" }}>
          <Image src="/logo(1).png" alt="logo" style={{ width: '50px', marginRight: '5px', marginBottom: '4px' }} preview={false}/>
          <Title 
            style={{ marginBottom: 0, marginTop: '6px', position: 'relative', top: '-3px', fontWeight: '600', fontSize: '36px', backgroundImage: 'radial-gradient(circle, #00AA70, #00987e, #008483, #00707e, #185b6f, #2f4858)', color: 'transparent', backgroundClip: 'text' }}
          >UrbanHUB</Title>
        </Link>
      </Col>
      <Col>
        <div className="d-flex align-items-center">
          <PiUserCircleFill style={{ fontSize: '35px', color: "black", marginRight: '5px' }} />
          <Text className="userInfo" style={{ marginBottom: 0}}>Mario Rossi</Text>
        </div>
      </Col>
    </Row>
  </Header>
);
}

export default NavigationBar;