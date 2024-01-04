import React from 'react';
import { List } from 'antd';

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
}

const Step3: React.FC<Step3Props> = ({ step, allDisplayedQuestions, userAnswers, formData }) => {
  
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
      <div>
        <h3 className='step-title'> Trip summary</h3>
        <List
          dataSource={tripSummaryData}
          renderItem={(item) => (
            <List.Item>
              <strong>{item.label}</strong> {item.value}
            </List.Item>
          )}
          bordered
          style={{ borderRadius: '10px', border: '1px solid #d9d9d9', padding: '10px' }}
        />
      </div>
    </>
  );
};

export default Step3;
