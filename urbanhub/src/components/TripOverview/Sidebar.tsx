import React from "react";
import { Col } from "react-bootstrap";
import {
  Alert,
  Collapse,
  CollapseProps,
  Typography,
  Button,
  Flex,
  Spin,
} from "antd";
import { Trip } from "../../models/trip";
import colors from "../../style/colors";
import DailyAttractions from "./DailyAttractions";
import dayjs from "dayjs";
import { TripAttraction } from "../../models/tripAttraction";
import { MessageInstance } from "antd/es/message/interface";

const { Title, Paragraph } = Typography;

interface SidebarProps {
  activeKeyState: {
    value: string | string[];
    setter: React.Dispatch<React.SetStateAction<string | string[]>>;
  };
  attractionDistances: string[];
  dayLabels: string[];
  editing: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  errorState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  form: any;
  loadingState: {
    value: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  };
  messageApi: MessageInstance;
  contextHolder: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingAttraction: React.Dispatch<
    React.SetStateAction<TripAttraction | null>
  >;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMessageAI: React.Dispatch<React.SetStateAction<string>>;
  setSelectedAttractionId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDay: React.Dispatch<React.SetStateAction<dayjs.Dayjs | null>>;
  setUndoVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  travelModel: string;
  trip: Trip | null;
  tripId: string | undefined;
  tripState: {
    value: Trip | null;
    setter: React.Dispatch<React.SetStateAction<Trip | null>>;
  };
  attractionCardHoveredID: {
    value: string | null;
    setter: React.Dispatch<React.SetStateAction<string | null>>;
  };
}

function Sidebar(props: SidebarProps) {
  const {
    activeKeyState,
    attractionDistances,
    dayLabels,
    editing,
    form,
    errorState,
    loadingState,
    messageApi,
    setDirty,
    setEditingAttraction,
    setIsFormVisible,
    setMessageAI,
    setSelectedAttractionId,
    setSelectedDay,
    setUndoVisibility,
    travelModel,
    trip,
    tripId,
    tripState,
    contextHolder,
    attractionCardHoveredID,
  } = props;

  const dailyActivities: CollapseProps["items"] = dayLabels.map(
    (dayLabel, index) => ({
      key: `${index}`,
      label: dayLabel,
      children: (
        <div>
          <DailyAttractions
            attractionDistances={attractionDistances}
            editing={editing.value}
            form={form}
            day={dayjs(dayLabel, "DD/MM/YYYY")}
            messageApi={messageApi}
            contextHolder={contextHolder}
            setDirty={setDirty}
            setEditingAttraction={setEditingAttraction}
            setIsFormVisible={setIsFormVisible}
            setMessageAI={setMessageAI}
            setSelectedAttractionId={setSelectedAttractionId}
            setSelectedDay={setSelectedDay}
            setUndoVisibility={setUndoVisibility}
            travelModel={travelModel}
            trip={trip}
            tripId={tripId}
            attractionCardHoveredID={{
              value: attractionCardHoveredID.value,
              setter: attractionCardHoveredID.setter,
            }}
          />
        </div>
      ),
    })
  );

  const openForm = () => {
    form.resetFields();
    setEditingAttraction(null);
    setIsFormVisible(true);
  };

  return (
    <>
      {loadingState.value && (
        <Spin tip="Loading" size="large" fullscreen/>
      )}
      {errorState.value && (
        <Col>
          <Alert
            message={<Title level={3}>Oh snap! You got an error!</Title>}
            showIcon
            description={
              <>
                <Paragraph> Error while loading trips. </Paragraph>
                <Paragraph> Please refresh the page. </Paragraph>
              </>
            }
            type="error"
            style={{ width: "fit-content", margin: "auto", marginTop: "20px" }}
          />
        </Col>
      )}
      {!loadingState.value && !errorState.value && tripState.value && (
        <>
          <div>
            <Flex style={{ display: "flex", alignItems: "center", marginBottom: '10px' }} align="middle" justify="flex-start">
              <Title
                level={3}
                style={{ marginRight: "1vw", marginBottom: 0 }}
              >
                {tripState.value.city}
              </Title>
              <Button
                type="primary"
                style={{ backgroundColor: colors.hardBackgroundColor, marginLeft:'2%' }}
                onClick={() => openForm()}
                className="button-new-trip"
              >
                Add Attraction
              </Button>
            </Flex>
          </div>
          <div className="sidebar-div">
            <Collapse
              size="large"
              items={dailyActivities}
              accordion={true}
              activeKey={activeKeyState.value}
              onChange={(keys) => activeKeyState.setter(keys)}
            />
          </div>
        </>
      )}
    </>
  );
}

export default Sidebar;
