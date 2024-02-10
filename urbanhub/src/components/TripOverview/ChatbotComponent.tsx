import { Button, Input, Typography, Image, Flex, Tooltip  } from 'antd';
import { useState, useEffect } from 'react';
import { editAttraction, deleteAttraction, addAttractionToTrip, editTrip } from "../../firebase/daos/dao-trips";
import cities from "../../firebase/cities";
import dayjs from 'dayjs';
import { Trip } from "../../models/trip";
import { TripAttraction } from '../../models/tripAttraction';

const { Text } = Typography;
/*
   USAGE:
    -delete: 'Delete "Attraction to delete" from DD/MM/AAAA'
    -add: 'Add "Attraction to add" to DD/MM/AAAA with time: hh:mm - hh:mm'
    -edit: 'Edit "Attraction to edit" from DD/MM/AAAA to have time: hh:mm - hh:mm' 
    -edit: 'Edit "Attraction to edit" from DD/MM/AAAA to DD/MM/AAAA with time: hh:mm - hh:mm'
    All commands can be inserted with capital letter (delete/Delete for example)
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
    undoState: {
      value: boolean;
      setter: React.Dispatch<React.SetStateAction<boolean>>;
    };
    messageAIState: {
      value: string;
      setter: React.Dispatch<React.SetStateAction<string>>;
    };
    tripId: string | undefined;
    messageApi: any;
}
  
function Chatbot(props: ChatbotProps) {
  const { tripState, dirtyState, undoState, messageAIState, tripId, messageApi } = props;

  //Used for undo operation
  const [tripUpdates, setTripUpdates] = useState<Trip | null>(null);

  const { TextArea } = Input;

  const [inputValue, setInputValue] = useState('');

  const [halfWindowWidth, setHalfWindowWidth] = useState(0);

  const [messageAI, setMessageAI] = useState('Is there anything I can do for you?'); 

  useEffect(() => {
    const calculateHalfWindowWidth = () => {
      const windowWidth = window.innerWidth;
      const halfWidth = Math.floor(windowWidth / 2);
      setHalfWindowWidth(halfWidth);
    };

    // Calculate half window width on initial render
    calculateHalfWindowWidth();

    // Recalculate half window width on window resize
    const handleResize = () => {
      calculateHalfWindowWidth();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const updateMessage = (msg: string) => {
    messageAIState.setter(msg);
  };

  const handleUndoClick = () => {
    undoState.setter(false);
    editTrip(tripState.value?.id, tripUpdates);
    dirtyState.setter(true);
    messageAIState.setter('Operation undone, is there anything else I can do for you?');
    setInputValue('');
  };

  function parseInput(input: string) {
    const regexDelete = /^(delete|Delete) "(.+)" from (\d{2}\/\d{2}\/\d{4})$/;  //Ex: 'Delete "Attraction to delete" from 12/01/2024'
    const matchDelete = input.match(regexDelete);
    const regexAdd = /^(add|Add) "(.+)" to (\d{2}\/\d{2}\/\d{4}) with time: (\d{2}:\d{2}) - (\d{2}:\d{2})$/; //Ex: 'Add "Attraction to add" to 12/01/2024 with time: 00:00 - 04:00'
    const matchAdd = input.match(regexAdd);
    const regexEdit = /^(edit|Edit) "(.+)" from (\d{2}\/\d{2}\/\d{4}) to have time: (\d{2}:\d{2}) - (\d{2}:\d{2})$/; //Ex: 'Edit "Attraction to edit" from 12/01/2024 to have time: 00:00 - 04:00'
    const matchEdit = input.match(regexEdit);
    const regexEditDay = /^(edit|Edit) "(.+)" from (\d{2}\/\d{2}\/\d{4}) to (\d{2}\/\d{2}\/\d{4}) with time: (\d{2}:\d{2}) - (\d{2}:\d{2})$/; //Ex: 'Edit "Attraction to edit" from DD/MM/AAAA to DD/MM/AAAA with time: hh:mm - hh:mm'
    const matchEditDay = input.match(regexEditDay);

    const tempTrip = Object.assign({}, tripState.value);


    if(matchDelete){
      const [, , inputAttraction, date] = matchDelete;

      //Check if date is valid and if it is in the range of the trip
      const attractionDate = dayjs(date, 'DD/MM/YYYY', true);

      if(!attractionDate.isValid()){
        //Date not valid
        updateMessage("Invalid date format, please try again");
        return;
      }

      const startDate = tripState.value?.startDate;  
      const endDate = tripState.value?.endDate;  

      if(!((attractionDate.isAfter(startDate) || attractionDate.isSame(startDate)) && (attractionDate.isBefore(endDate) || attractionDate.isSame(endDate)))){
        //Date not in range
        updateMessage("Date is not in range of the current trip, please try again");
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
        updateMessage("Attraction not found in the specified date, please try again");
        return;
      }
      
      //If everything is good, delete the attraction
      void (async () => {
        try {
          if (tripId) {
            await deleteAttraction(tripId, attractionDate, attractionId);
            dirtyState.setter(true);
            updateMessage(inputAttraction + " deleted succesfully. Is there anything else I can do for you?");
            undoState.setter(true);
            setTripUpdates(tempTrip);
      
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
          updateMessage("An error occurred while trying to delete " + inputAttraction + ". Please try again");
      
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
      const [, , attractionName, date, startTime, endTime] = matchAdd;
      
      //Check if date is valid and if it is in the range of the trip
      const attractionDate = dayjs(date, 'DD/MM/YYYY', true);

      if(!attractionDate.isValid()){
        //Date not valid
        updateMessage("Invalid date format, please try again");
        return;
      }

      const startDate = tripState.value?.startDate;  
      const endDate = tripState.value?.endDate;  

      if(!((attractionDate.isAfter(startDate) || attractionDate.isSame(startDate)) && (attractionDate.isBefore(endDate) || attractionDate.isSame(endDate)))){
        //Date not in range
        updateMessage("Date is not in range of the current trip, please try again");
        return;
      }

      //Check if start and nd time are both valid
      const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
      const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);

      const isValidHourAndMinute = (hours: number, minutes: number): boolean => {
        return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      }

      if (!(isValidHourAndMinute(startTimeHH, startTimeMM) && isValidHourAndMinute(endTimeHH, endTimeMM))) {
        updateMessage("Time slot invalid, please try again");
        return;
      }

      if (startTimeHH > endTimeHH || (startTimeHH === endTimeHH && startTimeMM >= endTimeMM)) {
        updateMessage("Start time must be before end time, please try again");
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
        updateMessage("Attraction not found in the current trip, please try again");
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
        updateMessage("Selected time slot overlap with the one of an existent attraction, please try again");
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
        updateMessage(attractionName + " added succesfully in date " + date + " with time: " + startTime + " - " + endTime);
        dirtyState.setter(true);
        undoState.setter(true);
        setTripUpdates(tempTrip);
      }      
    } else if (matchEdit){
      const [, , attractionName, date, startTime, endTime] = matchEdit;
      
      //Check if date is valid and if it is in the range of the trip
      const attractionDate = dayjs(date, 'DD/MM/YYYY', true);

      if(!attractionDate.isValid()){
        //Date not valid
        updateMessage("Invalid date format, please try again");
        return;
      }

      const startDate = tripState.value?.startDate;  
      const endDate = tripState.value?.endDate;  

      if(!((attractionDate.isAfter(startDate) || attractionDate.isSame(startDate)) && (attractionDate.isBefore(endDate) || attractionDate.isSame(endDate)))){
        //Date not in range
        updateMessage("Date is not in range of the current trip, please try again");
        return;
      }

      //Check if start and end time are both valid
      const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
      const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);

      const isValidHourAndMinute = (hours: number, minutes: number): boolean => {
        return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      }

      if (!(isValidHourAndMinute(startTimeHH, startTimeMM) && isValidHourAndMinute(endTimeHH, endTimeMM))) {
        updateMessage("Time slot invalid, please try again");
        return;
      }

      if (startTimeHH > endTimeHH || (startTimeHH === endTimeHH && startTimeMM >= endTimeMM)) {
        updateMessage("Start time must be before end time, please try again");
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
        updateMessage("Attraction not found in the specified date, please try again");
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
        updateMessage("Selected time slot overlap with the one of an other attraction, please try again");
        return;
      }

      //Everything ok, edit attraction
      if(tripId){
        const attraction = {
          id: attractionId,
          startDate: startTime,
          endDate: endTime,
        };

        editAttraction(tripId, attractionId , attractionDate, attractionDate.format('DD/MM/YYYY'), attraction);
        updateMessage(attractionName + " edited succesfully, new time scheduling is " + startTime + " - " + endTime);
        dirtyState.setter(true);
        undoState.setter(true);
        setTripUpdates(tempTrip);
      }      
    } else if(matchEditDay){
      const [, , attractionName, oldDate, newDate, startTime, endTime] = matchEditDay;

      //Check if oldDate is valid and if it is in the range of the trip
      const attractionDateOld = dayjs(oldDate, 'DD/MM/YYYY', true);

      if(!attractionDateOld.isValid()){
        //Date not valid
        updateMessage("Invalid date format, please try again");
        return;
      }

      const startDateOld = tripState.value?.startDate;  
      const endDateOld = tripState.value?.endDate;  

      if(!((attractionDateOld.isAfter(startDateOld) || attractionDateOld.isSame(startDateOld)) && (attractionDateOld.isBefore(endDateOld) || attractionDateOld.isSame(endDateOld)))){
        //Date not in range
        updateMessage("Date is not in range of the current trip, please try again");
        return;
      }

      //Check if newDate is valid and if it is in the range of the trip
      const attractionDateNew = dayjs(newDate, 'DD/MM/YYYY', true);

      if(!attractionDateNew.isValid()){
        //Date not valid
        updateMessage("Invalid date format, please try again");
        return;
      }

      const startDateNew = tripState.value?.startDate;  
      const endDateNew = tripState.value?.endDate;  

      if(!((attractionDateNew.isAfter(startDateNew) || attractionDateNew.isSame(startDateNew)) && (attractionDateNew.isBefore(endDateNew) || attractionDateNew.isSame(endDateNew)))){
        //Date not in range
        updateMessage("Date is not in range of the current trip, please try again");
        return;
      }

      //Check if start and end time are both valid
      const [startTimeHH, startTimeMM] = startTime.split(':').map(Number);
      const [endTimeHH, endTimeMM] = endTime.split(':').map(Number);

      const isValidHourAndMinute = (hours: number, minutes: number): boolean => {
        return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      }

      if (!(isValidHourAndMinute(startTimeHH, startTimeMM) && isValidHourAndMinute(endTimeHH, endTimeMM))) {
        updateMessage("Time slot invalid, please try again");
        return;
      }

      if (startTimeHH > endTimeHH || (startTimeHH === endTimeHH && startTimeMM >= endTimeMM)) {
        updateMessage("Start time must be before end time, please try again");
        return; 
      }

      //Check if attraction exists and if it is in the specified day
      let attractionsForDayOld: TripAttraction[] = [];

      let closestKeyOld: dayjs.Dayjs | null = null;
      let minDifferenceOld: number | null = null;

      tripState.value?.schedule.forEach((attractions, key) => {
        const difference = Math.abs(attractionDateOld.diff(key, 'days'));

        if (minDifferenceOld === null || difference < minDifferenceOld) {
          minDifferenceOld = difference;
          closestKeyOld = key;
        }
      });

      if (closestKeyOld !== null) {
        attractionsForDayOld = tripState.value?.schedule.get(closestKeyOld) || [];
      }

      let attractionId : string = "";
      attractionsForDayOld.forEach((attraction) => {
        if(attraction.name === attractionName){
          attractionId = attraction.id;
        }
      });

      if(attractionId === ""){
        //Attraction has not been found in specified day
        updateMessage("Attraction not found in the specified date, please try again");
        return;
      }        

      //Check if the selected time slot is available in the new day
      let attractionsForDayNew: TripAttraction[] = [];

      let closestKeyNew: dayjs.Dayjs | null = null;
      let minDifferenceNew: number | null = null;

      tripState.value?.schedule.forEach((attractions, key) => {
        const difference = Math.abs(attractionDateNew.diff(key, 'days'));

        if (minDifferenceNew === null || difference < minDifferenceNew) {
          minDifferenceNew = difference;
          closestKeyNew = key;
        }
      });

      if (closestKeyNew !== null) {
        attractionsForDayNew = tripState.value?.schedule.get(closestKeyNew) || [];
      }     

      let slotAvailable : boolean = true;
      attractionsForDayNew.forEach((attraction) => {
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
        updateMessage("Selected time slot overlap with the one of an other attraction, please try again");
        return;
      }

      //Everything ok, edit attraction
      if(tripId){
        const attraction = {
          id: attractionId,
          startDate: startTime,
          endDate: endTime,
        };

        editAttraction(tripId, attractionId , attractionDateOld, newDate, attraction);
        updateMessage(attractionName + " edited succesfully, new day is " + attractionDateNew.format('DD/MM/YYYY') + " with time " + startTime + " - " + endTime);
        dirtyState.setter(true);
        undoState.setter(true);
        setTripUpdates(tempTrip);
      }      
    } else{
      updateMessage("Invalid input format, please try again");
        return;
    }
  }

  const handleSendClick = () => {
    if(inputValue !== ''){
      const text : string = inputValue;
      parseInput(text);
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <Flex align='center' justify='space-between'>
      <Flex style={{ alignItems: 'center', display: 'flex'}}>
        <Image src={"https://imgur.com/ijeaJNU.png"} alt="UrbanHub assistant" preview={false} width={60}/>
        <Text>{messageAIState.value}</Text>
      </Flex>
      <Flex style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
      <Tooltip overlayInnerStyle={{ width: '250%', maxWidth: halfWindowWidth, color: 'black', backgroundColor: 'white', boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)' }} color="white" placement="topLeft"
      title={inputValue === "" ? (
        <span>
          USAGE:
          <br />
          -delete: 'Delete "Attraction to delete" from DD/MM/AAAA'
          <br />
          -add: 'Add "Attraction to add" to DD/MM/AAAA with time: hh:mm - hh:mm'
          <br />
          -edit: 'Edit "Attraction to edit" from DD/MM/AAAA to have time: hh:mm - hh:mm'
          <br />
          -edit: 'Edit "Attraction to edit" from DD/MM/AAAA to DD/MM/AAAA with time: hh:mm - hh:mm'
          <br />
          All commands can be inserted also without capital letter (delete/Delete for example)
        </span>
    ) : ''}
  >
      <TextArea
          placeholder="Ask something to UrbanHub..."
          value={inputValue}
          onChange={handleInputChange}
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{ marginRight: '10px', width: 'calc(100% - 20px)' }} 
        />
      </Tooltip>
        <Button type="primary" onClick={handleSendClick} style={{ width: '100px' }}>Send</Button>
        {undoState.value && (<Button type="primary" onClick={handleUndoClick} style={{ width: '100px' }}>Undo</Button>)}
      </Flex>
    </Flex>
  );
};

export default Chatbot;