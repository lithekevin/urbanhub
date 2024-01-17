import React, { useEffect, useState } from 'react';
import { Form, AutoComplete, Row, Col, Button, Typography } from 'antd';
import { GoogleMap, Marker } from '@react-google-maps/api';
import cities from '../../firebase/cities';
import { DEFAULT_LOCATION } from '../../pages/NewTrip';
import { set } from 'lodash';

const { Title, Paragraph } = Typography;




interface CustomEvent {
  target: {
    name: string;
    value: string | [string, string] | number;
  };
}

interface Step0Props {
    isDestinationSelected: boolean;
    setIsDestinationSelected: React.Dispatch<React.SetStateAction<boolean>>;
    isDestinationValid: boolean;
    setIsDestinationValid: React.Dispatch<React.SetStateAction<boolean>>;
    cityPosition: { lat: number; lng: number; };
    setCityPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number; }>>;
    mapZoom: number;
    setMapZoom: React.Dispatch<React.SetStateAction<number>>;
    formData: { destination: string;}; 
    handleInputChange: (e: CustomEvent) => void;
    step: number;
    nextStep: () => void;
}

const Step0: React.FC<Step0Props> = ({
  isDestinationSelected,
  setIsDestinationSelected,
  isDestinationValid,
  setIsDestinationValid,
  cityPosition,
  setCityPosition,
  mapZoom,
  setMapZoom,
  handleInputChange,
  formData,
  step,
  nextStep
}) => {

  const [showMarker, setShowMarker] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null); 

  const [mapLoaded, setMapLoaded] = useState(false);

useEffect(() => {
  if (mapLoaded && cityPosition) {
    const timer = setTimeout(() => {
      setShowMarker(true);
    }, 500); // Imposta un ritardo di 1 secondo

    // Pulisci il timer quando il componente si smonta o quando mapLoaded o cityPosition cambiano
    return () => clearTimeout(timer);
  }
}, [mapLoaded, cityPosition]);

console.log("mapZoom: ", mapZoom)

  const handleDestinationChange = (value: string) => {
    
    handleInputChange({ target: { name: 'destination', value } } as CustomEvent);

    setIsDestinationSelected(value !== '');

    const isMatch = value && cities.map((city) => city.name).some((suggestion) => suggestion.toLowerCase() === value.toLowerCase());
    setIsDestinationValid(!!isMatch);

    if (isMatch) {
      const selectedCity = cities.find((city) => city.name.toLowerCase() === value.toLowerCase());
      setCityPosition({
        lat: selectedCity?.location.latitude || DEFAULT_LOCATION.lat,
        lng: selectedCity?.location.longitude || DEFAULT_LOCATION.lng,
      });
      setMapZoom(7);
      console.log("Match is done and the zoom is set to 7");
    } else {
      setCityPosition({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
      setMapZoom(3);
    }
  };

  const isStepValid = () => {
    return isDestinationSelected && isDestinationValid;
  };

  return (
    <>
      <div className='form-container'>
        <Title level={2} className='step-title'> Choose your trip destination </Title>
        <Paragraph className='label'> Where would you want to go? </Paragraph>
        <Form.Item
          hidden={step !== 0}
          validateStatus={isDestinationValid ? 'success' : 'error'}
          help={!isDestinationValid && 'Please type a valid city'}
          style={{ width: '100%' }}
        >
          <AutoComplete
            options={cities.map((city) => ({ value: city.name })).sort((a, b) => a.value.localeCompare(b.value))}
            placeholder="Type a city"
            filterOption={(inputValue, option) => {
              return option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1;
            }}
            value={formData.destination || ''}
            onChange={(value) => { handleDestinationChange(value ? (value.charAt(0).toUpperCase() + value.slice(1)) : '');}}
            allowClear={true}
          />
        </Form.Item>
        <Form.Item>
          <Row className='mt-5'>
            <Col span={24}>
              <GoogleMap
                key={step}
                mapContainerStyle={{ width: '100%', height: '300px', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                center={cityPosition}
                zoom={mapZoom}
                
                onLoad={(map) => {
                  setMapLoaded(true);
                  
                  
                  map.addListener('zoom_changed', () => {
                    const currentZoom = map.getZoom();
                    setMapZoom(currentZoom || 3);
                  });
                }}
                              
                
                >
               { // Non-selected markers
                  showMarker && 
                  cities.filter((city) => !formData.destination || !(city.name.toLowerCase() === formData.destination.toLowerCase())).map((city) => (
                    <Marker key={city.name} position={{ lat: city.location.latitude, lng: city.location.longitude }} title={city.name} opacity={city.name === hoveredMarker ? 0.8 : 0.5} onMouseOver={() => {setHoveredMarker(city.name)}} onMouseOut={() => {setHoveredMarker(null)}} onClick={() => {handleDestinationChange(cities.find((c) => c.location.latitude === city.location.latitude && c.location.longitude === city.location.longitude)!!.name)}}/>
                  ))
                }
                
                { // Selected marker
                showMarker && formData.destination && cityPosition.lat !== DEFAULT_LOCATION.lat && cityPosition.lng !== DEFAULT_LOCATION.lng && (
                  <Marker position={cityPosition} title={formData.destination} opacity={1.0}/>
                )}
              </GoogleMap>
            </Col>
          </Row>
        </Form.Item>
        <div className="mb-2 d-flex align-items-center justify-content-center">
          <Button type='primary' onClick={nextStep} className="button" htmlType="submit" disabled={!isStepValid()}>
                  Next
          </Button>
        </div>
      </div>
    </>
  );
};

export default Step0;