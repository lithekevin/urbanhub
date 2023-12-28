import { CollapseProps, Timeline, Collapse, Layout, Row, Col, Button, Space } from 'antd';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Container } from "react-bootstrap";
import { useState } from 'react';
import { Input } from 'antd';



//TODO: RICORDARSI DI METTERE DUE MODALITA' UNA READONLY E UNA EDITABLE

function TripOverview() {
  const containerStyle = {
    width: '100%',
    height: '100%',
  };
  
  const center = {
    lat: -34.397,
    lng: 150.644,
  };
  
  const GoogleMapComponent: React.FC = () => {
    return (
      <LoadScript googleMapsApiKey="AIzaSyDYwrQtanLbPehi6huH0sY0FMnvHo4Tg1w" language="en">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    );
  };

  return (
    <>
      <h1 className="text-center">TRIP OVERVIEW</h1>
      <div style={{ minHeight: 'calc(100vh - 30px)', position: 'relative' }}>
        <Container className="d-flex align-items-stretch" style={{ height: '100%' }}>
          <div style={{ flex: '0 0 25%', height: '100%' }}>
            <Sidebar />
          </div>
          <div style={{ flex: '0 0 75%', height: '100%' }}>
            <Container fluid className="position-relative d-flex flex-column align-items-center" style={{ height: '100%' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <GoogleMapComponent />
              </div>
            </Container>
          </div>
        </Container>
      </div>
      <footer style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center'}}>
        <Footer />
      </footer>
    </>
  );
};
  

function Sidebar() {
     //TODO: Invece di avere attrazioni fisse, caricarle da firebase

     const attractions = [
        [{children: 'Attraction 1.1',}, {children: 'Attraction 1.2',}, {children: 'Attraction 1.3',}, {children: 'Attraction 1.4'}],
        [{children: 'Attraction 2.1',}, {children: 'Attraction 2.2',}, {children: 'Attraction 2.3',}],
        [{children: 'Attraction 3.1',}, {children: 'Attraction 3.2',}, {children: 'Attraction 3.3',}, {children: 'Attraction 3.4'}, {children: 'Attraction 3.5'}],
      ];

      const dayLabels = ["12/05/2024","13/05/2024","14/05/2024"];

      const dailyActivities: CollapseProps['items'] = [
        {
          key: '1',
          label: dayLabels[0],
          children: <Timeline items={attractions[0]} />,
        },
        {
          key: '2',
          label: dayLabels[1],
          children: <Timeline items={attractions[1]} />,
        },
        {
          key: '3',
          label: dayLabels[2],
          children: <Timeline items={attractions[2]} />,
        },
      ];

    return (<>
      <div style={{ marginBottom: '30px' }}>
        <Container fluid className="position-relative d-flex flex-column align-items-left">
          <h3>City name</h3>
        </Container>
      </div>
      <div>
      <Collapse size="large" items={dailyActivities} defaultActiveKey={['1']} accordion={true} />
      </div>
      </>);
  };

  function Footer() {
    const { Footer } = Layout;
    const { TextArea } = Input;

    const [message, setMessage] = useState('Is there anything I can do for you?');
    const [undoVisibility, setUndoVisibility] = useState(false);

    const updateMessage = (msg: string) => {
      setMessage(msg);
    };

    const handleUndoClick = () => {
      setUndoVisibility(false);
      setMessage('Operation undone, is there anything else I can do for you?');
    };

    const handleSendClick = () => {
      setUndoVisibility(true);
      updateMessage('Here is the proposed solution to your problem');
    };

    return (
      <Footer className='footer-style' style={{ backgroundColor: '#f0f0f0' }}>
      <Row justify="space-between">
        <Col xs={24} sm={24} md={11}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
            <img src={"/robotassistant.png"} alt="UrbanHub assistant" style={{ width: 'auto', height: '70px', marginRight: '10px' }} />
            <div style={{ flex: '1', position: 'relative', backgroundColor: '#fff', padding: '10px', borderRadius: '10px' }}>
              <div style={{ position: 'absolute', top: '50%', left: '-10px', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '10px solid #fff' }} />
              <p>{message}</p>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={24} md={11}>
          <Space.Compact style={{ width: '100%' }}>
            <TextArea placeholder="Ask something to UrbanHub..." autoSize={{ minRows: 1, maxRows: 3 }} />
            <Button type="primary" onClick={handleSendClick}>Send</Button>
            {undoVisibility && (<Button type="primary" onClick={handleUndoClick}>Undo</Button>)}
          </Space.Compact>
        </Col>
      </Row>
    </Footer>
  );
  };

export default TripOverview;