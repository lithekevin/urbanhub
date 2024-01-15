import React from 'react';
import { Card, Button, Typography, Space, Empty } from 'antd';
const { Title, Text } = Typography;

interface Step3Props {
  allDisplayedQuestions: string[];
  userAnswers: string[];
  formData: {
    destination: string;
    dateRange: string[];
    adults: number;
    kids: number;
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
    kids: number;
    budget: number;
    questions: string[];
    answers: string[];
  }) => void;
}

const Step3: React.FC<Step3Props> = ({ step, allDisplayedQuestions, userAnswers, formData, prevStep, onSubmit }) => {

  const step1Data = [
    { label: 'Destination: ', value: formData.destination }
  ];

  const step2Data = [
    { label: 'Date Range: ', value: formData.dateRange.join(' to ') },
    { label: 'Number of Adults: ', value: formData.adults },
    { label: 'Number of Kids: ', value: formData.kids },
    { label: 'Budget: ', value: `${formData.budget} €` }
  ];

  const step3Data = formData.questions.map((question, index) => (
    formData.answers[index] !== undefined ?
      { label: question, value: formData.answers[index] } :
      null
  )).filter(Boolean); // Filter out null values;

  const [loading, setLoading] = React.useState(false);

  return (
    <div className='form-container'>
      <Title className='step-title'> Trip summary </Title>

      <Card style={{ marginBottom: '10px', textAlign: 'center' }} title="1. Trip Destination" className='summary-card' headStyle={{ fontSize: '24px' }}>
        <Space direction="vertical">
          {step1Data.map((item, index) => (
            <Space key={index} align="baseline">
              <Text strong>{item?.label}</Text>
              <span>{item?.value}</span>
            </Space>
          ))}
        </Space>
      </Card>

      <Card style={{ marginBottom: '10px', textAlign: 'center' }} title="2. Trip settings" className='summary-card' headStyle={{ fontSize: '24px' }}>
        <Space direction="vertical" align="center">
          {step2Data.map((item, index) => (
            <Space key={index} direction="horizontal" align="baseline">
              <Text strong>{item?.label}</Text>
              <span>{item?.value}</span>
            </Space>
          ))}
        </Space>
      </Card>

      {step === 3 &&
        <Card style={{ marginBottom: '10px', textAlign: 'center' }} title="3. Trip preferences" className='summary-card' headStyle={{ fontSize: '24px' }}>
          <Space direction="vertical">
            {step3Data.map((item, index) => (
              <>
              {index!==0 && <hr/>}
              <Space>
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
        <Button loading={loading} disabled={loading} type="primary" htmlType="submit" className="button" onClick={() => { setLoading(true); onSubmit(formData) }}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default Step3;
