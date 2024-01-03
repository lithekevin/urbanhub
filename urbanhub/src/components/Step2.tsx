import React from 'react';
import { Form, Input, Row, Col, Button } from 'antd';
import questions from '../firebase/questions'; 
import shuffle from 'lodash/shuffle';

interface Step2Props {
  displayedQuestions: string[];
  setDisplayedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  allDisplayedQuestions: string[];
  setAllDisplayedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  canLoadMoreQuestions: boolean;
  setCanLoadMoreQuestions: React.Dispatch<React.SetStateAction<boolean>>;
  areAllQuestionsAnswered: () => boolean;
  userAnswers: string[];
  setUserAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  step: number;
}

const Step2: React.FC<Step2Props> = ({ displayedQuestions, setDisplayedQuestions, allDisplayedQuestions, setAllDisplayedQuestions, canLoadMoreQuestions,setCanLoadMoreQuestions,areAllQuestionsAnswered, userAnswers, setUserAnswers, step }) => {
  // Handle user's answers to questions
  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = value;
    setUserAnswers(updatedAnswers);
  };

  // Load more questions when the user clicks the button
  const loadMoreQuestions = () => {
    const remainingQuestions = questions.filter(
      (question) => !allDisplayedQuestions.includes(question)
    );

    const newQuestions = shuffle(remainingQuestions).slice(0, 3);

    setDisplayedQuestions((prevDisplayedQuestions) => [
      ...prevDisplayedQuestions,
      ...newQuestions,
    ]);

    setAllDisplayedQuestions((prevAllDisplayedQuestions) => [
      ...prevAllDisplayedQuestions,
      ...newQuestions,
    ]);

    // Disable loading more questions if all questions are displayed
    if (allDisplayedQuestions.length + newQuestions.length === 9) {
      setCanLoadMoreQuestions(false);
    }
  };

  React.useEffect(() => {
    // Load the initial set of questions when the component mounts
  if (displayedQuestions.length === 0) {
    let initialQuestions = ["Describe me your ideal trip."];
    initialQuestions = [...initialQuestions, ...shuffle(questions).slice(0, 2)];
    setDisplayedQuestions(initialQuestions);
    setAllDisplayedQuestions(initialQuestions);
  }
}, [displayedQuestions, setDisplayedQuestions, setAllDisplayedQuestions]);

   return (
    <>
      <h3 className='step-title'> Set your trip preferences </h3>
        { displayedQuestions.map((question, index) => (
        <div key={index}>
          <Row gutter={16}>
            <Col span={24}>
              <label className='label'>{question}</label>
            </Col>
            <Col span={24}>
              <Form.Item
                name={`answer${index}`}
                hidden={step !== 2}
              >
                <Input.TextArea
                  value={userAnswers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  rows={4}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
        ))}
        {/* Load more questions button */}
        { displayedQuestions.length < questions.length && canLoadMoreQuestions && (
            <div className="mb-2 d-flex align-items-center justify-content-center">
              <Button type="default" onClick={loadMoreQuestions} className="button" disabled={!areAllQuestionsAnswered()}>
                Load More Questions
              </Button>
            </div>
        )}
    </>
  );
};

export default Step2;