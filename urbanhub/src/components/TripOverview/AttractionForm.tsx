import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Modal, Form, DatePicker, Image, TimePicker, Button, AutoComplete, Typography, Tag } from 'antd';
import { CloseSquareFilled, EuroCircleOutlined } from '@ant-design/icons';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Attraction } from '../../models/attraction';
import { addAttractionToTrip, editAttraction } from '../../firebase/daos/dao-trips';
import { Trip } from '../../models/trip';
import { TripAttraction } from '../../models/tripAttraction';
import cities from "../../firebase/cities";
import dayjs, { Dayjs } from 'dayjs';
import { MessageInstance } from 'antd/es/message/interface';

const { Title, Paragraph } = Typography;

interface AttractionFormProps {
  cityPosition: { lat: number, lng: number };
  defaultAttractionImageUrl: string;
  editingAttraction: TripAttraction | null;
  form: any;
  imageUrl: string | null;
  isFormVisible: boolean;
  trip: Trip | null;
  selAttraction: Attraction | null | undefined;
  selectedAttractionId: string | null;
  selectedDay: Dayjs | null;
  selectedMarker: Attraction | null;
  messageApi: MessageInstance;
  contextHolder: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingAttraction: React.Dispatch<React.SetStateAction<TripAttraction | null>>;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>;
  setMessageAI: React.Dispatch<React.SetStateAction<string>>;
  setSelectedAttractionId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedMarker: React.Dispatch<React.SetStateAction<Attraction | null>>;
  setUndoVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  setValidSelection: React.Dispatch<React.SetStateAction<boolean>>;
  tripId: string | undefined;
  validSelection: boolean;
  zoomLevel: number;
  modifiedByChatbot: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

function AttractionForm(props: AttractionFormProps) {

  const { cityPosition, contextHolder, defaultAttractionImageUrl, editingAttraction, form, imageUrl, isFormVisible, trip,
    selAttraction, selectedAttractionId, selectedDay, selectedMarker, setDirty, setEditingAttraction,
    setIsFormVisible, setMap, setMessageAI, setSelectedAttractionId, setSelectedMarker, setUndoVisibility,
    setValidSelection, tripId, validSelection, zoomLevel, messageApi,modifiedByChatbot } = props;

  const [showParagraph, setShowParagraph] = useState(false);
  const [markerClicked, setMarkerClicked] = useState<boolean>(false);
  const [startTime, setStartTime] = useState(null); // State variable to store the selected start time

  const handleStartTimeChange = (value: any) => {
    setStartTime(value); // Update the selected start time
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingAttraction(null);
    setSelectedAttractionId(null);
    setShowParagraph(false);
    setSelectedMarker(null);
    setMarkerClicked(false);
    setStartTime(null);
  };

  const onFinish = (values: any) => {
    const attraction = {
      id: selectedAttractionId,
      startDate: values.startTime.format('HH:mm'),
      endDate: values.endTime.format('HH:mm'),
    };

    if (editingAttraction) {

      if (tripId && selectedDay) {
        editAttraction(tripId, editingAttraction.id, selectedDay, values.date.format('DD/MM/YYYY'), attraction);
        modifiedByChatbot.setter(true);
        setMessageAI("Is there anything I can do for you?");
        setUndoVisibility(false);
        // Show success message
        messageApi.open({
          type: 'success',
          content: 'Attraction edited successfully!',
          duration: 3,
          style: {
            marginTop: '70px',
          },
        });
      }
      else {
        console.log("error");
        // Show error message
        messageApi.open({
          type: 'error',
          content: 'Error while editing attraction!',
          duration: 3,
          style: {
            marginTop: '70px',
          },
        });
      }
    }

    else {
      if (tripId) {
        addAttractionToTrip(tripId, values.date.format('DD/MM/YYYY'), attraction);
        setUndoVisibility(false);
        // Show success message
        messageApi.open({
          type: 'success',
          content: 'Attraction added successfully!',
          duration: 3,
          style: {
            marginTop: '70px',
          },
        });
      }
    }

    setDirty(true);
    modifiedByChatbot.setter(true);
    setEditingAttraction(null);
    setIsFormVisible(false);
    setSelectedAttractionId(null);
    setShowParagraph(false);
  };

  return (
    <>
      {contextHolder}
      <Modal open={isFormVisible} onCancel={closeForm} footer={null} centered width={1000}>
        <Form form={form} name={"formName"} layout="vertical" onFinish={(values) => onFinish(values)}>
          <Title level={3} className='step-title'> {editingAttraction ? "Edit Attraction" : "Add Attraction"} </Title>
          <Row>
            <Col>
              <Form.Item name="attraction" label="Attraction" rules={[{ required: true, message: 'Please select one of the attractions in the map, or type the name!' }]} style={{ marginBottom: '10px' }}>
                <AutoComplete
                  options={cities.find(city => city.name === trip?.city)?.attractions.map(attraction => ({ value: attraction.name }))}
                  placeholder="Type an attraction"
                  style={{ width: '100%' }}
                  allowClear={{ clearIcon: <CloseSquareFilled /> }}
                  onClear={() => {
                    form.setFieldsValue({ attraction: '' });
                    setValidSelection(false);
                    setSelectedAttractionId(null);
                  }}
                  filterOption={(inputValue, option) =>
                    option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  onSelect={(value) => {
                    const selectedAttraction = cities.find(city => city.name === trip?.city)?.attractions.find(attraction => attraction.name === value);
                    if (selectedAttraction) {
                      setSelectedAttractionId(selectedAttraction.id);
                      setValidSelection(true);
                      setShowParagraph(true);
                    }
                  }}
                  onBlur={() => {
                    if (form.getFieldValue('attraction') !== selAttraction?.name) {
                      form.setFieldsValue({ attraction: '' });
                      setValidSelection(false);
                      setSelectedAttractionId(null);
                      form.validateFields(['attraction']);
                    }
                  }}

                />
              </Form.Item>
              {selectedAttractionId && validSelection && cities.find(city => city.name === trip?.city)!.attractions.find(attraction => attraction.id === selectedAttractionId) && showParagraph &&
                <Paragraph style={{ color: "var(--hard-background-color)", marginTop: '0', marginBottom: '10px' }}>This attraction will add a cost of {cities.find(city => city.name === trip?.city)!.attractions.find(attraction => attraction.id === selectedAttractionId)!.perPersonCost * (trip!.nAdults + trip!.nChildren)}{" € to your trip."}</Paragraph>
              }
              <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Please choose the date!' }]} style={{ marginBottom: '10px' }}>
                <DatePicker format="DD/MM/YYYY"
                  disabledDate={(current) =>
                    (current.isBefore(dayjs().startOf('day'))) ||
                    (current && ((current.isBefore(dayjs(trip?.startDate)) || current.isAfter(dayjs(trip?.endDate).add(1, 'day').subtract(1, 'second')))))
                  }
                  defaultPickerValue={trip?.startDate ? dayjs(trip?.startDate).isAfter(dayjs()) ? dayjs(trip?.startDate) : dayjs() : dayjs()}
                  style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item style={{ marginBottom: '10px' }}>
                <Row>
                  <Col>
                    <Form.Item
                      label="Start Time"
                      name="startTime"
                      style={{ display: 'inline-block', marginRight: "2vw" }}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[{ required: true, message: 'Please choose the start time!' }]}
                    >
                      <TimePicker
                        format="HH:mm"
                        minuteStep={5}
                        defaultOpenValue={dayjs().set('hour', 8).set('minute', 0)}
                        allowClear={false}
                        changeOnBlur={true}
                        onChange={handleStartTimeChange}
                        popupClassName="time-picker-hide-footer"
                      />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Form.Item
                      label="End Time"
                      name="endTime"
                      style={{ display: 'inline-block', maxWidth: '200px', wordWrap: 'break-word' }}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[{ required: true, message: 'Please choose the end time!' }, ({ getFieldValue }) => ({
                        validator(_, value) {
                          const startTime = getFieldValue('startTime');
                          if (!value || !startTime) {
                            // If either field is not set, don't perform validation
                            return Promise.resolve();
                          }

                          if (value < startTime) {
                            //Probably the day is wrong, put the correct one
                            const selectedDate = form.getFieldValue('date'); // Get the selected date from the date picker
                            const newEndTime = dayjs(selectedDate).set('hour', value.hour()).set('minute', value.minute()); // Set the same date with end time
                            value = newEndTime;
                          }

                          const timeDifference = value.diff(startTime, 'minutes');

                          if (timeDifference >= 15) {
                            // If end time is at least 15 minutes after start time, validation passes
                            return Promise.resolve();
                          }

                          return Promise.reject(new Error('End time must be at least 15 minutes after start time!'));
                        },
                      })]}
                    >
                      <TimePicker
                        format="HH:mm"
                        minuteStep={5}
                        changeOnBlur={true}
                        defaultOpenValue={startTime ? dayjs().set('hour', dayjs(startTime).hour()).set('minute', dayjs(startTime).minute() + 15) : dayjs().set('hour', 0).set('minute', 0)}
                        popupClassName="time-picker-hide-footer"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
              <Row>
                <small>
                  {(editingAttraction ? "Editing" : "Adding") + " an attraction to this trip will shift and/or delete other attractions in the same day if they overlap."}
                </small>
              </Row>
              <Row style={{ color: "red" }}>
                <small className='text-start mt-3'>* This field is mandatory</small>
              </Row>
            </Col>
            <Col>
              <Form.Item>
                <GoogleMap clickableIcons={false} mapContainerStyle={{ width: '100%', height: '45vh', margin: 'auto', display: 'block', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={selectedAttractionId === null ? cityPosition : cityPosition} zoom={zoomLevel} onLoad={(map) => { setMap(map) }} onClick={() => { setSelectedMarker(null); setMarkerClicked(false); }}>
                  {!selectedAttractionId && (
                    <>
                      {cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction, index: number) => {
                        return (
                          <Marker
                            key={attraction.id}
                            position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }}
                            icon={{ url: "https://imgur.com/HXGfoxe.png", scaledSize: new window.google.maps.Size(30, 30) }}
                            opacity={attraction === selectedMarker ? 0.9 : 0.7}
                            onMouseOver={() => {
                              if (!markerClicked) {
                                setSelectedMarker(attraction);
                              }

                            }}
                            onMouseOut={() => {
                              if (!markerClicked) {
                                setSelectedMarker(null);
                              }
                            }}
                            onClick={() => {
                              setSelectedAttractionId(attraction.id);
                              form.setFieldsValue({ attraction: attraction.name }); // Update the AutoComplete value
                              if (!markerClicked) {
                                setMarkerClicked(true);
                                setSelectedMarker(attraction);
                              }
                            }}
                          />
                        );
                      })}
                    </>
                  )}
                  {selectedAttractionId && (
                    <>
                      {cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction) => {
                        if (attraction.id === selectedAttractionId) {
                          return (
                            <Marker
                              key={attraction.id}
                              position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }}
                              icon={{ url: "https://imgur.com/HXGfoxe.png", scaledSize: new window.google.maps.Size(37, 37) }}
                              onMouseOver={() => {
                                if (!markerClicked) {
                                  setSelectedMarker(attraction);
                                }
                              }}
                              onMouseOut={() => {
                                if (!markerClicked) {
                                  setSelectedMarker(null);
                                }
                              }}
                              onClick={() => {
                                setMarkerClicked(true);
                                setSelectedMarker(attraction);
                              }} />
                          );
                        }
                        return null; // Render nothing if the attraction is not the selected one
                      })}
                    </>
                  )}
                  {selectedMarker && (
                    <InfoWindow
                      options={{ pixelOffset: new google.maps.Size(0, -35), disableAutoPan: true }}
                      position={{ lat: selectedMarker.location.latitude, lng: selectedMarker.location.longitude }}
                      onCloseClick={() => {
                        setSelectedMarker(null);
                        setMarkerClicked(false);
                      }}

                    >
                      <div className="smallAttractionContainer">
                        <Image className="attractionImage" src={imageUrl || defaultAttractionImageUrl} alt={selectedMarker.name} preview={false} />
                        <Title className="attractionName" style={{ textAlign: 'center', fontSize: '12px' }}>{selectedMarker.name}</Title>
                        <Tag icon={<EuroCircleOutlined />} color="green" style={{ gridColumn: "1", gridRow: "2", display: "inline-block", maxWidth: "60px", margin: '0' }}>{" "}{selectedMarker.perPersonCost ? selectedMarker.perPersonCost * (trip!.nAdults + trip!.nChildren) : "free"}</Tag>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={closeForm} style={{ marginRight: '10px' }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingAttraction ? "Save changes" : "Save and add attraction"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AttractionForm;
