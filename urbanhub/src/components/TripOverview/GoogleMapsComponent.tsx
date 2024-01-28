import { GoogleMap, Marker, DirectionsRenderer,InfoWindow } from '@react-google-maps/api';
import dayjs from 'dayjs';
import React, { SetStateAction, useState } from 'react';
import { TripAttraction } from '../../models/tripAttraction';
import { Trip } from '../../models/trip';
import { Attraction } from '../../models/attraction';


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
    tripState: {
      value: Trip | null;
      setter: React.Dispatch<React.SetStateAction<Trip | null>>;
    };
  }

function GoogleMapsComponent(props : GoogleMapsComponentProps) {
    const {
        activeKeyState,
        cityPositionState,
        directionsState,
        defaultCenter,
        tripState,
      } = props;

      const [selectedMarker, setSelectedMarker] = useState<Attraction | null>(null);

      const renderMarkerForDay = (day: dayjs.Dayjs) => {
        let attractionsForDay: TripAttraction[] = [];
      
        // Find the closest matching key
        let closestKey: dayjs.Dayjs | null = null;
        let minDifference: number | null = null;
      
        tripState.value?.schedule.forEach((attractions, key) => {
          const difference = Math.abs(day.diff(key, 'days'));
      
          if (minDifference === null || difference < minDifference) {
            minDifference = difference;
            closestKey = key;
          }
        });
      
        if (closestKey !== null) {
          attractionsForDay = tripState.value?.schedule.get(closestKey) || [];
        }
        return attractionsForDay;
      };
      
      const dayLabels = Array.from(tripState.value?.schedule.keys() || []).map((day) => day.format('DD/MM/YYYY'));

    const zoomLevel = activeKeyState.value.length === 1 ? 15 : 10;

    return(<>
      <GoogleMap clickableIcons={false} mapContainerStyle={{ width: '100%', height: '65vh', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={activeKeyState.value.length === 0 ? cityPositionState.value : directionsState.value?.routes[0]?.legs[0]?.start_location } zoom={zoomLevel} onLoad={(map) => {}}>
        {(cityPositionState.value.lat !== defaultCenter.lat && cityPositionState.value.lng !== defaultCenter.lng && activeKeyState.value.length === 0 && <Marker position={cityPositionState.value} />)}             
        {activeKeyState.value.length === 1 && <DirectionsRenderer directions={directionsState.value} options={{ suppressMarkers: true }}/>}
        {cityPositionState.value.lat !== defaultCenter.lat && cityPositionState.value.lng !== defaultCenter.lng && activeKeyState.value.length > 0 && (
                    <>
                    {renderMarkerForDay(dayjs(dayLabels[parseInt(activeKeyState.value[0], 10)], 'DD/MM/YYYY')).map((attraction: Attraction, index: number) => {
                      return (
                        <Marker key={attraction.id} position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} label={{text:`${(index + 1).toString()}`,color:'white', fontWeight: 'bold'}} onClick={() => {selectedMarker === null ? setSelectedMarker(attraction) : setSelectedMarker(null)}}/>
                      );
                    })}
                  </>
                  )}
                  {selectedMarker && (
                    <InfoWindow options={{ pixelOffset: new google.maps.Size(0, -35) }} position={{ lat: selectedMarker.location.latitude, lng: selectedMarker.location.longitude }} onUnmount={() => setSelectedMarker(null)}  onCloseClick={() => setSelectedMarker(null)}>
                      <div>
                        <p>{selectedMarker.name}</p>
                      </div>
                    </InfoWindow>
                  )}
      </GoogleMap>
    </>);
}

export default GoogleMapsComponent;