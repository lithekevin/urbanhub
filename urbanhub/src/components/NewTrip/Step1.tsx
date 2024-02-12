import React from 'react';
import { Button, Col, DatePicker, Form, InputNumber, Row, Tooltip, Typography } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Paragraph, Text, Title } = Typography;

interface Step1Props {
  adultsValue: number;
  setAdultsValue: React.Dispatch<React.SetStateAction<number>>;
  kidsValue: number;
  setKidsValue: React.Dispatch<React.SetStateAction<number>>;
  handleDateRangeChange: (dates: [moment.Moment, moment.Moment]) => void;
  handleInputChange: (e: CustomEvent) => void;
  formData: { dateRange: string[], budget: number, adults: number, kids: number }; 
  step: number;
  prevStep: () => void;
  nextStep: () => void;
}

interface CustomEvent {
    target: {
      name: string;
      value: string | [string, string] | number;
    };
  }

function Step1 (props: Step1Props){

  const { adultsValue, setAdultsValue, kidsValue, setKidsValue, handleDateRangeChange, handleInputChange, 
          formData, step, prevStep, nextStep } = props;

  const handleIncrement = (type: 'adults' | 'kids') => {
    if (type === 'adults') {
      setAdultsValue((prevValue) => prevValue + 1);
    } else if (type === 'kids') {
      setKidsValue((prevValue) => prevValue + 1);
    }
  };

  const handleDecrement = (type: 'adults' | 'kids') => {
    if (type === 'adults') {
      setAdultsValue((prevValue) => Math.max(prevValue - 1, 0));
    } else if (type === 'kids') {
      setKidsValue((prevValue) => Math.max(prevValue - 1, 0));
    }
  };

  const isStepValid = () => {
    return (
      formData.dateRange[0] !== '' &&
      ( formData.adults > 0 ||
      formData.kids > 0 ) &&
      formData.budget > 0
    );
  }

  return (
    <div className='form-container'>
      <Title level={2} className='step-title'> Select your trip settings </Title>
      
      <Paragraph style={{color: 'red'}}>✽<Text className='label'> When would you like to go? </Text></Paragraph>
      <Form.Item name="dateRange" hidden={step !== 1}>
      <DatePicker.RangePicker 
        style={{ width: '100%' }}
        onChange={(dates, dateStrings) => handleDateRangeChange(dates as [moment.Moment, moment.Moment])}
        disabledDate={(current) => current && current < moment().startOf('day')} 
        allowClear={true}/>
      </Form.Item>

      <Paragraph style={{color: 'red'}}>✽<Text className='label'> How many adults are going? </Text></Paragraph>
      <Form.Item name="adults" hidden={step !== 1} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
        <Row gutter={8}>
          <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
            <InputNumber
              min={0}
              keyboard={false}
              value={adultsValue}
              onChange={(value) => setAdultsValue(value ?? 0)}
              controls={false}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            {adultsValue <= 1 ? <Text> Adult </Text> : <Text> Adults </Text>} <Text style={{ color: 'gray', marginLeft: '5px' }}>(13+ years old)</Text>
          </Col>
          <Col flex="none">
            <Button type='default' shape='circle' icon={<MinusOutlined/>} onClick={() => handleDecrement('adults')} disabled={adultsValue===0}/>
          </Col>
          <Col flex="none">
            <Button type='default' shape='circle' icon={<PlusOutlined/>} onClick={() => handleIncrement('adults')} />
          </Col>
        </Row>
      </Form.Item>

      <Paragraph style={{color: 'red'}}>✽<Text className='label'> How many kids are going? </Text></Paragraph>
      <Form.Item name="kids"  hidden={step !== 1} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
        <Row gutter={8}>
          <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
            <InputNumber
              min={0}
              value={kidsValue}
              keyboard={false}
              onChange={(value) => setKidsValue(value ?? 0)}
              controls={false}
              style={{ textAlign: 'center', width: 'auto', marginRight: '8px' }}
            />
            {kidsValue <= 1 ? <Text> Kid  </Text> : <Text> Kids </Text>} <Text style={{ color: 'gray', marginLeft: '5px'}}>(0-12 years old)</Text>
          </Col>
          <Col flex="none">
            <Button type='default' shape='circle' icon={<MinusOutlined/>} onClick={() => handleDecrement('kids')} disabled={kidsValue===0} />
          </Col>
          <Col flex="none">
            <Button type='default' shape='circle' icon={<PlusOutlined/>} onClick={() => handleIncrement('kids')}/>
          </Col>
        </Row>
      </Form.Item>

      <Paragraph style={{color: 'red'}}>✽<Text className='label'> How much do you plan to spend on this trip? </Text></Paragraph>
      <Form.Item name="budget" hidden={step !== 1} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
        <InputNumber
          onChange={(value) =>
            handleInputChange({
              target: { name: 'budget', value: typeof value === 'number' ? value : 0 },
            } as CustomEvent)
          }
          value={formData.budget}
          min={0}
          controls={false}
          addonAfter={<span>€</span>}
          style={{ width: 'auto' }}
        />
      </Form.Item>
      <div className="mb-2 d-flex align-items-center justify-content-center">
        <Button type="default" onClick={prevStep} className="button">
          Previous
        </Button>
        <Tooltip title={!isStepValid() ? 'Please fill correctly all the required fields' : ''} placement='right' overlayInnerStyle={{textAlign: 'center', fontSize: '13px'}}>
          <Button type='primary' onClick={nextStep} className="button" htmlType="submit" disabled={!isStepValid()}>
            Next
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Step1;
