import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { Steps } from 'antd';

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
    title: "Trip overview"
  }
];

interface TripFormProps {
  onSubmit: (data: {
    destination: string;
    startDate: string;
    endDate: string;
    adults: number;
    kids: number;
    budget: number;
    additionalInfo: string;
  }) => void;
}

const NewTrip: React.FC<TripFormProps> = ({ onSubmit }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    adults: 0,
    kids: 0,
    budget: 0,
    additionalInfo: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 3) {
      onSubmit(formData); // Submit the data only in the final step
    }
  };

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));

  const nextStep = () => setStep((prevStep) => Math.min(prevStep + 1, 3));
  const prevStep = () => setStep((prevStep) => Math.max(prevStep - 1, 0));

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <Row>
          <Col md={{ span: 12 }}>
          {/* Ant Design Steps */}
          <Steps current={step} items={items} size="small" className="mb-3">
          </Steps>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="Destination" hidden={step !== 0}>
              <Form.Label>Destination</Form.Label>
              <Form.Control
                type="text"
                name="destination"
                placeholder="Enter destination"
                value={formData.destination}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="Trip settings" hidden={step !== 1}>
              <Form.Group controlId="Start date">
                <Form.Label>Start date</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
                </Form.Group>
              <Form.Group controlId="End date">
                <Form.Label>End date</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group controlId="Number of adults">
                <Form.Label>Number of adults</Form.Label>
                <Form.Control
                  type="number"
                  name="adults"
                  value={formData.adults}
                  onChange={handleInputChange}
                />
                </Form.Group>
              <Form.Group controlId="Number of kids">
                <Form.Label>Number of kids</Form.Label>
                <Form.Control
                  type="number"
                  name="kids"
                  value={formData.kids}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group controlId="Budget">
                <Form.Label>Budget</Form.Label>
                <Form.Control
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Form.Group>

            {/* Step 2 content goes here */}

            <div hidden={step !== 3}>
              <h4>Summary</h4>
              <br />
              <p>
                <strong>Destination:</strong> {formData.destination}
              </p>
              <p>
                <strong>Start Date:</strong> {formData.startDate}
              </p>
              <p>
                <strong>End Date:</strong> {formData.endDate}
              </p>
              <p>
                <strong>Number of Adults:</strong> {formData.adults}
              </p>
              <p>
                <strong>Number of Kids:</strong> {formData.kids}
              </p>
              <p>
                <strong>Budget:</strong> {formData.budget}
              </p>
              {/* You can add more fields as needed */}
            </div>

            <div className="mb-2 d-flex align-items-center justify-content-center">
              {step > 0 && (
                <Button variant="secondary" onClick={prevStep} className='button'>
                  Previous
                </Button>
              )}

              {step < 3 && (
                <Button variant="primary" onClick={nextStep} className='button'>
                  Next
                </Button>
              )}

              {step === 3 && (
                <Button variant="primary" type="submit" className='button'>
                  Submit
                </Button>
              )}
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default NewTrip;
