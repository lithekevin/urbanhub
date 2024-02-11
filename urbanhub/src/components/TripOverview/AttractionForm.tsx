import React, {useState} from 'react';
import { Row, Col } from 'react-bootstrap';
import { Modal, Form, DatePicker, Image, TimePicker, Button, AutoComplete, Typography } from 'antd';
import { CloseSquareFilled } from '@ant-design/icons';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Attraction } from '../../models/attraction';
import { addAttractionToTrip, editAttraction } from '../../firebase/daos/dao-trips';
import { Trip } from '../../models/trip';
import { TripAttraction } from '../../models/tripAttraction';
import moment from 'moment';
import cities from "../../firebase/cities";
import { Dayjs } from 'dayjs';
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
}

function AttractionForm(props: AttractionFormProps) {

  const { cityPosition, contextHolder , defaultAttractionImageUrl, editingAttraction, form, imageUrl, isFormVisible, trip,
    selAttraction, selectedAttractionId, selectedDay, selectedMarker, setDirty, setEditingAttraction,
    setIsFormVisible, setMap, setMessageAI, setSelectedAttractionId, setSelectedMarker, setUndoVisibility,
    setValidSelection, tripId, validSelection, zoomLevel, messageApi } = props;

    const [showParagraph, setShowParagraph] = useState(false);

    const closeForm = () => {
      setIsFormVisible(false);
      setEditingAttraction(null);
      setSelectedAttractionId(null);
      setShowParagraph(false);
    };
  
    const onFinish = (values: any) => {
      const attraction = {
        id: selectedAttractionId,
        startDate: values.startTime.format('HH:mm'),
        endDate: values.endTime.format('HH:mm'),
      };
  
      if(editingAttraction){
  
        if(tripId&&selectedDay){
          editAttraction(tripId, editingAttraction.id ,selectedDay, values.date.format('DD/MM/YYYY'), attraction);
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
        else{
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
  
      else{
        if(tripId){
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
      setEditingAttraction(null);
      setIsFormVisible(false);
      setSelectedAttractionId(null);
      setShowParagraph(false);
    };

    return (
      <>
        {contextHolder}
        <Modal open={isFormVisible} onCancel={closeForm} footer={null} centered width={1000}>
          <Form form={form} name={"formName"} layout= "vertical" onFinish={(values) => onFinish(values)}>
            <Title level={2} className='step-title'> {editingAttraction ? "Edit Attraction" : "Add Attraction"} </Title>
            <Row>
              <Col>
                <Form.Item name="attraction" label="Attraction" rules={[{ required: true, message: 'Please select one of the attractions in the map, or type the name!' }]} style={{ marginBottom: '10px'}}>
                  <AutoComplete
                    options={cities.find(city => city.name === trip?.city)?.attractions.map(attraction => ({ value: attraction.name}))}
                    placeholder="Type an attraction"
                    style={{width: '100%'}}
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
                      if(selectedAttraction) {
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
                    <Paragraph style={{color: "var(--hard-background-color)", marginTop: '0', marginBottom: '10px'}}>This attraction will add a cost of {cities.find(city => city.name === trip?.city)!.attractions.find(attraction => attraction.id === selectedAttractionId)!.perPersonCost * (trip!.nAdults + trip!.nKids)}{" € to your trip."}</Paragraph>
                }
                <Form.Item name="date" label= "Date" rules={[{ required: true, message: 'Please choose the date!' }]} style={{ marginBottom: '10px'}}>
                  <DatePicker format="DD/MM/YYYY" disabledDate={(current) => current && current < moment().startOf('day')} style={{width: '100%'}}/>
                </Form.Item>
                <Form.Item style={{ marginBottom: '10px'}}>
                  <Form.Item label = "Start Time " name="startTime" style={{ display: 'inline-block', marginRight: "2vw"}} rules={[{ required: true, message: 'Please choose the start time!' }]}>
                    <TimePicker format="HH:mm" minuteStep={5} />
                  </Form.Item>
                  <Form.Item label= "End Time" name="endTime" style={{ display: 'inline-block' }} rules={[{ required: true, message: 'Please choose the end time!' }]}>
                    <TimePicker format="HH:mm" minuteStep={5} />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col>
                <Form.Item>
                  <GoogleMap clickableIcons={false} mapContainerStyle={{ width: '100%', height: '45vh', margin: 'auto', display: 'block', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} center={selectedAttractionId === null ? cityPosition : cityPosition } zoom={zoomLevel} onLoad={(map) => {setMap(map)}}>             
                    { !selectedAttractionId && (
                      <>
                        {cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction, index: number) => {
                          return (
                            <Marker   
                              key={attraction.id} 
                              position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} 
                              icon={{ url: "https://imgur.com/HXGfoxe.png", scaledSize: new window.google.maps.Size(30, 30) }}
                              opacity={attraction === selectedMarker ? 0.9 : 0.7}
                              onMouseOver={() => setSelectedMarker(attraction)} 
                              onMouseOut={() => setSelectedMarker(null)}  
                              onClick={() => {
                                setSelectedAttractionId(attraction.id);
                                form.setFieldsValue({ attraction: attraction.name }); // Update the AutoComplete value
                                setSelectedMarker(null);
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                    { selectedAttractionId && (
                      <>
                        {cities.find(city => city.name === trip?.city)?.attractions.map((attraction: Attraction) => {
                          if (attraction.id === selectedAttractionId) {
                            return (
                              <Marker 
                                key={attraction.id} 
                                position={{ lat: attraction.location.latitude, lng: attraction.location.longitude }} 
                                icon={{ url: "https://imgur.com/HXGfoxe.png", scaledSize: new window.google.maps.Size(37, 37) }}
                                onMouseOver={() => setSelectedMarker(attraction)} 
                                onMouseOut={() => setSelectedMarker(null)}/>
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
                        onCloseClick={() => { setSelectedMarker(null) }}
                      >
                        <div className="smallAttractionContainer">
                          <Image className="attractionImage" src={imageUrl || defaultAttractionImageUrl} alt={selectedMarker.name} preview={false}/>
                          <Title className="attractionName" style={{textAlign: 'center', fontSize: '12px'}}>{selectedMarker.name}</Title>
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
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
    </>
  );
};

export default AttractionForm;
