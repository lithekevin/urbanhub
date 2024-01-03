import React from 'react';
import { Row, Col } from 'antd';

interface Step3Props {
  allDisplayedQuestions: string[];
  userAnswers: string[];
  formData: {
    destination: string;
    dateRange: string[];
    adults: number;
    kids: number;
    budget: number;
  };
  step: number;
}

const Step3: React.FC<Step3Props> = ({ step, allDisplayedQuestions, userAnswers, formData }) => {
  return (
    <>
      <div>
      <h3 className='step-title'> Trip summary</h3>
      <br />
      <p>
          <strong>Destination:</strong> {formData.destination}
      </p>
      <p>
          <strong>Date Range:</strong> {formData.dateRange.join(' to ')}
      </p>
      <p>
          <strong>Number of Adults:</strong> {formData.adults}
      </p>
      <p>
          <strong>Number of Kids:</strong> {formData.kids}
      </p>
      <p>
          <strong>Budget:</strong> {formData.budget} €
      </p>
      </div>
      { allDisplayedQuestions.map((question, index) => (
          <div key={index}>
          <Row gutter={16}>
              <Col span={24}>
              <strong>{question}</strong>
              </Col>
              <Col span={24}>
              <p>{userAnswers[index]}</p>
              </Col>
          </Row>
          </div>
      ))}
    </>
  );
};

export default Step3;
