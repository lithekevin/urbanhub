import React from 'react';
import { List, Button, Typography } from 'antd';

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
  
  const tripSummaryData = [
    { label: 'Destination: ', value: formData.destination },
    { label: 'Date Range: ', value: formData.dateRange.join(' to ') },
    { label: 'Number of Adults: ', value: formData.adults },
    { label: 'Number of Kids: ', value: formData.kids },
    { label: 'Budget: ', value: `${formData.budget} €` },
    ...formData.questions.map((question, index) => ({
      label: question,
      value: formData.answers[index],
    })),
  ];

  return (
    <>
      <div className='form-container'>
        <Title className='step-title'> Trip summary </Title>
        <List
          dataSource={tripSummaryData}
          renderItem={(item) => (
            <List.Item>
              <Text strong>{item.label}</Text> {item.value}
            </List.Item>
          )}
          bordered
          style={{ borderRadius: '10px', border: '1px solid #d9d9d9', padding: '10px' }}
        />
        <div className="mb-2 d-flex align-items-center justify-content-center">
          <Button type="default" onClick={prevStep} className="button">
            Previous
          </Button>
          <Button type="primary" htmlType="submit" className="button" onClick={() => onSubmit(formData)}>
            Submit
          </Button>
        </div>
      </div>
    </>
  );
};

export default Step3;
