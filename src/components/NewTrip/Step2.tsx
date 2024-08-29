import React, { useEffect } from 'react';
import { Button, Col, Form, Image, Input, Modal, Progress, Row, Tag, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import questions from '../../firebase/questions'; 
import shuffle from 'lodash/shuffle';
import colors from '../../style/colors';

const { Title, Paragraph } = Typography;

interface Step2Props {
  displayedQuestions: string[];
  formData: { destination: string, dateRange: string[]};
  setDisplayedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  allDisplayedQuestions: string[];
  setAllDisplayedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  userAnswers: string[];
  setUserAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  questionsPageNumber: number;
  setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
  maxPageNumber: number;
  setMaxPageNumber: React.Dispatch<React.SetStateAction<number>>;
  step: number;
  prevStep: () => void;
  nextStep: () => void;
}

function Step2(props: Step2Props) {
  const { displayedQuestions, formData, setDisplayedQuestions, allDisplayedQuestions, setAllDisplayedQuestions, 
          userAnswers, setUserAnswers, questionsPageNumber, setQuestionsPageNumber, maxPageNumber, setMaxPageNumber,
          step, prevStep, nextStep } = props;

  let questionsPercentage = userAnswers.filter(a => (a && a.length !== 0)).length * 100/9;
  let questionStartingIndex = questionsPageNumber*3;
  let questionEndingIndex = questionsPageNumber*3+2;
  let previousPageQuestionStartingIndex = (questionsPageNumber-1)*3;
  let previousPageQuestionEndingIndex = (questionsPageNumber-1)*3+2;
  let nextPageQuestionStartingIndex = (questionsPageNumber+1)*3;
  let nextPageQuestionEndingIndex = (questionsPageNumber+1)*3+2;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
          
  // Handle user's answers to questions
  const handleAnswerChange = (index: number, value: string) => {
    if(value.length > 0){
      const updatedAnswers = [...userAnswers];
      updatedAnswers[index] = value;
      setUserAnswers(updatedAnswers);
    }
    else if(value.length === 0){
      const updatedAnswers: string[] = [];
      userAnswers.forEach((ans, i) => {
        if(i !== index){
          updatedAnswers[i] = ans;
        }
      });
      setUserAnswers(updatedAnswers);
    }
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
    if (userAnswers.every(str => !(str && str.length !== 0))){
      message = "If you don't answer any of the AI's questions, it won't understand your preferences, and the trip will not be personalized. Are you sure you want to continue?";
    }
    if (userAnswers.filter(str => str && str.length !== 0).length < 9 && userAnswers.filter(str => str && str.length !== 0).length > 0) {
      message = "The AI needs more answers to understand your preferences and personalize the trip. Are you sure you want to continue?";
    }
  
    if (userAnswers.filter(str => str && str.length !== 0).length < 9) {
      Modal.confirm({
        title: 'Warning',
        content: message,
        okText: 'Go back and answer questions',
        cancelText: 'Skip this step',
        onOk: () => {
          return;
        },
        onCancel: () => {
          
          nextStep();
        },
        centered: true,
      })  
    }
    else {
      nextStep();
    }
  };   

  return (
    <Row>
      <Col span={5}></Col>
      <Col span={14}>
        <div className='form-container'>
          <Title level={3} className='step-title'> Set your trip preferences </Title>
            <Row className='w-100 d-flex justify-content-center'>
              <Col xs={{span:24}} className='w-100 d-flex flex-column justify-content-center align-items-center mb-4'>
                <Progress className='w-75' percent={questionsPercentage}  showInfo={false} strokeColor={(questionsPercentage < 100) ? colors.softBackgroundColor : colors.hardBackgroundColor}/>
                <Paragraph style={{ fontSize: '13px', textAlign: 'center'}}>{(questionsPercentage < 100) ? "Keep answering questions until UrbanHub understands the perfect vacation style for you!" : "UrbanHub has understood your ideal vacation style. Click on next to confirm your choices and take a look at the results!"}</Paragraph>
              </Col>
              <Row className='w-100 d-flex justify-content-center'>
              {displayedQuestions.map((question, index) => (
                <div key={question}>
                  <Row gutter={[16, 0]} align="middle">
                    <Col span={2}>
                      <Image src="https://imgur.com/R1maLDV.png" className='bot-AI' alt='bot-AI' preview={false} style={{marginBottom: '1rem', width: '120%'}} />
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
                        name={`answer${questionStartingIndex + index}`}
                      >
                        <Input.TextArea
                          value={userAnswers[questionStartingIndex + index]}
                          onChange={(e) => handleAnswerChange(questionStartingIndex + index, e.target.value)}
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
                  type = 'default'
                  style = {{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className='nextButtonSecondary'
                  onClick={() => {
                    setDisplayedQuestions(allDisplayedQuestions.slice(previousPageQuestionStartingIndex, previousPageQuestionEndingIndex+1))
                    setQuestionsPageNumber((number) => number-1)
                  }} 
                  disabled={questionsPageNumber === 0}>
                  
                    <LeftOutlined />
                    Previous questions
                </Button>
                { ((questionsPercentage < 100) && (questionsPageNumber < 2)) &&
                <Button 
                  type = 'primary'
                  style = {{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    if(allDisplayedQuestions.length === questionEndingIndex+1){
                      loadMoreQuestions();
                    }
                    else{
                      setDisplayedQuestions(allDisplayedQuestions.slice(nextPageQuestionStartingIndex, nextPageQuestionEndingIndex+1))
                    }
                    setQuestionsPageNumber((number) => number+1)
                    
                    if(questionsPageNumber === maxPageNumber){
                      setMaxPageNumber((number) => number+1)
                    }

                  }} 
                  disabled={questionsPageNumber === 2 }
                >
                  {questionsPageNumber === (maxPageNumber) ?  "More questions" : "Next questions"}
                  <RightOutlined />
                </Button>
                }
              </Col>
            </Row>
            </Row>
            <div className="mb-2 d-flex align-items-center justify-content-center">
              <Button type="default" onClick={prevStep} className="button nextButtonSecondary">
                Previous
              </Button>
              <Button type={(questionsPercentage < 100) ? "default" : "primary"} onClick={handleClickNextStep} className="button" htmlType="submit">
                Next
              </Button>
            </div>
        </div>
      </Col>
      <Col span={5}></Col>
    </Row>
  );
};

export default Step2;