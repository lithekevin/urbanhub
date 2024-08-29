import React, { useEffect } from 'react';
import { Button, Card, Col, Empty, Row, Space, Typography } from 'antd';
const { Text, Title } = Typography;

interface Step3Props {
  formData: {
    destination: string;
    dateRange: string[];
    adults: number;
    children: number;
    budget: number;
    questions: string[];
    answers: string[];
  };
  step: number;
  prevStep: () => void;
  onSubmit: (data: {
    destination: string;
    dateRange: string[];
    adults: number;
    children: number;
    budget: number;
    questions: string[];
    answers: string[];
  }) => void;
}

function Step3 (props: Step3Props) {

  const { formData, step, prevStep, onSubmit } = props;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const step1Data = [
    { label: 'Destination: ', value: formData.destination }
  ];

  const step2Data = [
    { label: 'Date Range: ', value: formData.dateRange.join(' to ') },
    { label: 'Number of Adults: ', value: formData.adults },
    { label: 'Number of Children: ', value: formData.children },
    { label: 'Budget: ', value: `${formData.budget} €` }
  ];

  const step3Data = formData.questions.map((question, index) => (
    formData.answers[index] !== undefined ?
      { label: question, value: formData.answers[index] } :
      null
  )).filter(Boolean); // Filter out null values;

  const [loading, setLoading] = React.useState(false);

  return (
    <Row>
      <Col span={5}></Col>
      <Col span={14}>
        <div className='form-container'>
          <Title className='step-title' level={3} style={{ paddingBottom: '20px'}}> Trip summary </Title>

          <Card style={{ marginBottom: '10px', textAlign: 'center' }} title="1. Trip Destination" className='summary-card' headStyle={{ fontSize: '18px' }}>
            <Space direction="vertical">
              {step1Data.map((item, index) => (
                <Space key={item.value} align="baseline">
                  <Text strong>{item?.label}</Text>
                  <span>{item?.value}</span>
                </Space>
              ))}
            </Space>
          </Card>

          <Card style={{ marginBottom: '10px', textAlign: 'center' }} title="2. Trip settings" className='summary-card' headStyle={{ fontSize: '18px' }}>
            <Space direction="vertical" align="center">
              {step2Data.map((item, index) => (
                <Space key={item.value} direction="horizontal" align="baseline">
                  <Text strong>{item?.label}</Text>
                  <span>{item?.value}</span>
                </Space>
              ))}
            </Space>
          </Card>

          {step === 3 &&
            <Card style={{ marginBottom: '10px', textAlign: 'center' }} title="3. Trip preferences" className='summary-card' headStyle={{ fontSize: '18px' }}>
              <Space direction="vertical">
                {step3Data.map((item, index) => (
                  <>
                  {index!==0 && <hr/>}
                  <Space key={index} align="baseline">
                    <Text strong>{item?.label}</Text>
                  </Space>
                  <span>
                    {item?.value}
                  </span>
                  </>
                ))}
                {step3Data.length === 0 &&
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You didn't answer any question" style={{width: '80%'}}/>
                }
              </Space>
            </Card>
          }

          <div className="mb-2 d-flex align-items-center justify-content-center">
            <Button type="default" onClick={prevStep} className="button">
              Previous
            </Button>
            <Button loading={loading} disabled={loading} type="primary" htmlType="submit" className="button createTripButton" onClick={() => { setLoading(true); onSubmit(formData) }}>
              Create Trip
            </Button>
          </div>
        </div>
      </Col>
      <Col span={5}></Col>
    </Row>
  );
};

export default Step3;
