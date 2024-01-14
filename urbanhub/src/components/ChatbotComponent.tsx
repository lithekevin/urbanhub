import { CollapseProps, Timeline, Collapse, Row, Col, Button, Space, Input, Modal, message, DatePicker, TimePicker, Form, Select, AutoComplete} from 'antd';
import { useState, useEffect } from 'react';
import { getTripById, editAttraction, deleteAttraction, addAttractionToTrip } from "../firebase/daos/dao-trips";
import cities from "../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../models/trip";
import { TripAttraction } from '../models/tripAttraction';
import GoogleMapsComponent from "../components/GoogleMapsComponent";

/*
   USAGE:
    -delete: 'Delete "Attraction to delete" from DD/MM/AAAA'
    -add: 'Add "Attraction to add" to DD/MM/AAAA with time: hh:mm - hh:mm'
    -edit: 'Edit "Attraction to edit" from DD/MM/AAAA to have time: hh:mm - hh:mm' 
*/


interface ChatbotProps {
    tripState: {
      value: Trip | null;
      setter: React.Dispatch<React.SetStateAction<Trip | null>>;
    };
    dirtyState: {
      value: boolean;
      setter: React.Dispatch<React.SetStateAction<boolean>>;
    };
    tripId: string | undefined;
    messageApi: any;
  }
  
  function Chatbot(props: ChatbotProps) {
    const { tripState, dirtyState, tripId, messageApi } = props;
    const [scrollRatio, setScrollRatio] = useState(0);
  
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
  
      const maxScroll = documentHeight - windowHeight;
      const currentScrollRatio = scrollTop / maxScroll;
      setScrollRatio(currentScrollRatio);
    };
  
    useEffect(() => {
      window.addEventListener('scroll', handleScroll);
  
      // Clean up the event listener when the component is unmounted
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, []);
  
      const { TextArea } = Input;
  
      const [message, setMessage] = useState('Is there anything I can do for you?');
      const [undoVisibility, setUndoVisibility] = useState(false);
      const [inputValue, setInputValue] = useState('');
  
      const updateMessage = (msg: string) => {
        setMessage(msg);
      };
  
      const handleUndoClick = () => {
        setUndoVisibility(false);
        setMessage('Operation undone, is there anything else I can do for you?');
        setInputValue('');
      };
  
      function parseInput(input: string) {
        const regexDelete = /^(delete|Delete) "(.+)" from (\d{2}\/\d{2}\/\d{4})$/;  //Ex: 'Delete "Attraction to delete" from 12/01/2024'
        const matchDelete = input.match(regexDelete);
        const regexAdd = /^(add|Add) "(.+)" to (\d{2}\/\d{2}\/\d{4}) with time: (\d{2}:\d{2}) - (\d{2}:\d{2})$/; //Ex: 'Add "Attraction to add" to 12/01/2024 with time: 00:00 - 04:00'
        const matchAdd = input.match(regexAdd);
        const regexEdit = /^(edit|Edit) "(.+)" from (\d{2}\/\d{2}\/\d{4}) to have time: (\d{2}:\d{2}) - (\d{2}:\d{2})$/; //Ex: 'Edit "Attraction to edit" from 12/01/2024 to have time: 00:00 - 04:00'
        const matchEdit = input.match(regexEdit);
    
  
        if(matchDelete){
          const [, action, inputAttraction, date] = matchDelete;
  
          //Check if date is valid and if it is in the range of the trip
          const attractionDate = dayjs(date, 'DD/MM/YYYY', true);
  
          if(!attractionDate.isValid()){
            //Date not valid
            console.log("Invalid date");
            return;
          }
  
          const startDate = tripState.value?.startDate;  
          const endDate = tripState.value?.endDate;  
  
          if(!((attractionDate.isAfter(startDate) || attractionDate.isSame(startDate)) && (attractionDate.isBefore(endDate) || attractionDate.isSame(endDate)))){
            //Date not in range
            console.log("Date is not in range of the current trip");
            return;
          }
  
          //Check if attraction exists and if it is in the specified day
          let attractionsForDay: TripAttraction[] = [];
  
          let closestKey: dayjs.Dayjs | null = null;
          let minDifference: number | null = null;
  
          tripState.value?.schedule.forEach((attractions, key) => {
            const difference = Math.abs(attractionDate.diff(key, 'days'));
  
            if (minDifference === null || difference < minDifference) {
              minDifference = difference;
              closestKey = key;
            }
          });
  
          if (closestKey !== null) {
            attractionsForDay = tripState.value?.schedule.get(closestKey) || [];
          }
  
          let attractionId : string = "";
          attractionsForDay.forEach((attraction) => {
            if(attraction.name === inputAttraction){
              attractionId = attraction.id;
            }
          });
  
          if(attractionId === ""){
            //Attraction has not been found in specified day
            console.log("Attraction not found in the specified date");
            return;
          }
          
          //If everything is good, delete the attraction
          void (async () => {
            try {
              if (tripId) {
                await deleteAttraction(tripId, attractionDate, attractionId);
                dirtyState.setter(true);
          
                // Show success message
                messageApi.open({
                  type: 'success',
                  content: 'Attraction deleted successfully!',
                  duration: 3,
                  style: {
                    marginTop: '70px',
                  },
                });
              }
            } catch (error) {
              console.error('Error deleting attraction:', error);
          
              // Show error message
              messageApi.open({
                type: 'error',
                content: 'Error while deleting attraction!',
                duration: 3,
                style: {
                  marginTop: '70px',
                },
              });
            }
          })();
        } else if (matchAdd){
          const [, action, attractionName, date, startTime, endTime] = matchAdd;
          
          //Check if date is valid and if it is in the range of the trip
          const attractionDate = dayjs(date, 'DD/MM/YYYY', true);
  
          if(!attractionDate.isValid()){
            //Date not valid
            console.log("Invalid date");
            return;
          }
  
          const startDate = tripState.value?.startDate;  
          const endDate = tripState.value?.endDate;  
  
          if(!((attractionDate.isAfter(startDate) || attractionDate.isSame(startDate)) && (attractionDate.isBefore(endDate) || attractionDate.isSame(endDate)))){
            //Date not in range
            console.log("Date is not in range of the current trip");
            return;
          }
  
          //Check if start and nd time are both valid
          const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
          const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);
  
          const isValidHourAndMinute = (hours: number, minutes: number): boolean => {
            return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
          }
  
          if (!(isValidHourAndMinute(startTimeHH, startTimeMM) && isValidHourAndMinute(endTimeHH, endTimeMM))) {
            console.log("Time slot invalid");
            return;
          }
  
          if (startTimeHH > endTimeHH || (startTimeHH === endTimeHH && startTimeMM >= endTimeMM)) {
            console.log("Start time must be before end time");
            return; 
          }
  
          
          //Check if the requested attraction exists for that trip
          let attractions = cities.find(city => city.name === tripState.value?.city)?.attractions;
          let attractionId : string = "";
  
          attractions?.forEach((attraction) => {
            if(attraction.name === attractionName){
              attractionId = attraction.id;
            }
          });
  
          if(attractionId === ""){
            //Attraction has not been found in current trip
            console.log("Attraction not found in the current trip");
            return;
          }
  
          //Check if the selected time slot is available
          let attractionsForDay: TripAttraction[] = [];
  
          let closestKey: dayjs.Dayjs | null = null;
          let minDifference: number | null = null;
  
          tripState.value?.schedule.forEach((attractions, key) => {
            const difference = Math.abs(attractionDate.diff(key, 'days'));
  
            if (minDifference === null || difference < minDifference) {
              minDifference = difference;
              closestKey = key;
            }
          });
  
          if (closestKey !== null) {
            attractionsForDay = tripState.value?.schedule.get(closestKey) || [];
          }
          
          let slotAvailable : boolean = true;
          attractionsForDay.forEach((attraction) => {
            let attStartTime = attraction.startDate.format("HH:mm");
            let attEndTime = attraction.endDate.format("HH:mm");
  
            const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
            const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);
            const [attStartTimeHH, attStartTimeMM] = attStartTime.split(':').map(Number);
            const [attEndTimeHH, attEndTimeMM] = attEndTime.split(':').map(Number);
  
            if (
              ((startTimeHH > attStartTimeHH || (startTimeHH === attStartTimeHH && startTimeMM >= attStartTimeMM)) &&
                (startTimeHH < attEndTimeHH || (startTimeHH === attEndTimeHH && startTimeMM <= attEndTimeMM))) ||
                ((endTimeHH > attStartTimeHH || (endTimeHH === attStartTimeHH && endTimeMM >= attStartTimeMM)) &&
                (endTimeHH < attEndTimeHH || (endTimeHH === attEndTimeHH && endTimeMM <= attEndTimeMM)))
            ) {
              slotAvailable = false;
            } 
          });
  
          if(!slotAvailable){
            console.log("Selected time slot overlap with the one of an existent attraction");
            return;
          }
  
          //Everything ok, add attraction
          if(tripId){
            const attraction = {
              id: attractionId,
              startDate: startTime,
              endDate: endTime,
            };
  
            addAttractionToTrip(tripId, attractionDate.format('DD/MM/YYYY'), attraction);
            dirtyState.setter(true);
          }      
        } else if (matchEdit){
          const [, action, attractionName, date, startTime, endTime] = matchEdit;
          
          //Check if date is valid and if it is in the range of the trip
          const attractionDate = dayjs(date, 'DD/MM/YYYY', true);
  
          if(!attractionDate.isValid()){
            //Date not valid
            console.log("Invalid date");
            return;
          }
  
          const startDate = tripState.value?.startDate;  
          const endDate = tripState.value?.endDate;  
  
          if(!((attractionDate.isAfter(startDate) || attractionDate.isSame(startDate)) && (attractionDate.isBefore(endDate) || attractionDate.isSame(endDate)))){
            //Date not in range
            console.log("Date is not in range of the current trip");
            return;
          }
  
          //Check if start and end time are both valid
          const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
          const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);
  
          const isValidHourAndMinute = (hours: number, minutes: number): boolean => {
            return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
          }
  
          if (!(isValidHourAndMinute(startTimeHH, startTimeMM) && isValidHourAndMinute(endTimeHH, endTimeMM))) {
            console.log("Time slot invalid");
            return;
          }
  
          if (startTimeHH > endTimeHH || (startTimeHH === endTimeHH && startTimeMM >= endTimeMM)) {
            console.log("Start time must be before end time");
            return; 
          }
  
          //Check if attraction exists and if it is in the specified day
          let attractionsForDay: TripAttraction[] = [];
  
          let closestKey: dayjs.Dayjs | null = null;
          let minDifference: number | null = null;
  
          tripState.value?.schedule.forEach((attractions, key) => {
            const difference = Math.abs(attractionDate.diff(key, 'days'));
  
            if (minDifference === null || difference < minDifference) {
              minDifference = difference;
              closestKey = key;
            }
          });
  
          if (closestKey !== null) {
            attractionsForDay = tripState.value?.schedule.get(closestKey) || [];
          }
  
          let attractionId : string = "";
          attractionsForDay.forEach((attraction) => {
            if(attraction.name === attractionName){
              attractionId = attraction.id;
            }
          });
  
          if(attractionId === ""){
            //Attraction has not been found in specified day
            console.log("Attraction not found in the specified date");
            return;
          }        
  
          //Check if the selected time slot is available        
          let slotAvailable : boolean = true;
          attractionsForDay.forEach((attraction) => {
            let attStartTime = attraction.startDate.format("HH:mm");
            let attEndTime = attraction.endDate.format("HH:mm");
  
            const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
            const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);
            const [attStartTimeHH, attStartTimeMM] = attStartTime.split(':').map(Number);
            const [attEndTimeHH, attEndTimeMM] = attEndTime.split(':').map(Number);
  
            if (
              ((startTimeHH > attStartTimeHH || (startTimeHH === attStartTimeHH && startTimeMM >= attStartTimeMM)) &&
                (startTimeHH < attEndTimeHH || (startTimeHH === attEndTimeHH && startTimeMM <= attEndTimeMM))) ||
                ((endTimeHH > attStartTimeHH || (endTimeHH === attStartTimeHH && endTimeMM >= attStartTimeMM)) &&
                (endTimeHH < attEndTimeHH || (endTimeHH === attEndTimeHH && endTimeMM <= attEndTimeMM)))
            ) {
              if(attraction.name !== attractionName){
                slotAvailable = false;
              }
            } 
          });
  
          if(!slotAvailable){
            console.log("Selected time slot overlap with the one of an other attraction");
            return;
          }
  
          //Everything ok, edit attraction
          if(tripId){
            const attraction = {
              id: attractionId,
              startDate: startTime,
              endDate: endTime,
            };
  
            addAttractionToTrip(tripId, attractionDate.format('DD/MM/YYYY'), attraction);
            editAttraction(tripId, attractionId , attractionDate, attractionDate.format('DD/MM/YYYY'), attraction);
            dirtyState.setter(true);
          }      
        } else{
            console.log("Error: Invalid input format");
            return;
        }
      }
  
      const handleSendClick = () => {
        if(inputValue !== ''){
          setUndoVisibility(true);
          updateMessage('Here is the proposed solution to your problem');
          const text : string = inputValue;
          parseInput(text);
          setInputValue('');
        }
      };
  
      const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
      };
  
      return (
        <div className="chatbot-style" style={{ transform: `translateY(calc(-${scrollRatio * 100}% - 10px))` }}>
        <Row justify="space-between">
          <Col xs={24} sm={24} md={11}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
              <img src={"/robotassistant.png"} alt="UrbanHub assistant" style={{ width: 'auto', height: '70px', marginRight: '10px' }} />
              <div style={{ flex: '1', position: 'relative', backgroundColor: '#fff', padding: '10px', borderRadius: '10px' }}>
                <div style={{ position: 'absolute', top: '50%', left: '-10px', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '10px solid #fff', backgroundColor: 'white' }} />
                <p>{message}</p>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={24} md={11}>
            <Space.Compact style={{ width: '100%' }}>
            <TextArea placeholder="Ask something to UrbanHub..." value={inputValue} onChange={handleInputChange} autoSize={{ minRows: 1, maxRows: 3 }} />
              <Button type="primary" onClick={handleSendClick}>Send</Button>
              {undoVisibility && (<Button type="primary" onClick={handleUndoClick}>Undo</Button>)}
            </Space.Compact>
          </Col>
        </Row>
        </div>
    );
  };

export default Chatbot;