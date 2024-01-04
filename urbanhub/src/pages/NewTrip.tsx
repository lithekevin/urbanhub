import React from 'react';
import { Form, Button, Steps, Row, Col, ConfigProvider } from 'antd';
import moment from 'moment';
import questions from '../firebase/questions'; 
import shuffle from 'lodash/shuffle';
import colors from '../style/colors';
import Step0 from '../components/Step0';
import Step1 from '../components/Step1';
import Step2 from '../components/Step2';
import Step3 from '../components/Step3';
const { Step } = Steps;

const DEFAULT_LOCATION = { lat: 48.7758, lng: 9.1829 };

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
  const [isDestinationValid, setIsDestinationValid] = React.useState(true);
  const [isDestinationSelected, setIsDestinationSelected] = React.useState(false);
  const [cityPosition, setCityPosition] = React.useState({lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng});
  const [mapZoom, setMapZoom] = React.useState(4);
  
  const [adultsValue, setAdultsValue] = React.useState<number>(0);
  const [kidsValue, setKidsValue] = React.useState<number>(0);

  const [questionsPageNumber, setQuestionsPageNumber] = React.useState(0);

  // State to track the displayed questions
  const [displayedQuestions, setDisplayedQuestions] = React.useState<string[]>([]);

  // State to store all displayed questions (including previous ones)
  const [allDisplayedQuestions, setAllDisplayedQuestions] = React.useState<string[]>([]);
 
  // New state to store user answers to questions
  const [userAnswers, setUserAnswers] = React.useState<string[]>(Array(allDisplayedQuestions.length).fill(''));

  // New state to track whether more questions can be loaded
  const [canLoadMoreQuestions, setCanLoadMoreQuestions] = React.useState(true);

  const handleInputChange = React.useCallback((e: CustomEvent) => {
    const { name, value } = e.target;
  
    // Check if the property is 'dateRange' and convert it to the correct type
    const updatedValue =
      name === 'dateRange' ? (typeof value === 'string' ? value.split(',') : (value as [string, string])) : value;
  
    setFormData((prevData) => ({ ...prevData, [name]: updatedValue }));
  }, [setFormData]);

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
  
  // New function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    return userAnswers.length === 9;
  };

  React.useEffect(() => {
    // Load the initial set of questions when the component mounts
    let initialQuestions = ["Describe me your ideal trip."];
    initialQuestions = [...initialQuestions, ...shuffle(questions).slice(0, 2)]
    setDisplayedQuestions(initialQuestions);
    setAllDisplayedQuestions(initialQuestions);
  }, []); 

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
  const prevStep = () => setStep((prevStep) => prevStep - 1 );
  
  return (
    <>
    <div className='custom-stepper'>
    <ConfigProvider
      theme={{
        components: {
          Steps: {
            colorPrimary: colors.hardBackgroundColor,
          },
        },
      }} 
    >
      <Row className='w-100 d-flex flex-row justify-content-center'>
        <Col xs={{span:24}} sm={{span: 24}} md={{span: 20}} lg={{span: 18}} xl={{span: 12}}>
          <Steps current={step} size="small" className="mb-3" style={{paddingLeft: "0%", paddingRight: "0%"}}>
              {steps.map((s, index) => (
                <Step key={index} title={s.title} />
              ))}
          </Steps>
        </Col>
      </Row>
      
    </ConfigProvider>
    </div>
    <Row justify={'center'} align={"top"} style={{ minHeight: '66vh' }}>
      <Col sm={{span: 24}} md={{ span: 20 }} lg={{span: 18}} xl={{span: 12}}>
        <Form>
          { step === 0 && (
            <Step0 
              isDestinationSelected={isDestinationSelected} 
              setIsDestinationSelected={setIsDestinationSelected}
              isDestinationValid={isDestinationValid}
              setIsDestinationValid={setIsDestinationValid} 
              cityPosition={cityPosition}
              setCityPosition={setCityPosition}
              mapZoom={mapZoom}
              setMapZoom={setMapZoom}
              formData={formData}
              handleInputChange={handleInputChange}
              step = {step}
            />
          )}
          { step === 1 && (
              <Step1
                step={step}
                handleDateRangeChange={handleDateRangeChange}
                adultsValue={adultsValue}
                setAdultsValue={setAdultsValue}
                kidsValue={kidsValue}
                setKidsValue={setKidsValue}
                handleInputChange={handleInputChange}
                formData={formData}
              />
          )}
          { step === 2 && (
            <Step2
              step={step}
              displayedQuestions={displayedQuestions}
              setDisplayedQuestions={setDisplayedQuestions}
              allDisplayedQuestions={allDisplayedQuestions}
              setAllDisplayedQuestions={setAllDisplayedQuestions}
              canLoadMoreQuestions={canLoadMoreQuestions}
              setCanLoadMoreQuestions={setCanLoadMoreQuestions}
              areAllQuestionsAnswered={areAllQuestionsAnswered}
              userAnswers={userAnswers}
              setUserAnswers={setUserAnswers}
              questionsPageNumber={questionsPageNumber}
              setQuestionsPageNumber={setQuestionsPageNumber}
            />
          )}
          { step === 3 && (
            <Step3
              step={step}
              allDisplayedQuestions={allDisplayedQuestions}
              userAnswers={userAnswers}
              formData={formData}
            />
          )}
          <div className="mb-2 d-flex align-items-center justify-content-center">
            {step > 0 && (
              <Button type="default" onClick={prevStep} className="button">
                Previous
              </Button>
            )}

            {step < 3 && (
              <Button type='primary' onClick={nextStep} className="button" htmlType="submit" disabled={!isStepValid()}>
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
