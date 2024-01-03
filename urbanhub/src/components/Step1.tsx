import React from 'react';
import { Form, DatePicker, InputNumber, Row, Col, Button } from 'antd';
import moment from 'moment'; // Make sure to import moment

const { RangePicker } = DatePicker;

interface Step1Props {
  adultsValue: number;
  setAdultsValue: React.Dispatch<React.SetStateAction<number>>;
  kidsValue: number;
  setKidsValue: React.Dispatch<React.SetStateAction<number>>;
  handleDateRangeChange: (dates: [moment.Moment, moment.Moment]) => void;
  handleInputChange: (e: CustomEvent) => void;
  formData: { budget: number }; 
  step: number;
}

interface CustomEvent {
    target: {
      name: string;
      value: string | [string, string] | number;
    };
  }

const Step1: React.FC<Step1Props> = ({
  adultsValue,
  setAdultsValue,
  kidsValue,
  setKidsValue,
  handleDateRangeChange,
  handleInputChange,
  formData,
  step
}) => {

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

  return (
    <>
      <h3 className='step-title'> Select your trip settings </h3>
      <label className='label'> When would you like to go? </label>
      <Form.Item name="dateRange" hidden={step !== 1}>
        <RangePicker
          style={{ width: '100%' }}
          onChange={(dates, dateStrings) => handleDateRangeChange(dates as [moment.Moment, moment.Moment])}
          disabledDate={(current) => current && current < moment().endOf('day')}
        />
      </Form.Item>

      <label className='label'> How many adults are going? </label>
      <Form.Item name="adults" hidden={step !== 1}>
        <Row gutter={8} align="middle">
          <Col>
            <Button onClick={() => handleDecrement('adults')} style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
              -
            </Button>
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            <InputNumber
              min={0}
              value={adultsValue}
              onChange={(value) => setAdultsValue(value || 0)}
              addonAfter={<span>Adults</span>}
              controls={false}
              style={{ textAlign: 'center' }}
            />
          </Col>
          <Col>
            <Button onClick={() => handleIncrement('adults')} style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
              +
            </Button>
          </Col>
        </Row>
      </Form.Item>

      <label className='label'> How many kids are going? </label>
      <Form.Item name="kids" hidden={step !== 1}>
        <Row gutter={8} align="middle">
          <Col>
            <Button onClick={() => handleDecrement('kids')} style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
              -
            </Button>
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            <InputNumber
              min={0}
              value={kidsValue}
              onChange={(value) => setKidsValue(value || 0)}
              addonAfter={<span>Kids</span>}
              controls={false}
              style={{ textAlign: 'center' }}
            />
          </Col>
          <Col>
            <Button onClick={() => handleIncrement('kids')} style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
              +
            </Button>
          </Col>
        </Row>
      </Form.Item>

      <label className='label'> How much do you plan to spend on this trip? </label>
      <Form.Item name="budget" hidden={step !== 1}>
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
        />
      </Form.Item>
    </>
  );
};

export default Step1;
