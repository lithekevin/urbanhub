import React from 'react';
import { Button, Col, Form, Image, Input, Modal, Progress, Row, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import questions from '../../firebase/questions'; 
import shuffle from 'lodash/shuffle';

const { Title, Paragraph } = Typography;

interface Step2Props {
  displayedQuestions: string[];
  setDisplayedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  allDisplayedQuestions: string[];
  setAllDisplayedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  userAnswers: string[];
  setUserAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  questionsPageNumber: number;
  setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
  step: number;
  prevStep: () => void;
  nextStep: () => void;
}

function Step2(props: Step2Props) {
  const { displayedQuestions, setDisplayedQuestions, allDisplayedQuestions, setAllDisplayedQuestions, 
          userAnswers, setUserAnswers, questionsPageNumber, setQuestionsPageNumber, 
          step, prevStep, nextStep } = props;
          
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
  };

  const handleClickNextStep = () => {
    let message;
    if (userAnswers.length === 0) {
      message = "If you don't answer any of the AI's questions, it won't understand your preferences, and the trip will not be personalized. Are you sure you want to continue?";
    }
    if (userAnswers.length < 9 && userAnswers.length > 0) {
      message = "The AI needs more answers to understand your preferences and personalize the trip. Are you sure you want to continue?";
    }
  
    if (userAnswers.length < 9) {
      Modal.confirm({
        title: 'Warning',
        content: message,
        okText: 'Yes',
        cancelText: 'No',
        onOk: () => {
          nextStep();
        },
        onCancel: () => {
          return;
        },
        centered: true,
      })  
    }
    else {
      nextStep();
    }
  };   
 
 
  return (
    <div className='form-container'>
      <Title level={2} className='step-title'> Set your trip preferences </Title>
        <Row className='w-100 d-flex justify-content-center'>
          <Col xs={{span:24}} className='w-100 d-flex flex-column justify-content-center align-items-center mb-4'>
            <Progress className='w-75' percent={userAnswers.filter(a => a.length !== 0).length * 100/9}  showInfo={false}/>
            <Paragraph style={{ fontSize: '13px', textAlign: 'center'}}>{(userAnswers.filter(a => a.length !== 0).length * 100/9 < 100) ? "Keep answering questions until UrbanHub understands the perfect vacation style for you!" : "UrbanHub has understood your ideal vacation style. Click on next to confirm your choices and take a look at the results!"}</Paragraph>
          </Col>
          <Row className='w-100 d-flex justify-content-center'>
          {displayedQuestions.map((question, index) => (
            <div key={question}>
              <Row gutter={[16, 0]} align="middle">
                <Col span={2}>
                  <Image src="https://imgur.com/Yax8pdf.png" className='bot-AI' alt='bot-AI' preview={false} style={{marginBottom: '1rem', width: '120%'}} />
                </Col>
                <Col span={22}>
                  <Row gutter={[16, 0]}>
                    <Col span={24}>
                      <Paragraph className='label'>{question}</Paragraph>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name={`answer${index + questionsPageNumber * 3}`}
                    hidden={step !== 2}
                  >
                    <Input.TextArea
                      value={userAnswers[index + questionsPageNumber * 3]}
                      onChange={(e) => handleAnswerChange(index + questionsPageNumber * 3, e.target.value)}
                      autoSize={{ minRows: 3, maxRows: 5 }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          ))}
        </Row>
        <Row className='w-100'>
          <Col span={24} className='d-flex flex-row justify-content-between'>
            <Button 
              style = {{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                setDisplayedQuestions(allDisplayedQuestions.slice((questionsPageNumber-1)*3, (questionsPageNumber-1)*3+3))
                setQuestionsPageNumber((number) => number-1)
              }} 
              disabled={questionsPageNumber === 0}>
                <LeftOutlined />
            </Button>
            { questionsPageNumber < 2 &&
            <Button 
              style = {{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                if(allDisplayedQuestions.length === questionsPageNumber*3+3){
                  loadMoreQuestions();
                }
                else{
                  setDisplayedQuestions(allDisplayedQuestions.slice((questionsPageNumber+1)*3, (questionsPageNumber+1)*3+3))
                }
                setQuestionsPageNumber((number) => number+1)
              }} 
              disabled={questionsPageNumber === 2 || userAnswers.slice(questionsPageNumber*3, questionsPageNumber*3+3).length < 3 || userAnswers.slice(questionsPageNumber*3, questionsPageNumber*3+3).some((ans) => ans.length === 0)}
            >
              <RightOutlined />
            </Button>
            }
          </Col>
        </Row>
        </Row>
        <div className="mb-2 d-flex align-items-center justify-content-center">
          <Button type="default" onClick={prevStep} className="button">
            Previous
          </Button>
          <Button type='primary' onClick={handleClickNextStep} className="button" htmlType="submit">
            Next
          </Button>
        </div>
    </div>
  );
};

export default Step2;