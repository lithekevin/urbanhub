import { GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import React, { Dispatch, SetStateAction } from 'react';


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

    return(<>
      <GoogleMap mapContainerStyle={{ width: '100%', height: '400px', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={
    activeKeyState.value.length === 0
      ? cityPositionState.value
      : directionsState.value?.routes[0]?.legs[0]?.start_location
  } zoom={10} onLoad={(map) => {}}>
        {(cityPositionState.value.lat !== defaultCenter.lat && cityPositionState.value.lng !== defaultCenter.lng && activeKeyState.value.length === 0 && <Marker position={cityPositionState.value} />)}             
        {activeKeyState.value.length === 1 && <DirectionsRenderer directions={directionsState.value}/>}
        {/* MARKERS NO MORE NEEDED, ALREADY INCLUDED IN PATH
                  {cityPosition.lat !== defaultCenter.lat && cityPosition.lng !== defaultCenter.lng && activeKey.length > 0 && (
                    <>
                    {renderMarkerForDay(dayjs(dayLabels[parseInt(activeKey[0], 10)], 'DD/MM/YYYY')).map((attraction, index) => {
                      return (
                        (cityPosition.lat !== defaultCenter.lat && cityPosition.lng !== defaultCenter.lng&& <Marker key={attraction.id} position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} label={(index + 1).toString()}/>)
                        
                      );
                    })}
                  </>
                  )}
                  */}
      </GoogleMap>
    </>);
}

export default GoogleMapsComponent;