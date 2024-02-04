import React from "react";
import { Form, Steps, Row, Col, ConfigProvider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import questions from "../firebase/questions";
import shuffle from "lodash/shuffle";
import colors from "../style/colors";
import Step0 from "../components/NewTrip/Step0";
import Step1 from "../components/NewTrip/Step1";
import Step2 from "../components/NewTrip/Step2";
import Step3 from "../components/NewTrip/Step3";
const { Step } = Steps;

export const DEFAULT_LOCATION = { lat: 45.95941, lng: -47.66127 };

interface CustomEvent {
  target: {
    name: string;
    value: string | [string, string] | number;
  };
}

interface TripFormProps {
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

function NewTrip (props: TripFormProps) {

  const { onSubmit } = props;
  
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
      title: "Trip summary",
    },
  ];
  const [step, setStep] = React.useState(0);

  const [formData, setFormData] = React.useState({
    destination: "",
    dateRange: ["", ""],
    adults: 0,
    kids: 0,
    budget: 0,
    additionalInfo: "",
    questions: [""],
    answers: [""],
  });

  // Add a state variable to track the input validity
  const [isDestinationValid, setIsDestinationValid] = React.useState(true);
  const [isDestinationSelected, setIsDestinationSelected] = React.useState(false);
  const [cityPosition, setCityPosition] = React.useState({
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
  });
  const [mapZoom, setMapZoom] = React.useState(3);

  const [adultsValue, setAdultsValue] = React.useState<number>(0);
  const [kidsValue, setKidsValue] = React.useState<number>(0);

  const [questionsPageNumber, setQuestionsPageNumber] = React.useState(0);

  // State to track the displayed questions
  const [displayedQuestions, setDisplayedQuestions] = React.useState<string[]>([]);

  // State to store all displayed questions (including previous ones)
  const [allDisplayedQuestions, setAllDisplayedQuestions] = React.useState<string[]>([]);

  // New state to store user answers to questions
  const [userAnswers, setUserAnswers] = React.useState<string[]>(
    Array(allDisplayedQuestions.length).fill("")
  );

  // New state to track whether more questions can be loaded
  const [canLoadMoreQuestions, setCanLoadMoreQuestions] = React.useState(true);

  const handleInputChange = React.useCallback(
    (e: CustomEvent) => {
      const { name, value } = e.target;

      // Check if the property is 'dateRange' and convert it to the correct type
      const updatedValue =
        name === "dateRange"
          ? typeof value === "string"
            ? value.split(",")
            : (value as [string, string])
          : value;

      setFormData((prevData) => ({ ...prevData, [name]: updatedValue }));
    },
    [setFormData]
  );

  React.useEffect(() => {
    // Update the form data when adultsValue or kidsValue changes
    handleInputChange({
      target: { name: "adults", value: adultsValue },
    } as CustomEvent);
    handleInputChange({
      target: { name: "kids", value: kidsValue },
    } as CustomEvent);
  }, [adultsValue, kidsValue, handleInputChange]);

  const handleDateRangeChange = (dates: [moment.Moment, moment.Moment]) => {
    if(dates){
      const dateStrings = dates.map((date) => date.format("DD/MM/YYYY"));
      handleInputChange({
        target: { name: "dateRange", value: dateStrings },
      } as CustomEvent);
    }
  };

  // useEffect to update formData when userAnswers change
  React.useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      questions: allDisplayedQuestions,
      answers: userAnswers,
    }));
  }, [allDisplayedQuestions, userAnswers]);

  React.useEffect(() => {
    // Load the initial set of questions when the component mounts
    let initialQuestions = ["Describe me your ideal trip."];
    initialQuestions = [...initialQuestions, ...shuffle(questions).slice(0, 2)];
    setDisplayedQuestions(initialQuestions);
    setAllDisplayedQuestions(initialQuestions);
  }, []);

  React.useEffect(() => {
    // Reset the questionsPageNumber and displayedQuestions when the user changes the step
    setQuestionsPageNumber(0);
    setDisplayedQuestions(allDisplayedQuestions.slice(0, 3));
  }, [step]);

  const isStepValid = () => {
    switch (step) {
      case 0:
        return isDestinationSelected && isDestinationValid;
      case 1:
        return (
          formData.dateRange[0] !== "" &&
          (formData.adults > 0 || formData.kids > 0) &&
          formData.budget > 0
        );
      case 2:
        return true;
      default:
        return true;
    }
  };

  const navigate = useNavigate();

  const nextStep = () => {
    if (isStepValid()) {
      setStep((prevStep) => prevStep + 1);
    }
  };

  const prevStep = () => {
    if (step === 0) {
      navigate(-1);
    } else{
      setStep((prevStep) => prevStep - 1);
    }
  };

  return (
    <>
        <ConfigProvider
          theme={{
            components: {
              Steps: {
                colorPrimary: colors.hardBackgroundColor,
              },
            },
          }}
        >
          <Row className="w-100 d-flex flex-row align-items-center">
            {/* Arrow on the left */}
            <Col xs={{ span: 2 }} sm={{ span: 2 }} md={{ span: 2 }} lg={{ span: 3 }} xl={{ span: 4 }}>
              <ArrowLeftOutlined
                className="float-left"
                style={{ fontSize: "26px", marginLeft: "10px" }}
                onClick={() => prevStep()}
              />
            </Col>
            {/* Stepper centered */}
            <Col xs={{ span: 24 }} sm={{ span: 20 }} md={{ span: 20 }} lg={{ span: 18 }} xl={{ span: 16 }}>
              <div className="mb-3 center text-center">
                <Steps current={step} size="small" style={{ paddingTop: '15px' }}>
                  {steps.map((s, index) => (
                    <Step key={s.title} title={s.title} />
                  ))}
                </Steps>
              </div>
            </Col>
          </Row>
        </ConfigProvider>
      
      <Row justify={"center"} align={"top"} style={{ minHeight: "66vh" }}>
        <Col
          sm={{ span: 24 }}
          md={{ span: 20 }}
          lg={{ span: 18 }}
          xl={{ span: 12 }}
        >
          <Form>
            {step === 0 && (
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
                step={step}
                nextStep={nextStep}
              />
            )}
            {step === 1 && (
              <Step1
                step={step}
                handleDateRangeChange={handleDateRangeChange}
                adultsValue={adultsValue}
                setAdultsValue={setAdultsValue}
                kidsValue={kidsValue}
                setKidsValue={setKidsValue}
                handleInputChange={handleInputChange}
                formData={formData}
                prevStep={prevStep}
                nextStep={nextStep}
              />
            )}
            {step === 2 && (
              <Step2
                step={step}
                displayedQuestions={displayedQuestions}
                setDisplayedQuestions={setDisplayedQuestions}
                allDisplayedQuestions={allDisplayedQuestions}
                setAllDisplayedQuestions={setAllDisplayedQuestions}
                setCanLoadMoreQuestions={setCanLoadMoreQuestions}
                userAnswers={userAnswers}
                setUserAnswers={setUserAnswers}
                questionsPageNumber={questionsPageNumber}
                setQuestionsPageNumber={setQuestionsPageNumber}
                prevStep={prevStep}
                nextStep={nextStep}
              />
            )}
            {step === 3 && (
              <Step3
                step={step}
                formData={formData}
                prevStep={prevStep}
                onSubmit={onSubmit}
              />
            )}
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default NewTrip;
