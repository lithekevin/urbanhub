import React, { useEffect } from 'react';
import { Button, Col, DatePicker, Form, InputNumber, Row, Tag, Tooltip, Typography } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Paragraph, Text, Title } = Typography;

interface Step1Props {
  adultsValue: number;
  setAdultsValue: React.Dispatch<React.SetStateAction<number>>;
  childrenValue: number;
  setChildrenValue: React.Dispatch<React.SetStateAction<number>>;
  handleDateRangeChange: (dates: [moment.Moment, moment.Moment]) => void;
  handleInputChange: (e: CustomEvent) => void;
  formData: { destination: string, dateRange: string[], budget: number, adults: number, children: number }; 
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

  const { adultsValue, setAdultsValue, childrenValue, setChildrenValue, handleDateRangeChange, handleInputChange, 
          formData, step, prevStep, nextStep } = props;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleIncrement = (type: 'adults' | 'children') => {
    if (type === 'adults') {
      setAdultsValue((prevValue) => prevValue + 1);
    } else if (type === 'children') {
      setChildrenValue((prevValue) => prevValue + 1);
    }
  };

  const handleDecrement = (type: 'adults' | 'children') => {
    if (type === 'adults') {
      setAdultsValue((prevValue) => Math.max(prevValue - 1, 0));
    } else if (type === 'children') {
      setChildrenValue((prevValue) => Math.max(prevValue - 1, 0));
    }
  };

  const isStepValid = () => {
    return (
      formData.dateRange[0] !== '' &&
      formData.adults > 0  &&
      formData.budget > 0
    );
  }

  return (
    <Row>
      <Col span={5}></Col>
      <Col span={14}>
        <div className='form-container'>
          <Title level={3} className='step-title'> Select your trip settings </Title>
          <Paragraph style={{color: 'red'}}>*<Text className='label'> When would you like to go? </Text></Paragraph>
          <Form.Item name="dateRange" hidden={step !== 1}>
          <DatePicker.RangePicker 
            style={{ width: '100%' }}
            onChange={(dates, dateStrings) => handleDateRangeChange(dates as [moment.Moment, moment.Moment])}
            disabledDate={(current) => current && current < moment().startOf('day')} 
            allowClear={true}/>
          </Form.Item>

          <Paragraph style={{color: 'red'}}>*<Text className='label'> How many adults are going? </Text></Paragraph>
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

          <Paragraph style={{color: 'red'}}><Text className='label'> How many children are going? </Text></Paragraph>
          <Form.Item name="children"  hidden={step !== 1} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
            <Row gutter={8}>
              <Col flex="auto" style={{ display: 'flex', alignItems: 'center' }}>
                <InputNumber
                  min={0}
                  value={childrenValue}
                  keyboard={false}
                  onChange={(value) => setChildrenValue(value ?? 0)}
                  controls={false}
                  style={{ textAlign: 'center', width: 'auto', marginRight: '8px' }}
                />
                {childrenValue <= 1 ? <Text> Child  </Text> : <Text> Children </Text>} <Text style={{ color: 'gray', marginLeft: '5px'}}>(0-12 years old)</Text>
              </Col>
              <Col flex="none">
                <Button type='default' shape='circle' icon={<MinusOutlined/>} onClick={() => handleDecrement('children')} disabled={childrenValue===0} />
              </Col>
              <Col flex="none">
                <Button type='default' shape='circle' icon={<PlusOutlined/>} onClick={() => handleIncrement('children')}/>
              </Col>
            </Row>
          </Form.Item>

          <Paragraph style={{color: 'red'}}>*<Text className='label'> How much do you plan to spend on this trip? </Text></Paragraph>
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
          <Row className="d-flex justify-content-end mt-2" style={{color: "red"}}>
              <small>* This field is mandatory</small>
            </Row>
          <div className="mb-2 d-flex align-items-center justify-content-center">
            <Button type="default" onClick={prevStep} className="button nextButtonSecondary">
              Previous
            </Button>
            <Tooltip title={!isStepValid() ? 'Please fill correctly all the required fields' : ''} placement='right' overlayInnerStyle={{textAlign: 'center', fontSize: '13px'}}>
              <Button type='primary' onClick={nextStep} className="button nextButtonPrimary" htmlType="submit" disabled={!isStepValid()}>
                Next
              </Button>
            </Tooltip>
          </div>
        </div>
      </Col>
      <Col span={5}>
      </Col>
    </Row>
  );
};

export default Step1;
