import React from 'react';
import { Form, Button, DatePicker, InputNumber, Input, Steps, Row, Col, AutoComplete, ConfigProvider, Progress } from 'antd';
import moment from 'moment';
import questions from '../firebase/questions'; 
import shuffle from 'lodash/shuffle';
import colors from '../style/colors';
import cities from '../firebase/cities';
import { GoogleMap, Marker } from '@react-google-maps/api';
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

const DEFAULT_LOCATION = { lat: 48.7758, lng: 9.1829 };

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
    let initialQuestions = ["Describe me your ideal trip."];
    initialQuestions = [...initialQuestions, ...shuffle(questions).slice(0, 2)]
    setDisplayedQuestions(initialQuestions);
    setAllDisplayedQuestions(initialQuestions);
  }, []); 

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

  console.log("displayed: ", displayedQuestions, "all: ", allDisplayedQuestions);

  

  // Render random questions and text area fields for the third step
  const renderQuestions = () => {
    if (step === 2) {

      return <>
        <Row className='w-100 d-flex justify-content-center'>
          <Col xs={{span:24}} className='w-100 d-flex flex-column justify-content-center align-items-center mb-4'>
            <Progress className='w-75' percent={userAnswers.filter(a => a.length !== 0).length * 100/9}  showInfo={false} />
            <small>{(userAnswers.filter(a => a.length !== 0).length * 100/9 < 100) ? "Keep answering questions until UrbanHub understand the perfect vacation style for you!" : "UrbanHub has understood your ideal vacation style. Click on next to confirm your choices and take a look at the results!"}</small>
          </Col>

        <div className='w-100'>
          {
            displayedQuestions.map((question, index) => (
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
            ))
          }

          </div>

          <Row className='w-100'>
            <Col span={24} className='d-flex flex-row justify-content-between'>
              <Button onClick={() => {

                setDisplayedQuestions(allDisplayedQuestions.slice((questionsPageNumber-1)*3, (questionsPageNumber-1)*3+3))

                setQuestionsPageNumber((number) => number-1)
                
                }} disabled={questionsPageNumber === 0}>{"<"}</Button>
              {
                questionsPageNumber < 2 &&
                
                <Button onClick={() => {

                  if(allDisplayedQuestions.length === questionsPageNumber*3+3){
                    loadMoreQuestions();
                  }
                  else{

                    setDisplayedQuestions(allDisplayedQuestions.slice((questionsPageNumber+1)*3, (questionsPageNumber+1)*3+3))

                  }
  
                  setQuestionsPageNumber((number) => number+1)
                  
                  
  
                  }} disabled={questionsPageNumber === 2 || userAnswers.slice(questionsPageNumber*3, questionsPageNumber*3+3).length < 3 || userAnswers.slice(questionsPageNumber*3, questionsPageNumber*3+3).some((ans) => ans.length === 0)}>{">"}</Button>
              
              }
              
            </Col>
          </Row>

        </Row>
      </>
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
                    options={cities.map((city) => ({ value: city.name }))}
                    placeholder="Select a city"
                    filterOption = {(inputValue, option) => {
                      return option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }}
                    value={formData.destination}
                    onChange={(value) => {
                      // Check if the input matches any suggestion
                      const isMatch = value && cities.map((city) => (city.name )).some((suggestion) => suggestion.toLowerCase() === value.toLowerCase());
                      setIsDestinationValid(!!isMatch);

                      if(isMatch){
                        const selectedCity = cities.find((city) => city.name.toLowerCase() === value.toLowerCase());
                        setCityPosition({lat: selectedCity?.location.latitude || DEFAULT_LOCATION.lat, lng: selectedCity?.location.longitude || DEFAULT_LOCATION.lng});
                        setMapZoom(7);
                      }
                      else{
                        setCityPosition({lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng});
                        setMapZoom(4);
                      }

                      handleDestinationChange(value.charAt(0).toUpperCase() + value.slice(1));                      
                    }}
                  />

                  

                </Form.Item>
                <Row className='mt-3 mb-3'>
                    <Col span={24}>

                    <GoogleMap mapContainerStyle={{width: "100%", height: "300px", borderRadius: "10px", border: "2px solid " + colors.softBackgroundColor, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)"}} center={cityPosition} zoom={mapZoom}>
                      {
                        formData.destination && cities.map((city) => (city.name )).some((suggestion) => suggestion.toLowerCase() === formData.destination.toLowerCase()) &&
                          <Marker position={new google.maps.LatLng({lat: cityPosition.lat, lng: cityPosition.lng})} />
                      }
                    </GoogleMap>

                    </Col>
                </Row>
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
