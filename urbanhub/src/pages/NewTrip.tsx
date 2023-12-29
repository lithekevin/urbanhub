import React from 'react';
import { Form, Button, DatePicker, InputNumber, Input, Steps, Row, Col, AutoComplete } from 'antd';
import moment from 'moment';
import questions from '../firebase/questions'; 
import shuffle from 'lodash/shuffle';
const { Step } = Steps;
const { RangePicker } = DatePicker;

interface CustomEvent {
  target: {
    name: string;
    value: string | [string, string] | number;
  };
}

interface TripFormProps {
  onSubmit: (data: {
    destination: string;
    dateRange: [string, string];
    adults: number;
    kids: number;
    budget: number;
    questions: [string];
    answers: [string];
  }) => void;
}

const NewTrip: React.FC<TripFormProps> = () => {

  const steps = [
    {
      title: "Trip destination",
    },
    {
      title: "Trip settings",
    },
    {
      title: "Trip preferences",
    },
    {
      title: "Trip summary"
    }
  ];
  const [step, setStep] = React.useState(0);

  const [formData, setFormData] = React.useState({
    destination: '',
    dateRange: ['', ''],
    adults: 0,
    kids: 0,
    budget: 0,
    additionalInfo: '',
  });

  // Add a state variable to track the input validity
  const [isDestinationValid, setIsDestinationValid] = React.useState(false);

  const [adultsValue, setAdultsValue] = React.useState<number>(0);
  const [kidsValue, setKidsValue] = React.useState<number>(0);

  // State to track the displayed questions
  const [displayedQuestions, setDisplayedQuestions] = React.useState<string[]>([]);

  // State to store all displayed questions (including previous ones)
  const [allDisplayedQuestions, setAllDisplayedQuestions] = React.useState<string[]>([]);
 
  // New state to store user answers to questions
  const [userAnswers, setUserAnswers] = React.useState<string[]>(Array(allDisplayedQuestions.length).fill(''));
  
  const [isDestinationSelected, setIsDestinationSelected] = React.useState(false);

  // New state to track whether more questions can be loaded
  const [canLoadMoreQuestions, setCanLoadMoreQuestions] = React.useState(true);

  const handleInputChange = React.useCallback((e: CustomEvent) => {
    const { name, value } = e.target;
  
    // Check if the property is 'dateRange' and convert it to the correct type
    const updatedValue =
      name === 'dateRange' ? (typeof value === 'string' ? value.split(',') : (value as [string, string])) : value;
  
    setFormData((prevData) => ({ ...prevData, [name]: updatedValue }));
  }, [setFormData]);

  const handleDestinationChange = (value: string) => {
    setIsDestinationSelected(value !== ''); // Check if a city is selected
    handleInputChange({ target: { name: 'destination', value } } as CustomEvent);
  };

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

  React.useEffect(() => {
    // Update the form data when adultsValue or kidsValue changes
    handleInputChange({
      target: { name: 'adults', value: adultsValue },
    } as CustomEvent);
    handleInputChange({
      target: { name: 'kids', value: kidsValue },
    } as CustomEvent);
  }, [adultsValue, kidsValue, handleInputChange]);

  const handleDateRangeChange = (dates: [moment.Moment, moment.Moment]) => {
    const dateStrings = dates.map((date) => date.format('YYYY-MM-DD'));
    handleInputChange({ target: { name: 'dateRange', value: dateStrings } } as CustomEvent);
  };

  // Handle user's answers to questions
  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = value;
    setUserAnswers(updatedAnswers);
  };
  
  // New function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    return userAnswers.length === allDisplayedQuestions.length && userAnswers.every((answer) => answer.trim() !== '');
  };

  React.useEffect(() => {
    // Load the initial set of questions when the component mounts
    const initialQuestions = shuffle(questions).slice(0, 3);
    setDisplayedQuestions(initialQuestions);
    setAllDisplayedQuestions(initialQuestions);
  }, []); 

  // Render random questions and text area fields for the third step
  const renderQuestions = () => {
    if (step === 2) {
      return displayedQuestions.map((question, index) => (
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
      ));
    }
    else if (step === 3){
      return allDisplayedQuestions.map((question, index) => (
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
      ));
    }
    else{
      return null;
    }
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

  const isStepValid = () => {
    switch (step) {
      case 0:
        return isDestinationSelected && isDestinationValid;
      case 1:
        return (
          formData.dateRange[0] !== '' &&
          ( formData.adults > 0 ||
          formData.kids > 0 ) &&
          formData.budget > 0
        );
      case 2:
        return areAllQuestionsAnswered();
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (isStepValid()) {
      setStep((prevStep) => prevStep + 1);
    }
  };
  const prevStep = () => setStep((prevStep) => Math.max(prevStep - 1, 0));

  return (
    <>
    <div className='custom-stepper'>
      <Steps current={step} size="small" className="mb-3" style={{ paddingLeft: '20%', paddingRight: '20%'}}>
        {steps.map((s, index) => (
          <Step key={index} title={s.title} />
        ))}
      </Steps>
    </div>
    <Row justify="center" align="middle" style={{ minHeight: '60vh' }}>
      <Col md={{ span: 12 }}>
        <Form>
          { step === 0 && (
          <>
          <h3 className='step-title'> Choose your trip destination </h3>
          <label className='label'> Where would you want to go? </label>
          <Form.Item
                  name="destination"
                  hidden={step !== 0}
                  validateStatus={isDestinationValid ? 'success' : 'error'}
                  help={!isDestinationValid && 'Please select a valid city'}
                  style={{ width: '100%' }} 
                >
                  <AutoComplete
                    options={[
                      { value: 'Barcelona' },
                      { value: 'London' },
                      { value: 'Paris' },
                      { value: 'Rome' },
                    ]}
                    placeholder="Select a city"
                    onChange={(value) => {
                      handleDestinationChange(value);

                      // Check if the input matches any suggestion
                      const isMatch = value && [
                        'Barcelona',
                        'London',
                        'Paris',
                        'Rome',
                      ].some((suggestion) => suggestion.toLowerCase() === value.toLowerCase());
                      setIsDestinationValid(isMatch);
                    }}
                  />
                </Form.Item>
          </>
          )}
          { step === 1 && (
          <>
          <h3 className='step-title'> Select your trip settings </h3>
          <label className='label'> When would you like to go? </label>
          <Form.Item
            name="dateRange"
            hidden={step !== 1}
          >
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates, dateStrings) => handleDateRangeChange(dates as [moment.Moment, moment.Moment])}
              disabledDate={(current) => current && current < moment().endOf('day')}
            />
          </Form.Item>

          <label className='label'> How many adults are going? </label>
          <Form.Item
            name="adults"
            hidden={step !== 1}
          >
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
                <Button onClick={() => handleIncrement('adults')} style={{ width: '50%', display: 'flex', justifyContent: 'center'}}>
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
          <Form.Item
            name="budget"
            hidden={step !== 1}
          >
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
          )}
          { step === 2 && (
            <>
            <h3 className='step-title'> Set your trip preferences </h3>
            </>
          )}

          <div hidden={step !== 3}>
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

          {/* Render questions and input fields for the third step */}
          {renderQuestions()}

          {/* Load more questions button */}
          {step === 2 && displayedQuestions.length < questions.length && canLoadMoreQuestions && (
            <div className="mb-2 d-flex align-items-center justify-content-center">
              <Button type="default" onClick={loadMoreQuestions} className="button" disabled={!areAllQuestionsAnswered()}>
                Load More Questions
              </Button>
            </div>
          )}


          <div className="mb-2 d-flex align-items-center justify-content-center">
            {step > 0 && (
              <Button type="default" onClick={prevStep} className="button">
                Previous
              </Button>
            )}

            {step < 3 && (
              <Button type="primary" onClick={nextStep} className="button" htmlType="submit" disabled={!isStepValid()}>
                Next
              </Button>
            )}

            {step === 3 && (
              <Button type="primary" htmlType="submit" className="button">
                Submit
              </Button>
            )}
          </div>
        </Form>
      </Col>
    </Row>
    </>
  );
};

export default NewTrip;
