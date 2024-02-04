import React from 'react';
import { Form, InputNumber, DatePicker, Modal } from 'antd';
import moment from 'moment';
import { editSettings } from '../../firebase/daos/dao-trips';
import { Trip } from '../../models/trip';

interface EditTripSettingsProps {
  form1: any;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  trip: Trip | null;
  visible: boolean;
}

function EditTripSettings(props: EditTripSettingsProps) {

  const { form1, setDirty, setVisible, trip, visible } = props;

  const handleCancel = () => {
      setVisible(false);
  };
  
  const handleUpdateTrip = async () => {
      try {
      const values = await form1.validateFields();
  
      if (trip) {
          trip.nAdults = values.nAdults;
          trip.nKids = values.nKids;
          trip.startDate = values.dateRange[0].format('DD-MM-YYYY');
          trip.endDate = values.dateRange[1].format('DD-MM-YYYY');
          trip.budget = values.budget; // Extract budget from form values
      }
  
      try {
          // Call editSettings and wait for it to complete
          const success = await editSettings(trip?.id, trip);
          if (success) setDirty(true);
      } catch (error) {
          console.error('Error while saving: ', error);
          // Handle the error as needed
      }
  
      setVisible(false);
      } catch (error) {
      console.error('Error updating trip details:', error);
      }
  };
  
  return (
      <Modal
        title="Edit Trip Details"
        open={visible}
        onOk={handleUpdateTrip}
        onCancel={handleCancel}
        destroyOnClose
      >
          <Form form={form1} layout="vertical">
          <Form.Item
              label="Number of Adults"
              name="nAdults"
              rules={[{ required: true, message: 'Please enter the number of adults' }]}
          >
              <InputNumber style = {{width: "100%"}} min={1} />
          </Form.Item>
          <Form.Item
              label="Number of Kids"
              name="nKids"
              rules={[{ required: true, message: 'Please enter the number of kids' }]}
          >
              <InputNumber style = {{width: "100%"}} min={0} />
          </Form.Item>
          <Form.Item
              label="Budget"
              name="budget"
              rules={[{ required: true, message: 'Please enter the budget' }]}
          >
              <InputNumber style = {{width: "100%"}} min={0} />
          </Form.Item>
          <Form.Item
              label="Date Range"
              name="dateRange"
              rules={[{ required: true, message: 'Please select the date range' }]}
          >
              <DatePicker.RangePicker style = {{width: "100%"}} format="DD-MM-YYYY" disabledDate={(current) => current && current < moment().startOf('day')} />
          </Form.Item>
          </Form>
      </Modal>
  );
}

export default EditTripSettings;