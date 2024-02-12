import React, { useEffect, useState } from 'react';
import { Form, InputNumber, DatePicker, Modal, Typography, Row, Col, Button } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import { editSettings } from '../../firebase/daos/dao-trips';
import { Trip } from '../../models/trip';

const { Paragraph, Text, Title } = Typography;


interface EditTripSettingsProps {
  form1: any;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  trip: Trip | null;
  visible: boolean;
}

function EditTripSettings(props: EditTripSettingsProps) {

  const { form1, setDirty, setVisible, trip, visible } = props;
  const [numKids, setNumKids] = useState(0);
  const [numAdults, setNumAdults] = useState(0);

  useEffect(() => {
    if (trip) {
      setNumKids(trip.nKids || 0);
      setNumAdults(trip.nAdults || 0);
    }
  }, [trip]);


  const handleCancel = () => {
      setVisible(false);
  };
  
  const handleUpdateTrip = async () => {
      try {
      const values = await form1.validateFields();
  
      if (trip) {
          trip.nAdults = values.nAdults;
          trip.nKids = values.nKids;
          trip.startDate = values.dateRange[0].format('DD-MM-YYYY');
          trip.endDate = values.dateRange[1].format('DD-MM-YYYY');
          trip.budget = values.budget; // Extract budget from form values
      }
  
      try {
          // Call editSettings and wait for it to complete
          await editSettings(trip?.id, trip);
          setDirty(true);
      } catch (error) {
          console.error('Error while saving: ', error);
          // Handle the error as needed
      }
  
      setVisible(false);
      } catch (error) {
      console.error('Error updating trip details:', error);
      }
  };

  const handleIncrement = (fieldName: any) => {
    const currentValue = form1.getFieldValue(fieldName);
    form1.setFieldsValue({ [fieldName]: currentValue + 1 });
  
    if (fieldName === 'nKids') {
      setNumKids(currentValue + 1);
    } else if (fieldName === 'nAdults') {
      setNumAdults(currentValue + 1);
    }
  };
  
  const handleDecrement = (fieldName: any) => {
    const currentValue = form1.getFieldValue(fieldName);
    if (currentValue > 0) {
      form1.setFieldsValue({ [fieldName]: currentValue - 1 });
  
      if (fieldName === 'nKids') {
        setNumKids(currentValue - 1);
      } else if (fieldName === 'nAdults') {
        setNumAdults(currentValue - 1 < 1 ? 1 : currentValue - 1); 
      }
    }
  };
  
  
  
  return (
      <Modal
        open={visible}
        onOk={handleUpdateTrip}
        onCancel={handleCancel}
        destroyOnClose
        style={{ top: 20 }}
      >
        <Title level={3} className='step-title'> Edit Trip Settings </Title>
        <Form form={form1} layout="vertical">
          <Paragraph style={{color: 'red'}}>✽<Text className='label'> When would you like to go? </Text></Paragraph>
              <Form.Item
                  name="dateRange"
                  rules={[{ required: true, message: 'Please select the date range' }]}
              >
                  <DatePicker.RangePicker style = {{width: "100%"}} format="DD-MM-YYYY" disabledDate={(current) => current && current < moment().startOf('day')} />
              </Form.Item>
          <Paragraph style={{color: 'red', marginTop: '3vh'}}>✽<Text className='label'> How many adults are going? </Text></Paragraph>
          <Row gutter={8} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px', height: '50px' }}>
            <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
              <Form.Item
                name="nAdults"
                rules={[{ required: true, message: '' }]}
              >
                <InputNumber
                  min={1}
                  keyboard={false}
                  controls={false}
                  style={{ width: 'auto', marginRight: '8px' }}
                  onChange={value => setNumAdults(value ?? 0)}
                />
              </Form.Item>
              <Text style={{ marginBottom: '20px' }}> {numAdults <= 1 ? 'Adult' : 'Adults'} </Text>
              <Text style={{ color: 'gray', marginLeft: '5px', marginBottom: '20px' }}>(13+ years old)</Text>
            </Col>
            <Col>
              <Button type='default' shape='circle' icon={<MinusOutlined />} disabled={numAdults <= 1} onClick={() => handleDecrement('nAdults')} />
            </Col>
            <Col>
              <Button type='default' shape='circle' icon={<PlusOutlined />} onClick={() => handleIncrement('nAdults')} />
            </Col>
          </Row>              
          <Paragraph style={{color: 'red', marginTop: '3vh'}}>✽<Text className='label'> How many kids are going? </Text></Paragraph>
          <Row gutter={8} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px', height: '50px' }}>
          <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Item
                name="nKids"
                rules={[{ required: true, message: '' }]}
              >
                <InputNumber
                  min={0}
                  keyboard={false}
                  controls={false}
                  style={{ width: 'auto', marginRight: '8px' }}
                  onChange={value => setNumKids(value??0)}
                />
              </Form.Item>
                <Text style={{ marginBottom: '20px' }}> {numKids <= 1 ? 'Kid' : 'Kids'} </Text>
                <Text style={{ color: 'gray', marginLeft: '5px', marginBottom: '20px' }}>(0-12 years old)</Text>
          </Col>
          <Col>
            <Button type='default' shape='circle' icon={<MinusOutlined />} onClick={() => handleDecrement('nKids')} />
          </Col>
          <Col>
            <Button type='default' shape='circle' icon={<PlusOutlined />} onClick={() => handleIncrement('nKids')} />
          </Col>
          </Row>
          <Paragraph style={{color: 'red', marginTop: '3vh'}}>✽<Text className='label'> How much do you plan to spend on this trip? </Text></Paragraph>
          <Row gutter={8} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px', height: '50px' }}>
          <Form.Item 
            name="budget"
            rules={[{ required: true, message: '' }]}
            >
          <InputNumber
            min={0}
            controls={false}
            addonAfter={<span>€</span>}
            style={{ width: 'auto' }}
          />
        </Form.Item>
        </Row>
      </Form>
      </Modal>
  );
}

export default EditTripSettings;