import React, { useEffect, useState } from "react";
import { AutoComplete, Button, Col, Form, Image, Row, Spin, Tooltip, Typography } from "antd";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import cities from "../../firebase/cities";
import { DEFAULT_LOCATION } from "../../pages/NewTrip";

const { Paragraph, Text, Title } = Typography;

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
  cityPosition: { lat: number; lng: number };
  setCityPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
  mapZoom: number;
  setMapZoom: React.Dispatch<React.SetStateAction<number>>;
  formData: { destination: string };
  handleInputChange: (e: CustomEvent) => void;
  step: number;
  nextStep: () => void;
}

function Step0(props: Step0Props) {
  
  const { isDestinationSelected, setIsDestinationSelected, isDestinationValid, setIsDestinationValid, 
          cityPosition, setCityPosition, mapZoom, setMapZoom, formData, handleInputChange, step, nextStep } = props;
  const [showMarker, setShowMarker] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (mapLoaded && cityPosition) {
      const timer = setTimeout(() => {
        setShowMarker(true);
      }, 500); // Imposta un ritardo di 1 secondo

      // Pulisci il timer quando il componente si smonta o quando mapLoaded o cityPosition cambiano
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, cityPosition]);

  const handleDestinationChange = (value: string) => {
    handleInputChange({
      target: { name: "destination", value },
    } as CustomEvent);

    setIsDestinationSelected(value !== "");

    const isMatch =
      value &&
      cities
        .map((city) => city.name)
        .some((suggestion) => suggestion.toLowerCase() === value.toLowerCase());
    setIsDestinationValid(!!isMatch);

    if (isMatch) {
      const selectedCity = cities.find(
        (city) => city.name.toLowerCase() === value.toLowerCase()
      );
      setCityPosition({
        lat: selectedCity?.location.latitude ?? DEFAULT_LOCATION.lat,
        lng: selectedCity?.location.longitude ?? DEFAULT_LOCATION.lng,
      });
      setMapZoom(9);
    } else {
      setCityPosition({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
      setMapZoom(2);
    }
  };

  const isStepValid = () => {
    return isDestinationSelected && isDestinationValid;
  };

  return (
    <>
    { (!mapLoaded || !showMarker) && (
      <Spin size="large" fullscreen/>
    )}
    <Row>
      <Col span={5}></Col>
      <Col span={14}>
        <div className="form-container">
          <Title level={3} className="step-title">
            {" "}
            Choose your trip destination{" "}
          </Title>
          <Paragraph style={{color: 'red'}}>*<Text className='label'> Where would you want to go? </Text></Paragraph>
          <Form.Item
            validateStatus={isDestinationValid ? "success" : "error"}
            help={
              (!isDestinationValid || !isDestinationSelected) &&
              "Please type or select on the map a valid city"
            }
            style={{ width: "100%" }}
          >
            <AutoComplete
              options={cities
                .map((city) => ({ value: city.name }))
                .sort((a, b) => a.value.localeCompare(b.value))}
              placeholder="Type a city"
              filterOption={(inputValue, option) => {
                return (
                  option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                  -1
                );
              }}
              value={formData.destination || ""}
              onChange={(value) => {
                handleDestinationChange(
                  value ? value.charAt(0).toUpperCase() + value.slice(1) : ""
                );
              }}
              allowClear={true}
            />
          </Form.Item>
          <Form.Item>
            <Row className="mt-3">
              <Col span={24}>
                <GoogleMap
                  key={step}
                  mapContainerStyle={{
                    width: "100%",
                    height: "375px",
                    borderRadius: "10px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                  }}
                  center={cityPosition}
                  zoom={mapZoom}
                  onLoad={(map) => {
                    setMapLoaded(true);
                    map.addListener("zoom_changed", () => {
                      const currentZoom = map.getZoom();
                      setMapZoom(currentZoom ?? 3);
                    });
                  }}
                >
                  {
                    showMarker &&
                      cities
                        .filter(
                          (city) =>
                            !formData.destination ||
                            city.name.toLowerCase() !==
                              formData.destination.toLowerCase()
                        )
                        .map((city) => (
                          <React.Fragment key={city.name}>
                            <Marker
                              position={{
                                lat: city.location.latitude,
                                lng: city.location.longitude,
                              }}
                              title={city.name}
                              opacity={city.name === hoveredMarker ? 0.8 : 0.5}
                              icon={{
                                url: "https://imgur.com/HXGfoxe.png",
                                scaledSize: new window.google.maps.Size(38, 38),
                              }}
                              onMouseOver={() => {
                                setHoveredMarker(city.name);
                              }}
                              onMouseOut={() => {
                                setHoveredMarker(null);
                              }}
                              onClick={() => {
                                handleDestinationChange(
                                  cities.find(
                                    (c) =>
                                      c.location.latitude ===
                                        city.location.latitude &&
                                      c.location.longitude === city.location.longitude
                                  )!!.name
                                );
                                setHoveredMarker(null);
                              }}
                            />
                            {city.name === hoveredMarker && (
                              <InfoWindow
                                options={{ pixelOffset:  new google.maps.Size(0, -35), disableAutoPan: true }}
                                position={{
                                  lat: city.location.latitude,
                                  lng: city.location.longitude,
                                }}
                                
                              >
                                <div className={`citiesMapMarkerHoveredContainer`}>
                                  <Image src={city.image} alt={city.name} className="citiesMapMarkerHoveredImage" preview={false}/>
                                  <Title level={5} style={{textAlign: 'center'}}>{city.name}</Title>
                                </div>
                              </InfoWindow>
                            )}
                          </React.Fragment>
                        ))
                  }

                  {
                    // Selected marker
                    showMarker &&
                    formData.destination &&
                    cityPosition.lat !== DEFAULT_LOCATION.lat &&
                    cityPosition.lng !== DEFAULT_LOCATION.lng && (
                      <Marker
                        position={cityPosition}
                        title={formData.destination}
                        opacity={1.0}
                        icon={{ url: "https://imgur.com/HXGfoxe.png", scaledSize: new window.google.maps.Size(38, 38) }}
                      />
                    )
                  }
                </GoogleMap>
              </Col>
            </Row>
            <Row className="d-flex justify-content-start mt-2" style={{color: "red"}}>
              <small>* This field is mandatory</small>
            </Row>
          </Form.Item>
          <div className="mb-2 d-flex align-items-center justify-content-center">
            <Tooltip title={!isStepValid() ? "Please select a valid destination" : ""} placement="right">
              <Button
                type="primary"
                onClick={nextStep}
                className="button"
                htmlType="submit"
                disabled={!isStepValid()}
              >
                Next
              </Button>
            </Tooltip>
          </div>
        </div>
      </Col>
      <Col span={5}></Col>
    </Row>
    </>
  );
};

export default Step0;
