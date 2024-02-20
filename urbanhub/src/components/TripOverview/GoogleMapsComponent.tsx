import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import dayjs from "dayjs";
import React, { SetStateAction, useEffect, useState } from "react";
import { TripAttraction } from "../../models/tripAttraction";
import { Trip } from "../../models/trip";
import { Attraction } from "../../models/attraction";
import { EuroCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { Image, Tag, Typography } from "antd";
import cities from "../../firebase/cities";

const { Title } = Typography;

const defaultAttractionImageUrl =
  "https://images.unsplash.com/photo-1416397202228-6b2eb5b3bb26?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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
  defaultCenter: {
    lat: number;
    lng: number;
  };
  directionsState: {
    value: DirectionsState;
    setter: React.Dispatch<SetStateAction<DirectionsState>>;
  };
  tripState: {
    value: Trip | null;
    setter: React.Dispatch<React.SetStateAction<Trip | null>>;
  };
  attractionCardHoveredID: {
    value: string | null;
    setter: React.Dispatch<React.SetStateAction<string | null>>;
  };
}

function GoogleMapsComponent(props: GoogleMapsComponentProps) {
  const {
    activeKeyState,
    cityPositionState,
    defaultCenter,
    directionsState,
    tripState,
    attractionCardHoveredID,
  } = props;

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Attraction | null>(null);
  const [markerClicked, setMarkerClicked] = useState<boolean>(false);

  const fetchImage = async (query: string) => {
    try {
      const response = await axios.get(
        "https://api.unsplash.com/search/photos",
        {
          params: {
            query,
            per_page: 1,
          },
          headers: {
            Authorization: `Client-ID 4rjvZvwzFuPY3uX3WAnf2Qb8eWkwvDys-sdsyvDdai0`,
          },
        }
      );

      if (response.data.results.length > 0) {
        return response.data.results[0].urls.regular;
      } else {
        console.log("No results from unsplash");
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  useEffect(() => {
    if (activeKeyState.value.length === 0) {
      return;
    }
    setImagesLoading(true);
    renderMarkerForDay(
      dayjs(dayLabels[parseInt(activeKeyState.value[0], 10)], "DD/MM/YYYY")
    ).forEach((attraction: Attraction) => {
      if (imageUrls[attraction.id]) return;

      fetchImage(attraction.name + ", " + tripState.value?.city).then((url) => {
        if (url) {
          setImageUrls((prev) => ({ ...prev, [attraction.id]: url }));
        } else {
          setImageUrls((prev) => ({
            ...prev,
            [attraction.id]: defaultAttractionImageUrl,
          }));
        }
      });
    });
    setImagesLoading(false);
  }, [activeKeyState.value.length, activeKeyState.value[0]]);

  useEffect(() => {
    if (activeKeyState.value.length === 0) {
      setSelectedMarker(null);
      return;
    }

    setSelectedMarker(null);
  }, [activeKeyState.value.length, activeKeyState.value[0]]);

  const renderMarkerForDay = (day: dayjs.Dayjs) => {
    let attractionsForDay: TripAttraction[] = [];

    // Find the closest matching key
    let closestKey: dayjs.Dayjs | null = null;
    let minDifference: number | null = null;

    tripState.value?.schedule.forEach((attractions, key) => {
      const difference = Math.abs(day.diff(key, "days"));

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

  const dayLabels = Array.from(tripState.value?.schedule.keys() || []).map(
    (day) => day.format("DD/MM/YYYY")
  );

  const zoomLevel = activeKeyState.value.length === 1 ? 15 : 10;

  useEffect(() => {
    if (attractionCardHoveredID.value) {
      const attraction = cities
        .find((city) => city.name === tripState.value?.city)
        ?.attractions.find(
          (attraction) => attraction.id === attractionCardHoveredID.value
        );
      if (attraction) {
        setSelectedMarker(attraction);
      }
    } else {
      setSelectedMarker(null);
    }
  }, [attractionCardHoveredID.value]);

  return (
    <>
      <GoogleMap
        clickableIcons={false}
        mapContainerStyle={{
          width: "100%",
          height: "65vh",
          borderRadius: "10px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
        }}
        center={
          activeKeyState.value.length === 0
            ? cityPositionState.value
            : directionsState.value?.routes[0]?.legs[0]?.start_location
        }
        zoom={zoomLevel}
        onLoad={(map) => {}}
        onClick={() => {setSelectedMarker(null); setMarkerClicked(false);}}
      >
        {cityPositionState.value.lat !== defaultCenter.lat &&
          cityPositionState.value.lng !== defaultCenter.lng &&
          activeKeyState.value.length === 0 && (
            <Marker
              position={cityPositionState.value}
              icon={{
                url: "https://imgur.com/HXGfoxe.png",
                scaledSize: new window.google.maps.Size(38, 38),
              }}
            />
          )}
        {activeKeyState.value.length === 1 && (
          <DirectionsRenderer
            directions={directionsState.value}
            options={{ suppressMarkers: true }}
          />
        )}
        {cityPositionState.value.lat !== defaultCenter.lat &&
          cityPositionState.value.lng !== defaultCenter.lng &&
          activeKeyState.value.length > 0 && (
            <>
              {renderMarkerForDay(
                dayjs(
                  dayLabels[parseInt(activeKeyState.value[0], 10)],
                  "DD/MM/YYYY"
                )
              ).map((attraction: Attraction, index: number) => {
                return (
                  <Marker
                    key={`${attraction.id}-${index}`}
                    position={{
                      lat: attraction.location.latitude,
                      lng: attraction.location.longitude,
                    }}
                    label={{
                      text: `${(index + 1).toString()}`,
                      color: "white",
                      fontWeight: "bold",
                    }}
                    icon={{
                      url: "https://imgur.com/gfrQTuH.png",
                      scaledSize: new google.maps.Size(38, 38),
                      labelOrigin: new google.maps.Point(19, 16),
                    }}
                    onMouseOver={() => {
                      if(!markerClicked){
                        setSelectedMarker(attraction);
                      }
                    }}
                    onMouseOut={() => {
                      if(!markerClicked){
                        setSelectedMarker(null);
                      }
                    }}
                    onClick={() => {
                      setMarkerClicked(true);
                      setSelectedMarker(attraction);
                    }}
                  />
                );
              })}
            </>
          )}
        {activeKeyState.value.length > 0 &&
          selectedMarker &&
          !imagesLoading && (
            <InfoWindow
              options={{ pixelOffset: new google.maps.Size(0, -35), disableAutoPan: true }}
              position={{
                lat: selectedMarker.location.latitude,
                lng: selectedMarker.location.longitude,
              }}
              onCloseClick={() => {
                setMarkerClicked(false);
                setSelectedMarker(null);
              }}
            >
              <div className="attractionContainer">
                <Image
                  className="attractionImage"
                  src={imageUrls[selectedMarker.id] || defaultAttractionImageUrl}
                  alt={selectedMarker.name}
                  preview={false}
                />
                <Title
                  level={5}
                  className="attractionName"
                  style={{ fontWeight: "bold", textAlign: 'center' }}
                >
                  {selectedMarker.name}
                </Title>
                <Tag
                  icon={<EuroCircleOutlined />}
                  color="green"
                  style={{
                    gridColumn: "1",
                    gridRow: "2",
                    display: "inline-block",
                    maxWidth: "60px",
                  }}
                >
                  {" "}
                  {selectedMarker.perPersonCost
                    ? selectedMarker.perPersonCost *
                      (tripState!.value!.nAdults + tripState!.value!.nChildren)
                    : "free"}
                </Tag>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>
    </>
  );
}

export default GoogleMapsComponent;
