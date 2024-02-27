import React, { useEffect, useState } from 'react';
import { Form, InputNumber, DatePicker, Modal, Typography, Row, Col, Button, message } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import { editSettings } from '../../firebase/daos/dao-trips';
import { Trip } from '../../models/trip';

const { Paragraph, Text, Title } = Typography;


interface EditTripSettingsProps {
  form1: any;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setDirty2: React.Dispatch<React.SetStateAction<boolean>>;
  dirty2: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  trip: Trip | null;
  visible: boolean;
}

function EditTripSettings(props: EditTripSettingsProps) {

  const [messageApi, contextHolder] = message.useMessage();

  const { form1, setDirty, setVisible, setDirty2, dirty2, trip, visible } = props;
  const [numChildren, setNumChildren] = useState(0);
  const [numAdults, setNumAdults] = useState(0);

  useEffect(() => {
    if (trip) {
      setNumChildren(trip.nChildren || 0);
      setNumAdults(trip.nAdults || 0);
    }
    setDirty2(false);
  }, [trip, dirty2]);

  const handleCancel = () => {
    setVisible(false);
  };

  const handleUpdateTrip = async () => {
    try {
      const values = await form1.validateFields();

      const nChildrenValue = values.nChildren !== null ? values.nChildren : 0;

      if (trip) {
        trip.nAdults = numAdults;
        trip.nChildren = nChildrenValue;
        trip.startDate = values.dateRange[0].format('DD-MM-YYYY');
        trip.endDate = values.dateRange[1].format('DD-MM-YYYY');
        trip.budget = values.budget; // Extract budget from form values
      }

      try {
        // Call editSettings and wait for it to complete
        await editSettings(trip?.id, trip);
        setDirty(true);
        messageApi.open({
          type: "success",
          content: "Trip settings edited successfully!",
          duration: 3,
          style: {
            marginTop: "70px",
          },
        });
      } catch (error) {
        console.error('Error while saving: ', error);
        messageApi.open({
          type: "error",
          content: "Error while editing trip settings!",
          duration: 3,
          style: {
            marginTop: "70px",
          },
        });
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

    if (fieldName === 'nChildren') {
      setNumChildren(currentValue + 1);
    } else if (fieldName === 'nAdults') {
      setNumAdults(currentValue + 1);
    }
  };

  const handleDecrement = (fieldName: any) => {
    const currentValue = form1.getFieldValue(fieldName);
    if (currentValue > 0) {
      form1.setFieldsValue({ [fieldName]: currentValue - 1 });

      if (fieldName === 'nChildren') {
        setNumChildren(currentValue - 1);
      } else if (fieldName === 'nAdults') {
        setNumAdults(currentValue - 1 < 1 ? 1 : currentValue - 1);
      }
    }
  };





  return (<>
    {contextHolder}
    <Modal
      open={visible}
      onOk={handleUpdateTrip}
      onCancel={handleCancel}
      destroyOnClose
      centered
      style={{ top: 20 }}
      okText="Save new trip settings"
    >
      <Title level={3} className='step-title'> Edit Trip Settings </Title>
      <Form form={form1} layout="vertical" >
        <Paragraph style={{ color: 'red' }}><span>*</span><Text className='label'> When would you like to go? </Text></Paragraph>
        <Form.Item
          name="dateRange"
          rules={[{ required: true, message: 'Please select the date range' }]}
        >
          <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" disabledDate={(current) => current && current < moment().startOf('day')} />
        </Form.Item>
        <Paragraph style={{ color: 'red', marginTop: '3vh' }}><span>*</span><Text className='label'> How many adults are going? </Text></Paragraph>
        <Row gutter={8} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px', height: '50px' }}>
          <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Item
              name="nAdults"
              rules={[{ required: true, message: '' }]}
            >
              <InputNumber
                min={1}
                max={16 - numChildren}
                controls={false}
                style={{ width: 'auto', marginRight: '8px' }}
                onChange={value => setNumAdults(value ?? 0)}
                onBlur={() => !numAdults && form1.setFieldsValue({ nAdults: 1 })}
              />
            </Form.Item>
            <Text style={{ marginBottom: '20px' }}> {numAdults <= 1 ? 'Adult' : 'Adults'} </Text>
            <Text style={{ color: 'gray', marginLeft: '5px', marginBottom: '20px' }}>(13+ years old)</Text>
          </Col>
          <Col>
            <Button type='default' shape='circle' icon={<MinusOutlined />} disabled={numAdults <= 1} onClick={() => handleDecrement('nAdults')} />
          </Col>
          <Col>
            <Button type='default' shape='circle' icon={<PlusOutlined />} disabled={numAdults >= (16 - numChildren)} onClick={() => handleIncrement('nAdults')} />
          </Col>
        </Row>
        <Paragraph style={{ color: 'red', marginTop: '3vh' }}><Text className='label'> How many children are going? </Text></Paragraph>
        <Row gutter={8} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px', height: '50px' }}>
          <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Item
              name="nChildren"
            >
              <InputNumber
                min={0}
                max={16 - numAdults}
                controls={false}
                style={{ width: 'auto', marginRight: '8px' }}
                onChange={value => setNumChildren(value ?? 0)}
                onBlur={() => !numChildren && form1.setFieldsValue({ nChildren: 0 })}
              />
            </Form.Item>
            <Text style={{ marginBottom: '20px' }}> {numChildren <= 1 ? 'Child' : 'Children'} </Text>
            <Text style={{ color: 'gray', marginLeft: '5px', marginBottom: '20px' }}>(0-12 years old)</Text>
          </Col>
          <Col>
            <Button type='default' shape='circle' icon={<MinusOutlined />} disabled={numChildren <= 0} onClick={() => handleDecrement('nChildren')} />
          </Col>
          <Col>
            <Button type='default' shape='circle' icon={<PlusOutlined />} disabled={numChildren >= (16 - numAdults)} onClick={() => handleIncrement('nChildren')} />
          </Col>
        </Row>
        <Paragraph style={{ color: 'red', marginTop: '3vh' }}><span>*</span><Text className='label'> How much do you plan to spend on this trip? </Text></Paragraph>
          <Form.Item
            name="budget"
            rules={[{ required: true, message: 'Please type your budget' }]}
          >
            <InputNumber
              min={0}
              controls={false}
              addonAfter={<span>€</span>}
              style={{ width: 'auto' }}
            />
          </Form.Item>
      </Form>
      <Row className='d-flex justify-content-start mt-3' style={{ color: "red", paddingTop: '10px' }}>
        <small>* This field is mandatory</small>
      </Row>

    </Modal>
  </>
  );
}

export default EditTripSettings;