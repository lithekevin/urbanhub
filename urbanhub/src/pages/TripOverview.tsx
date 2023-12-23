import { Timeline } from 'antd';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Container } from "react-bootstrap";

//TODO: RICORDARSI DI METTERE DUE MODALITA' UNA READONLY E UNA EDITABLE


function TripOverview() {
  const containerStyle = {
    width: '800px',
    height: '500px',
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
      <Container className="d-flex align-items-stretch content-padding-top">
        <div style={{ flex: '0 0 25%' }}>
          <Sidebar />
        </div>
        <div style={{ flex: '0 0 75%' }}>
          <Container fluid className="position-relative d-flex flex-column align-items-center">
            <h1 className="text-center" style={{ marginBottom: '30px' }}>TRIP OVERVIEW</h1>
            <GoogleMapComponent />
          </Container>
        </div>
      </Container>
    );
  }

function Sidebar() {
     //TODO: Invece di avere attrazioni fisse, caricarle da firebase
     const attractions = [
        {
          children: 'Attraction 1',
        },
        {
          children: 'Attraction 2',
        },
        {
          children: 'Attraction 3',
        },
        {
          children: 'Attraction 4',
        },
      ];

    return (<>
      <div style={{ marginBottom: '30px' }}>
        <Container fluid className="position-relative d-flex flex-column align-items-left">
          <h3>City name</h3>
        </Container>
      </div>
      <div>
        <Timeline items={attractions} />
      </div>
      </>);
  };

export default TripOverview;