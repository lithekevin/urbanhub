import { Timeline } from 'antd';
import type { CollapseProps } from 'antd';
import { Collapse } from 'antd';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Container } from "react-bootstrap";
import { useState } from 'react';

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

  return (<>
    <h1 className="text-center" >TRIP OVERVIEW</h1>
    <Container className="d-flex align-items-stretch content-padding-top" style={{ height: '100vh' }}>
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
    </>);
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

export default TripOverview;