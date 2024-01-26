import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import React, { SetStateAction } from 'react';


interface CityPosition {
    lat: number;
    lng: number;
  }
  
  interface DirectionsState {
    geocoded_waypoints: any[]; // You might want to create a more specific type for this
    routes: any[]; // You might want to create a more specific type for this
    status: string;
  }
  
  interface GoogleMapsComponentProps {
    activeKeyState: {
      value: string | string[];
      setter: React.Dispatch<SetStateAction<string | string[]>>;
    };
    cityPositionState: {
      value: CityPosition;
      setter: React.Dispatch<SetStateAction<CityPosition>>;
    };
    directionsState: {
      value: DirectionsState;
      setter: React.Dispatch<SetStateAction<DirectionsState>>;
    };
    defaultCenter: {
        lat: number;
        lng: number;
      };
  }

function GoogleMapsComponent(props : GoogleMapsComponentProps) {
    const {
        activeKeyState,
        cityPositionState,
        directionsState,
        defaultCenter,
      } = props;

    const zoomLevel = activeKeyState.value.length === 1 ? 15 : 10;

    return(<>
      <GoogleMap mapContainerStyle={{ width: '100%', height: '65vh', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={
    activeKeyState.value.length === 0
      ? cityPositionState.value
      : directionsState.value?.routes[0]?.legs[0]?.start_location
  } zoom={zoomLevel} onLoad={(map) => {}}>
        {(cityPositionState.value.lat !== defaultCenter.lat && cityPositionState.value.lng !== defaultCenter.lng && activeKeyState.value.length === 0 && <Marker position={cityPositionState.value} />)}             
        {activeKeyState.value.length === 1 && <DirectionsRenderer directions={directionsState.value}/>}
      </GoogleMap>
    </>);
}

export default GoogleMapsComponent;