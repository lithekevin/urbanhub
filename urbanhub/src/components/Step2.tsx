import React from 'react';
import { Form, Input, Row, Col, Button, Progress } from 'antd';
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
  questionsPageNumber: number;
  setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
  step: number;
}

const Step2: React.FC<Step2Props> = ({ displayedQuestions, setDisplayedQuestions, allDisplayedQuestions, setAllDisplayedQuestions, canLoadMoreQuestions,setCanLoadMoreQuestions,areAllQuestionsAnswered, userAnswers, setUserAnswers, questionsPageNumber, step, setQuestionsPageNumber }) => {
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

    setDisplayedQuestions(() => [
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

   return (
    <>
      <h3 className='step-title'> Set your trip preferences </h3>
      <Row className='w-100 d-flex justify-content-center'>
          <Col xs={{span:24}} className='w-100 d-flex flex-column justify-content-center align-items-center mb-4'>
            <Progress className='w-75' percent={userAnswers.filter(a => a.length !== 0).length * 100/9}  showInfo={false} />
            <small>{(userAnswers.filter(a => a.length !== 0).length * 100/9 < 100) ? "Keep answering questions until UrbanHub understand the perfect vacation style for you!" : "UrbanHub has understood your ideal vacation style. Click on next to confirm your choices and take a look at the results!"}</small>
          </Col>

        <div className='w-100'>
          {displayedQuestions.map((question, index) => (
            <div key={index}>
              <Row gutter={16}>
                <Col span={24}>
                  <label className='label'>{question}</label>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name={`answer${index + questionsPageNumber*3}`}
                    hidden={step !== 2}
                  >
                    <Input.TextArea
                      value={userAnswers[index + questionsPageNumber*3]}
                      onChange={(e) => handleAnswerChange(index + questionsPageNumber*3, e.target.value)}
                      rows={4}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          ))}
        </div>
        <Row className='w-100'>
          <Col span={24} className='d-flex flex-row justify-content-between'>
            <Button 
              onClick={() => {
                setDisplayedQuestions(allDisplayedQuestions.slice((questionsPageNumber-1)*3, (questionsPageNumber-1)*3+3))
                setQuestionsPageNumber((number) => number-1)
              }} 
              disabled={questionsPageNumber === 0}>{"<"}
            </Button>
            { questionsPageNumber < 2 &&
              <Button 
                onClick={() => {
                  if(allDisplayedQuestions.length === questionsPageNumber*3+3){
                    loadMoreQuestions();
                  }
                  else{
                    setDisplayedQuestions(allDisplayedQuestions.slice((questionsPageNumber+1)*3, (questionsPageNumber+1)*3+3))
                  }
                  setQuestionsPageNumber((number) => number+1)
                }} 
                disabled={questionsPageNumber === 2 || userAnswers.slice(questionsPageNumber*3, questionsPageNumber*3+3).length < 3 || userAnswers.slice(questionsPageNumber*3, questionsPageNumber*3+3).some((ans) => ans.length === 0)}>{">"}
              </Button>
            }
          </Col>
        </Row>
      </Row>
    </>
  );
};

export default Step2;